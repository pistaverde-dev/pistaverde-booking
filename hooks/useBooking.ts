"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { BUSINESS_CONFIG } from '@/lib/config'
import { createBookingAdmin } from '@/app/agendamento/[id]/actions'

// Types
export interface Slot {
    id: string
    start_time: string
    end_time: string
    max_capacity: number
    current_bookings_count: number
    type: 'OPEN' | 'CLOSED'
    status: string
}

export type BookingType = 'OPEN' | 'PRIVATE'
export type WizardStep = 1 | 2 | 3

export interface PricingInfo {
    subtotal: number
    discount: number
    total: number
}

export interface BookingResult {
    bookingId: string
    managementToken: string
}

export interface UseBookingReturn {
    // States
    selectedDate: Date | undefined
    displayDate: string
    displayTime: string
    peopleCount: number
    bookingType: BookingType
    isLoading: boolean
    availableSlots: Slot[]
    filteredSlots: Slot[]
    selectedSlotId: string | null
    showMinWarning: boolean
    showParticipantWarning: boolean
    pricing: PricingInfo

    // Modal States (Separados)
    isCalendarModalOpen: boolean
    isBookingModalOpen: boolean

    // Wizard States
    step: WizardStep
    customerName: string
    customerPhone: string
    isSubmitting: boolean
    submitError: string | null
    bookingResult: BookingResult | null

    // Actions
    setSelectedDate: (date: Date | undefined) => void
    handleSlotSelect: (slotId: string) => void
    handleConfirmSlotSelection: () => void
    handlePeopleIncrement: () => void
    handlePeopleDecrement: () => void
    handleBookingTypeChange: (value: BookingType) => void

    // Modal Actions
    openCalendarModal: () => void
    closeCalendarModal: () => void
    openBookingModal: () => void
    closeBookingModal: () => void

    // Wizard Actions
    setCustomerName: (name: string) => void
    setCustomerPhone: (phone: string) => void
    goToPreviousStep: () => void
    handleConfirmBooking: () => Promise<void>
    resetWizard: () => void
    resetBookingState: () => void
}

/**
 * Hook centralizado para gerenciamento de reservas
 * * FLUXO:
 * 1. Usuário seleciona Tipo de Bateria (OPEN/PRIVATE)
 * 2. Usuário seleciona Número de Participantes
 * 3. Usuário abre Calendário (modal separado) - slots filtrados pela regra de negócio
 * 4. Seleciona horário → Modal fecha, volta pra home
 * 5. Clica "Reservar Agora" → Abre modal de dados (wizard Step 2)
 */
