'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

// Cliente Admin com Service Role Key para bypass de RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validação de segurança
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('⚠️ SUPABASE_SERVICE_ROLE_KEY não está definida!')
}

// ===== INTERFACES =====

interface CancelBookingResult {
    success: boolean
    error?: string
}

interface RescheduleResult {
    success: boolean
    error?: string
}

export interface AvailableSlot {
    id: string
    start_time: string
    type: string
    max_capacity: number
    current_bookings_count: number
    available_spots: number
}

interface GetSlotsResult {
    success: boolean
    slots?: AvailableSlot[]
    error?: string
}

// ===== CANCEL BOOKING =====

/**
 * Server Action para cancelar uma reserva.
 * 
 * 1. Atualiza o status da reserva para 'CANCELLED'
 * 2. Decrementa o current_bookings_count do slot para liberar vagas
 * 3. Revalida o path para atualizar a UI
 */
export async function cancelBooking(
    bookingId: string,
    slotId: string,
    peopleCount: number
): Promise<CancelBookingResult> {
    try {
        // Passo A: Atualizar status da reserva para CANCELLED
        const { error: bookingError } = await supabaseAdmin
            .from('bookings')
            .update({ status: 'CANCELLED' })
            .eq('id', bookingId)

        if (bookingError) {
            console.error('Error cancelling booking:', bookingError)
            return {
                success: false,
                error: 'Erro ao cancelar a reserva. Tente novamente.'
            }
        }

        // Passo B: Decrementar current_bookings_count do slot + Reset do tipo se ficar vazio
        const { data: slotData, error: slotFetchError } = await supabaseAdmin
            .from('slots')
            .select('current_bookings_count')
            .eq('id', slotId)
            .single()

        if (slotFetchError) {
            console.error('Error fetching slot:', slotFetchError)
        } else if (slotData) {
            const newCount = Math.max(0, (slotData.current_bookings_count || 0) - peopleCount)

            console.log('🔍 [CANCEL] Estado do slot:', {
                slotId,
                countAntes: slotData.current_bookings_count,
                newCount
            })

            // Lógica de Reset: Se o slot ficou vazio, força type = 'OPEN'
            // Isso impede "slots zumbis" (vazios mas fechados)
            const slotUpdateData: { current_bookings_count: number; type?: string } = {
                current_bookings_count: newCount
            }
            if (newCount === 0) {
                slotUpdateData.type = 'OPEN'
                console.log('✅ [CANCEL] Slot ficou vazio, resetando type para OPEN')
            }

            const { error: slotUpdateError } = await supabaseAdmin
                .from('slots')
                .update(slotUpdateData)
                .eq('id', slotId)

            if (slotUpdateError) {
                console.error('Error updating slot count:', slotUpdateError)
            } else {
                console.log('🏁 [CANCEL] Slot atualizado com sucesso:', slotUpdateData)
            }
        }

        // Passo C: Revalidar o path para atualizar a UI
        revalidatePath(`/agendamento/${bookingId}`)

        return { success: true }

    } catch (error) {
        console.error('Unexpected error in cancelBooking:', error)
        return {
            success: false,
            error: 'Erro inesperado. Tente novamente.'
        }
    }
}

// ===== GET AVAILABLE SLOTS =====

/**
 * Server Action para buscar slots disponíveis para reagendamento.
 * Aplica regras de negócio OPEN vs CLOSED:
 * 
 * - CLOSED: Apenas slots totalmente vazios (exclusividade)
 * - OPEN: Slots OPEN com espaço OU slots vazios
 */
