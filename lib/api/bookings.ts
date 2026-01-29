import { supabase } from '@/lib/supabase'

// ===== Types =====

export interface CreateBookingParams {
    name: string
    phone: string
    slotId: string
    peopleCount: number
    totalAmount: number
    bookingType: 'OPEN' | 'CLOSED'  // Tipo da bateria para herança no slot
}

export interface CreateBookingResult {
    success: true
    bookingId: string
    managementToken: string
    customerId: string
}

export interface CreateBookingError {
    success: false
    error: string
    code?: 'CAPACITY_EXCEEDED' | 'CUSTOMER_ERROR' | 'BOOKING_ERROR' | 'UNKNOWN'
}

export type CreateBookingResponse = CreateBookingResult | CreateBookingError

// ===== API Functions =====

/**
 * Cria uma nova reserva no sistema.
 * 
 * 1. Verifica capacidade e estado do slot
 * 2. Faz upsert do cliente (busca ou cria por telefone)
 * 3. Cria a reserva na tabela bookings
 * 4. Atualiza o slot (contador + tipo se estava vazio)
 * 5. Retorna o management_token gerado pelo banco
 * 
 * @throws Captura erros do TRIGGER de capacidade e retorna mensagem amigável
 */
export async function createBooking(params: CreateBookingParams): Promise<CreateBookingResponse> {
    const { name, phone, slotId, peopleCount, totalAmount, bookingType } = params

    try {
        // ===== 0. Verificar estado atual do slot =====
        const { data: slotData, error: slotError } = await supabase
            .from('slots')
            .select('current_bookings_count, max_capacity, type')
            .eq('id', slotId)
            .single()

        if (slotError || !slotData) {
            console.error('Error fetching slot:', slotError)
            return {
                success: false,
                error: 'Horário não encontrado.',
                code: 'BOOKING_ERROR'
            }
        }

        const slotWasEmpty = (slotData.current_bookings_count || 0) === 0

        // ===== 1. Gestão do Cliente (Upsert) =====
        // Primeiro tenta buscar cliente existente pelo telefone
        const { data: existingCustomer, error: findError } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', phone)
            .maybeSingle()

        if (findError) {
            console.error('Error finding customer:', findError)
            return {
                success: false,
                error: 'Erro ao verificar cadastro do cliente.',
                code: 'CUSTOMER_ERROR'
            }
        }

        let customerId: string

        if (existingCustomer) {
            // Cliente já existe - atualiza o nome (caso tenha mudado)
            customerId = existingCustomer.id

            await supabase
                .from('customers')
                .update({ name })
                .eq('id', customerId)
        } else {
            // Cliente não existe - cria novo registro
            const { data: newCustomer, error: createError } = await supabase
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

        // ===== 2. Criação da Reserva =====
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                slot_id: slotId,
                customer_id: customerId,
                people_count: peopleCount,
                total_amount: totalAmount
                // status omitido: banco usa DEFAULT 'CONFIRMED'
            })
            .select('id, management_token')
            .single()

        // ===== 3. Tratamento de Erro do TRIGGER =====
        if (bookingError) {
            console.error('Booking error:', bookingError)

            // Verifica se é erro de capacidade do TRIGGER (handle_new_booking)
            const errorMessage = bookingError.message?.toLowerCase() || ''

            if (
                errorMessage.includes('capacity') ||
                errorMessage.includes('capacidade') ||
                errorMessage.includes('exceeded') ||
                errorMessage.includes('excedida') ||
                errorMessage.includes('vagas')
            ) {
                return {
                    success: false,
                    error: 'Vagas esgotadas para este horário. Por favor, escolha outro horário.',
                    code: 'CAPACITY_EXCEEDED'
                }
            }

            return {
                success: false,
                error: 'Erro ao criar reserva. Por favor, tente novamente.',
                code: 'BOOKING_ERROR'
            }
        }

        if (!booking) {
            return {
                success: false,
                error: 'Erro inesperado ao criar reserva.',
                code: 'BOOKING_ERROR'
            }
        }

        // ===== 4. Atualizar tipo do slot se estava vazio (Herança de Tipo) =====
        // Se o slot estava vazio, força o type para o tipo da reserva
        // Isso garante que baterias fechadas bloqueiem o slot corretamente
        if (slotWasEmpty) {
            await supabase
                .from('slots')
                .update({ type: bookingType })
                .eq('id', slotId)
        }

        // ===== Sucesso =====
        return {
            success: true,
            bookingId: booking.id,
            managementToken: booking.management_token,
            customerId
        }

    } catch (error) {
        console.error('Unexpected error in createBooking:', error)
        return {
            success: false,
            error: 'Erro inesperado. Por favor, tente novamente.',
            code: 'UNKNOWN'
        }
    }
}

/**
 * Busca uma reserva pelo management_token.
 * Útil para páginas de confirmação/cancelamento.
 */
export async function getBookingByToken(managementToken: string) {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      id,
      status,
      people_count,
      total_amount,
      created_at,
      slot:slots (
        id,
        start_time,
        end_time
      ),
      customer:customers (
        id,
        name,
        phone
      )
    `)
        .eq('management_token', managementToken)
        .single()

    if (error || !data) {
        return null
    }

    return data
}

/**
 * Cancela uma reserva pelo management_token.
 */
export async function cancelBooking(managementToken: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('management_token', managementToken)

    if (error) {
        console.error('Error cancelling booking:', error)
        return {
            success: false,
            error: 'Erro ao cancelar reserva.'
        }
    }

    return { success: true }
}