export function useBooking(): UseBookingReturn {
    // Core States
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [displayDate, setDisplayDate] = useState<string>('Selecionar')
    const [displayTime, setDisplayTime] = useState<string>('Selecionar')
    const [peopleCount, setPeopleCount] = useState<number>(1)
    const [bookingType, setBookingType] = useState<BookingType>('OPEN')

    // UI States
    const [isLoading, setIsLoading] = useState(false)
    const [showMinWarning, setShowMinWarning] = useState(false)
    const [showParticipantWarning, setShowParticipantWarning] = useState(false)

    // Modal States (SEPARADOS - Calendário vs Wizard de Reserva)
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

    // Slot States
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

    // Wizard States
    const [step, setStep] = useState<WizardStep>(1)
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

    // ===== Helper Functions =====

    const formatDisplayDate = (date: Date): string => {
        const dayOfWeek = format(date, 'EEEE', { locale: ptBR })
        const dayAbbr = dayOfWeek.slice(0, 3)
        const dayCapitalized = dayAbbr.charAt(0).toUpperCase() + dayAbbr.slice(1)

        const month = format(date, 'MMMM', { locale: ptBR })
        const monthAbbr = month.slice(0, 3)
        const monthCapitalized = monthAbbr.charAt(0).toUpperCase() + monthAbbr.slice(1)

        const dayNumber = format(date, 'dd')

        return `${dayCapitalized}, ${dayNumber} de ${monthCapitalized}`
    }

    const formatPhoneMask = (value: string): string => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 2) return numbers
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }

    /**
     * Formata nome para Title Case
     * - Converte tudo para minúsculo
     * - Capitaliza primeira letra de cada palavra
     * - Mantém preposições curtas em minúsculo (de, da, do, dos, das, e)
     * Exemplo: "JOAO DA SILVA" -> "João da Silva"
     */
    const formatToTitleCase = (name: string): string => {
        const prepositions = new Set(['de', 'da', 'do', 'dos', 'das', 'e'])

        return name
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .map((word, index) => {
                // Primeira palavra sempre capitalizada, preposições em minúsculo
                if (index === 0 || !prepositions.has(word)) {
                    return word.charAt(0).toUpperCase() + word.slice(1)
                }
                return word
            })
            .join(' ')
    }

    // ===== Filtro Inteligente de Slots =====

    /**
     * Filtra slots baseado no tipo de bateria e número de participantes
     * 
     * REGRA DE NEGÓCIO RÍGIDA:
     * - PRIVATE (Bateria Fechada): Apenas slots com current_bookings === 0 (vazios)
     * - OPEN (Bateria Aberta): Slots onde:
     *   1. Tem capacidade suficiente (remainingCapacity >= peopleCount)
     *   2. E OBRIGATORIAMENTE slot.type === 'OPEN' (ignora slots CLOSED)
     */
    const filteredSlots = useMemo(() => {
        return availableSlots.filter(slot => {
            const remainingCapacity = slot.max_capacity - (slot.current_bookings_count || 0)
            const isSlotEmpty = (slot.current_bookings_count || 0) === 0

            if (bookingType === 'PRIVATE') {
                // Bateria Fechada: Apenas slots completamente vazios
                return isSlotEmpty
            } else {
                // Bateria Aberta: 
                // 1. Precisa ter capacidade suficiente
                // 2. Slot deve ser OPEN OU estar vazio (vazios podem receber qualquer tipo)
                const hasCapacity = remainingCapacity >= peopleCount
                const isOpenOrEmpty = slot.type === 'OPEN' || isSlotEmpty

                return hasCapacity && isOpenOrEmpty
            }
        })
    }, [availableSlots, bookingType, peopleCount])

    // ===== Pricing Calculation =====

    const calculatePricing = useCallback((count: number): PricingInfo => {
        const subtotal = BUSINESS_CONFIG.price * count
        const discount = subtotal * BUSINESS_CONFIG.discountRate
        const total = subtotal - discount

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            total: Math.round(total * 100) / 100
        }
    }, [])

    const pricing = calculatePricing(peopleCount)

    // ===== Data Fetching =====

    const fetchSlotsForDate = useCallback(async (date: Date) => {
        setIsLoading(true)
        setSelectedSlotId(null)
        setDisplayTime('Selecionar')

        const dayStart = startOfDay(date).toISOString()
        const dayEnd = endOfDay(date).toISOString()

        // Busca TODOS os slots disponíveis (filtro inteligente aplicado depois)
        const { data, error } = await supabase
            .from('slots')
            .select('*')
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .eq('status', 'AVAILABLE')
            .order('start_time', { ascending: true })

        if (error) {
            console.error('Error fetching slots:', error)
            setAvailableSlots([])
        } else {
            setAvailableSlots(data || [])
        }

        setIsLoading(false)
    }, [])

    // ===== Effects =====

    useEffect(() => {
        if (selectedDate) {
            fetchSlotsForDate(selectedDate)
            setDisplayDate(formatDisplayDate(selectedDate))
        }
    }, [selectedDate, fetchSlotsForDate])

    // Quando muda tipo de bateria ou participantes, reseta slot selecionado se não for mais válido
    useEffect(() => {
        if (selectedSlotId) {
            const slot = availableSlots.find(s => s.id === selectedSlotId)
            if (slot) {
                const remainingCapacity = slot.max_capacity - (slot.current_bookings_count || 0)
                const isValidForPrivate = bookingType === 'PRIVATE' && (slot.current_bookings_count || 0) === 0
                const isValidForOpen = bookingType === 'OPEN' && remainingCapacity >= peopleCount

                if (!isValidForPrivate && !isValidForOpen) {
                    // Slot atual não é mais válido, reseta
                    setSelectedSlotId(null)
                    setDisplayTime('Selecionar')
                }
            }
        }
    }, [bookingType, peopleCount, selectedSlotId, availableSlots])

    // ===== Handlers =====

    const handleSlotSelect = useCallback((slotId: string) => {
        setSelectedSlotId(slotId)
        const slot = availableSlots.find(s => s.id === slotId)
        if (slot) {
            setDisplayTime(format(new Date(slot.start_time), 'HH:mm'))
        }
    }, [availableSlots])

    const handleConfirmSlotSelection = useCallback(() => {
        // Apenas fecha o modal de calendário e volta para a home
        // NÃO abre o wizard de dados
        if (selectedSlotId && selectedDate) {
            setIsCalendarModalOpen(false)
        }
    }, [selectedSlotId, selectedDate])

    const handlePeopleIncrement = useCallback(() => {
        const maxCapacity = bookingType === 'PRIVATE'
            ? BUSINESS_CONFIG.privateMaxParticipants
            : BUSINESS_CONFIG.maxParticipants

        setPeopleCount(prev => Math.min(maxCapacity, prev + 1))
    }, [bookingType])

    const handlePeopleDecrement = useCallback(() => {
        const minPeople = bookingType === 'PRIVATE'
            ? BUSINESS_CONFIG.privateMinParticipants
            : BUSINESS_CONFIG.minParticipants

        if (peopleCount <= minPeople && bookingType === 'PRIVATE') {
            setShowMinWarning(true)
            setTimeout(() => setShowMinWarning(false), 3000)
            return
        }

        setPeopleCount(prev => Math.max(minPeople, prev - 1))
    }, [bookingType, peopleCount])

    const handleBookingTypeChange = useCallback((value: BookingType) => {
        setBookingType(value)
        if (value === 'PRIVATE' && peopleCount < BUSINESS_CONFIG.privateMinParticipants) {
            setPeopleCount(BUSINESS_CONFIG.privateMinParticipants)
        }
        // Limpa slot quando muda tipo (será refiltrado)
        setSelectedSlotId(null)
        setDisplayTime('Selecionar')
        setSelectedDate(undefined)
        setDisplayDate('Selecionar')
    }, [peopleCount])

    // ===== Modal Actions =====

    const openCalendarModal = useCallback(() => {
        // Validação: precisa ter participantes selecionados
        if (peopleCount < 1) {
            setShowParticipantWarning(true)
            setTimeout(() => setShowParticipantWarning(false), 3000)
            return
        }
        setIsCalendarModalOpen(true)
    }, [peopleCount])

    const closeCalendarModal = useCallback(() => {
        setIsCalendarModalOpen(false)
    }, [])

    const openBookingModal = useCallback(() => {
        // Só abre se tiver slot selecionado
        if (selectedSlotId) {
            setStep(2) // Inicia no Step 2 (formulário de dados)
            setIsBookingModalOpen(true)
        }
    }, [selectedSlotId])

    const closeBookingModal = useCallback(() => {
        setIsBookingModalOpen(false)
        // Reset wizard ao fechar
        setStep(1)
        setCustomerName('')
        setCustomerPhone('')
        setSubmitError(null)
        setBookingResult(null)
    }, [])

    // ===== Wizard Actions =====

    const resetWizard = useCallback(() => {
        setStep(1)
        setCustomerName('')
        setCustomerPhone('')
        setSubmitError(null)
        setBookingResult(null)
    }, [])

    /**
     * Reset completo do estado de booking
     * Limpa: slot selecionado, data, horário, dados do cliente, resultado
     */
    const resetBookingState = useCallback(() => {
        // Reset slot/date selection
        setSelectedSlotId(null)
        setSelectedDate(undefined)
        setDisplayDate('Selecionar')
        setDisplayTime('Selecionar')
        setPeopleCount(1)
        setBookingType('OPEN')

        // Reset wizard
        setStep(1)
        setCustomerName('')
        setCustomerPhone('')
        setSubmitError(null)
        setBookingResult(null)

        // Reset slots
        setAvailableSlots([])

        // Close modals
        setIsCalendarModalOpen(false)
        setIsBookingModalOpen(false)
    }, [])

    const handleSetCustomerPhone = useCallback((value: string) => {
        setCustomerPhone(formatPhoneMask(value))
    }, [])

    const canSubmit = customerName.trim().length >= 2 && customerPhone.replace(/\D/g, '').length >= 10

    const goToPreviousStep = useCallback(() => {
        if (step === 2) {
            // Volta para a home (fecha modal)
            closeBookingModal()
        }
    }, [step, closeBookingModal])

    const handleConfirmBooking = useCallback(async () => {
        // ---------------------------------------------------------
        // 👇 DEBUG LOGS INSERIDOS AQUI
        alert("ESTOU NA VERSÃO NOVA! 🚀 Se você viu isso, o cache limpou.")
        console.log("👆 [FRONT] CLIQUEI NO BOTÃO - VERSÃO NOVA", {
            selectedSlotId,
            canSubmit,
            bookingType,
            peopleCount
        })
        // ---------------------------------------------------------

        if (!selectedSlotId || !canSubmit) return

        setIsSubmitting(true)
        setSubmitError(null)

        const result = await createBookingAdmin({
            name: formatToTitleCase(customerName),
            phone: customerPhone.replace(/\D/g, ''),
            slotId: selectedSlotId,
            peopleCount,
            totalAmount: pricing.total,
            bookingType: bookingType === 'PRIVATE' ? 'CLOSED' : 'OPEN'
        })

        setIsSubmitting(false)

        if (result.success) {
            setBookingResult({
                bookingId: result.bookingId,
                managementToken: result.managementToken
            })
            setStep(3)
        } else {
            setSubmitError(result.error)
        }
    }, [selectedSlotId, canSubmit, customerName, customerPhone, peopleCount, pricing.total, bookingType])

    // ===== Return =====

    return {
        // States
        selectedDate,
        displayDate,
        displayTime,
        peopleCount,
        bookingType,
        isLoading,
        availableSlots,
        filteredSlots,
        selectedSlotId,
        showMinWarning,
        showParticipantWarning,
        pricing,

        // Modal States
        isCalendarModalOpen,
        isBookingModalOpen,

        // Wizard States
        step,
        customerName,
        customerPhone,
        isSubmitting,
        submitError,
        bookingResult,

        // Actions
        setSelectedDate,
        handleSlotSelect,
        handleConfirmSlotSelection,
        handlePeopleIncrement,
        handlePeopleDecrement,
        handleBookingTypeChange,

        // Modal Actions
        openCalendarModal,
        closeCalendarModal,
        openBookingModal,
        closeBookingModal,

        // Wizard Actions
        setCustomerName,
        setCustomerPhone: handleSetCustomerPhone,
        goToPreviousStep,
        handleConfirmBooking,
        resetWizard,
        resetBookingState,
    }
}