export async function getAvailableSlots(
    date: string,
    bookingType: 'OPEN' | 'CLOSED',
    peopleCount: number,
    currentSlotId: string
): Promise<GetSlotsResult> {
    try {
        // Buscar todos os slots do dia
        const startOfDay = `${date}T00:00:00`
        const endOfDay = `${date}T23:59:59`

        const { data: slots, error } = await supabaseAdmin
            .from('slots')
            .select('id, start_time, type, max_capacity, current_bookings_count, status')
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay)
            .neq('id', currentSlotId) // Excluir slot atual
            .eq('status', 'AVAILABLE') // Apenas slots disponíveis (não em manutenção)
            .order('start_time', { ascending: true })

        if (error) {
            console.error('Error fetching slots:', error)
            return { success: false, error: 'Erro ao buscar horários.' }
        }

        // Filtrar slots baseado nas regras de negócio
        const filteredSlots = (slots || []).filter(slot => {
            const availableSpots = (slot.max_capacity || 15) - (slot.current_bookings_count || 0)

            if (bookingType === 'CLOSED') {
                // CLOSED: Apenas slots totalmente vazios
                return slot.current_bookings_count === 0
            } else {
                // OPEN: Slots vazios OU slots OPEN com espaço suficiente
                const isEmptySlot = slot.current_bookings_count === 0
                const isOpenWithSpace = slot.type === 'OPEN' && availableSpots >= peopleCount

                return isEmptySlot || isOpenWithSpace
            }
        }).map(slot => ({
            ...slot,
            available_spots: (slot.max_capacity || 15) - (slot.current_bookings_count || 0)
        }))

        return { success: true, slots: filteredSlots }

    } catch (error) {
        console.error('Unexpected error in getAvailableSlots:', error)
        return { success: false, error: 'Erro inesperado.' }
    }
}

// ===== RESCHEDULE BOOKING =====

/**
 * Server Action para reagendar uma reserva.
 * Transaction-Safe: Valida regras e executa troca atômica.
 * 
 * 1. Valida se o novo slot atende às regras do tipo da reserva
 * 2. Decrementa vaga no slot antigo
 * 3. Incrementa vaga no slot novo
 * 4. Atualiza slot_id na reserva
 * 5. Se slot estava vazio, herda o tipo da reserva
 */
export async function rescheduleBooking(
    bookingId: string,
    oldSlotId: string,
    newSlotId: string,
    bookingType: 'OPEN' | 'CLOSED',
    peopleCount: number
): Promise<RescheduleResult> {
    try {
        // VALIDAÇÃO 1: Verificar limite de reagendamento da reserva
        const { data: booking, error: bookingFetchError } = await supabaseAdmin
            .from('bookings')
            .select('reschedule_count')
            .eq('id', bookingId)
            .single()

        if (bookingFetchError || !booking) {
            return { success: false, error: 'Reserva não encontrada.' }
        }

        const currentRescheduleCount = booking.reschedule_count || 0
        if (currentRescheduleCount >= 1) {
            return { success: false, error: 'Você já atingiu o limite de 1 reagendamento permitido.' }
        }

        // VALIDAÇÃO 2: Buscar novo slot e verificar regras
        const { data: newSlot, error: newSlotError } = await supabaseAdmin
            .from('slots')
            .select('id, type, max_capacity, current_bookings_count, status')
            .eq('id', newSlotId)
            .single()

        if (newSlotError || !newSlot) {
            return { success: false, error: 'Horário não encontrado.' }
        }

        // SEGURANÇA: Bloquear slots em manutenção
        if (newSlot.status !== 'AVAILABLE') {
            return { success: false, error: 'Este horário está indisponível ou em manutenção.' }
        }

        const availableSpots = (newSlot.max_capacity || 15) - (newSlot.current_bookings_count || 0)

        // Verificar regras de negócio
        if (bookingType === 'CLOSED') {
            if (newSlot.current_bookings_count !== 0) {
                return { success: false, error: 'Bateria fechada requer horário vazio.' }
            }
        } else {
            // OPEN
            const isEmptySlot = newSlot.current_bookings_count === 0
            const isOpenWithSpace = newSlot.type === 'OPEN' && availableSpots >= peopleCount

            if (!isEmptySlot && !isOpenWithSpace) {
                return { success: false, error: 'Horário sem vagas suficientes.' }
            }
        }

        // PASSO 1: Decrementar vaga no slot antigo + Reset do tipo se ficar vazio
        const { data: oldSlot } = await supabaseAdmin
            .from('slots')
            .select('current_bookings_count')
            .eq('id', oldSlotId)
            .single()

        if (oldSlot) {
            const oldNewCount = Math.max(0, (oldSlot.current_bookings_count || 0) - peopleCount)

            // Lógica de Reset: Se o slot ficou vazio, força type = 'OPEN'
            // Isso impede que baterias fechadas deixem o slot bloqueado após saírem
            const oldSlotUpdateData: { current_bookings_count: number; type?: string } = {
                current_bookings_count: oldNewCount
            }
            if (oldNewCount === 0) {
                oldSlotUpdateData.type = 'OPEN'
            }

            await supabaseAdmin
                .from('slots')
                .update(oldSlotUpdateData)
                .eq('id', oldSlotId)
        }

        // PASSO 2: Incrementar vaga no slot novo
        const wasEmpty = newSlot.current_bookings_count === 0
        const newCount = (newSlot.current_bookings_count || 0) + peopleCount

        // Se o slot estava vazio, herda o tipo da reserva
        const updateData: { current_bookings_count: number; type?: string } = {
            current_bookings_count: newCount
        }
        if (wasEmpty) {
            updateData.type = bookingType
        }

        const { error: updateSlotError } = await supabaseAdmin
            .from('slots')
            .update(updateData)
            .eq('id', newSlotId)

        if (updateSlotError) {
            console.error('Error updating new slot:', updateSlotError)
            return { success: false, error: 'Erro ao atualizar horário.' }
        }

        // PASSO 3: Atualizar slot_id, updated_at e incrementar reschedule_count na reserva
        const { error: updateBookingError } = await supabaseAdmin
            .from('bookings')
            .update({
                slot_id: newSlotId,
                updated_at: new Date().toISOString(),
                reschedule_count: currentRescheduleCount + 1
            })
            .eq('id', bookingId)

        if (updateBookingError) {
            console.error('Error updating booking:', updateBookingError)
            return { success: false, error: 'Erro ao atualizar reserva.' }
        }

        // Revalidar path
        revalidatePath(`/agendamento/${bookingId}`)

        return { success: true }

    } catch (error) {
        console.error('Unexpected error in rescheduleBooking:', error)
        return { success: false, error: 'Erro inesperado.' }
    }
}

// ===== CREATE BOOKING (ADMIN) =====

interface CreateBookingParams {
    name: string
    phone: string
    slotId: string
    peopleCount: number
    totalAmount: number
    bookingType: 'OPEN' | 'CLOSED'
}

interface CreateBookingResult {
    success: true
    bookingId: string
    managementToken: string
    customerId: string
}

interface CreateBookingError {
    success: false
    error: string
    code?: 'CAPACITY_EXCEEDED' | 'CUSTOMER_ERROR' | 'BOOKING_ERROR' | 'SLOT_ERROR' | 'UNKNOWN'
}

type CreateBookingResponse = CreateBookingResult | CreateBookingError

/**
 * Server Action para criar uma nova reserva (COM BYPASS DE RLS).
 * 
 * FLUXO BLINDADO:
 * 1. Busca slot atual para verificar estado (current_bookings_count)
 * 2. Valida capacidade disponível
 * 3. Upsert do cliente (busca ou cria por telefone)
 * 4. Cria a reserva na tabela bookings
 * 5. Atualiza o slot: incrementa contador + define type se estava vazio
 */
export async function createBookingAdmin(
    params: CreateBookingParams
): Promise<CreateBookingResponse> {
    const { name, phone, slotId, peopleCount, totalAmount, bookingType } = params

    console.log("\uD83D\uDE80 [DEBUG] Iniciando createBookingAdmin")
    console.log("\uD83D\uDCE5 Dados recebidos:", { slotId, bookingType, peopleCount })

    try {
        // ===== 1. Buscar estado atual do slot =====
        const { data: slot, error: slotError } = await supabaseAdmin
            .from('slots')
            .select('id, current_bookings_count, max_capacity, type')
            .eq('id', slotId)
            .single()

        if (slotError || !slot) {
            console.error('Error fetching slot:', slotError)
            return {
                success: false,
                error: 'Horário não encontrado.',
                code: 'SLOT_ERROR'
            }
        }

        // Salvar estado antes da reserva
        const slotEstavaVazio = (slot.current_bookings_count || 0) === 0
        const vagasDisponiveis = (slot.max_capacity || 15) - (slot.current_bookings_count || 0)

        console.log("\uD83D\uDD0D Estado do Slot Antes:", {
            id: slot.id,
            count: slot.current_bookings_count,
            type: slot.type
        })
        console.log("\u2753 Slot estava vazio?", slotEstavaVazio)

        // Validar capacidade
        if (vagasDisponiveis < peopleCount) {
            return {
                success: false,
                error: 'Vagas insuficientes para este horário.',
                code: 'CAPACITY_EXCEEDED'
            }
        }

        // Validar compatibilidade de tipos
        if (!slotEstavaVazio && bookingType === 'CLOSED') {
            return {
                success: false,
                error: 'Bateria fechada requer horário vazio.',
                code: 'CAPACITY_EXCEEDED'
            }
        }
        if (!slotEstavaVazio && slot.type === 'CLOSED') {
            return {
                success: false,
                error: 'Este horário está reservado para bateria fechada.',
                code: 'CAPACITY_EXCEEDED'
            }
        }

        // ===== 2. Gestão do Cliente (Upsert) =====
        const { data: existingCustomer } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('phone', phone)
            .maybeSingle()

        let customerId: string

        if (existingCustomer) {
            customerId = existingCustomer.id
            await supabaseAdmin
                .from('customers')
                .update({ name })
                .eq('id', customerId)
        } else {
            const { data: newCustomer, error: createError } = await supabaseAdmin
                .from('customers')
                .insert({ name, phone })
                .select('id')
                .single()

            if (createError || !newCustomer) {
                console.error('Error creating customer:', createError)
                return {
                    success: false,
                    error: 'Erro ao cadastrar cliente.',
                    code: 'CUSTOMER_ERROR'
                }
            }
            customerId = newCustomer.id
        }

        // ===== 3. Criar a Reserva =====
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert({
                slot_id: slotId,
                customer_id: customerId,
                people_count: peopleCount,
                total_amount: totalAmount
            })
            .select('id, management_token')
            .single()

        if (bookingError || !booking) {
            console.error('Booking error:', bookingError)
            return {
                success: false,
                error: 'Erro ao criar reserva.',
                code: 'BOOKING_ERROR'
            }
        }

        // ===== 4. Atualizar o Slot (Contador + Tipo) =====
        const novaContagem = (slot.current_bookings_count || 0) + peopleCount

        // Lógica de Herança de Tipo:
        // SE o slot estava vazio → define type = bookingType
        // SENÃO → mantém o type atual (respeita quem chegou primeiro)
        const slotUpdateData: { current_bookings_count: number; type?: string } = {
            current_bookings_count: novaContagem
        }
        if (slotEstavaVazio) {
            slotUpdateData.type = bookingType
            console.log("\u2705 ENTROU NO IF: Vai forçar update para:", bookingType)
        } else {
            console.log("\u26D4 NÃO ENTROU NO IF. Motivo: Slot já tinha gente.")
        }

        const { error: updateSlotError } = await supabaseAdmin
            .from('slots')
            .update(slotUpdateData)
            .eq('id', slotId)

        if (updateSlotError) {
            console.error('Error updating slot:', updateSlotError)
            console.log("\uD83C\uDFC1 Fim da execução. Erro?", updateSlotError)
        } else {
            console.log("\uD83C\uDFC1 Fim da execução. Erro?", null)
            console.log("\u2705 Slot atualizado com sucesso:", slotUpdateData)
        }

        // ===== Sucesso =====
        return {
            success: true,
            bookingId: booking.id,
            managementToken: booking.management_token,
            customerId
        }

    } catch (error) {
        console.error('Unexpected error in createBookingAdmin:', error)
        return {
            success: false,
            error: 'Erro inesperado. Tente novamente.',
            code: 'UNKNOWN'
        }
    }
}
