'use client'

import { useState, useTransition } from 'react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAvailableSlots, rescheduleBooking, AvailableSlot } from './actions'

interface RescheduleModalProps {
    isOpen: boolean
    onClose: () => void
    bookingId: string
    currentSlotId: string
    bookingType: 'OPEN' | 'CLOSED'
    peopleCount: number
    onSuccess: (newSlot: { id: string; start_time: string }) => void
}

// Formatar hora do slot
function formatTime(isoString: string): string {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

// Formatar data para exibição
function formatDateDisplay(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(date)
}

// Formatar data para query (YYYY-MM-DD)
function formatDateQuery(date: Date): string {
    return date.toISOString().split('T')[0]
}

// Gerar dias do calendário
function getCalendarDays(year: number, month: number): Date[] {
    const days: Date[] = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Preencher dias vazios do início
    const startPadding = firstDay.getDay()
    for (let i = startPadding - 1; i >= 0; i--) {
        const d = new Date(year, month, -i)
        days.push(d)
    }

    // Dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i))
    }

    return days
}

export function RescheduleModal({
    isOpen,
    onClose,
    bookingId,
    currentSlotId,
    bookingType,
    peopleCount,
    onSuccess
}: RescheduleModalProps) {
    const [step, setStep] = useState<'date' | 'slot' | 'confirm'>('date')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    // Calendário
    const today = new Date()
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [viewYear, setViewYear] = useState(today.getFullYear())

    const calendarDays = getCalendarDays(viewYear, viewMonth)
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

    if (!isOpen) return null

    const handleDateSelect = async (date: Date) => {
        setSelectedDate(date)
        setIsLoadingSlots(true)
        setError(null)

        const result = await getAvailableSlots(
            formatDateQuery(date),
            bookingType,
            peopleCount,
            currentSlotId
        )

        setIsLoadingSlots(false)

        if (result.success && result.slots) {
            setAvailableSlots(result.slots)
            setStep('slot')
        } else {
            setError(result.error || 'Erro ao buscar horários')
        }
    }

    const handleSlotSelect = (slot: AvailableSlot) => {
        setSelectedSlot(slot)
        setStep('confirm')
    }

    const handleConfirm = () => {
        if (!selectedSlot) return

        startTransition(async () => {
            const result = await rescheduleBooking(
                bookingId,
                currentSlotId,
                selectedSlot.id,
                bookingType,
                peopleCount
            )

            if (result.success) {
                onSuccess({ id: selectedSlot.id, start_time: selectedSlot.start_time })
                onClose()
            } else {
                setError(result.error || 'Erro ao reagendar')
                setStep('slot')
            }
        })
    }

    const handleBack = () => {
        if (step === 'slot') {
            setStep('date')
            setSelectedDate(null)
        } else if (step === 'confirm') {
            setStep('slot')
            setSelectedSlot(null)
        }
    }

    const handleClose = () => {
        setStep('date')
        setSelectedDate(null)
        setSelectedSlot(null)
        setError(null)
        onClose()
    }

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear(viewYear - 1)
        } else {
            setViewMonth(viewMonth - 1)
        }
    }

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear(viewYear + 1)
        } else {
            setViewMonth(viewMonth + 1)
        }
    }

    const isPastDate = (date: Date) => {
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        return date < todayStart
    }

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === viewMonth
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden z-10 flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    {step !== 'date' && (
                        <button
                            onClick={handleBack}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <h2 className="text-lg font-bold text-gray-900 flex-1">
                        {step === 'date' && 'Selecione uma Data'}
                        {step === 'slot' && 'Escolha o Horário'}
                        {step === 'confirm' && 'Confirmar Alteração'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Date Selection */}
                    {step === 'date' && (
                        <div>
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={prevMonth}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="font-semibold text-gray-900">
                                    {monthNames[viewMonth]} {viewYear}
                                </span>
                                <button
                                    onClick={nextMonth}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((date, i) => {
                                    const isDisabled = isPastDate(date) || !isCurrentMonth(date)
                                    const isToday = date.toDateString() === today.toDateString()

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => !isDisabled && handleDateSelect(date)}
                                            disabled={isDisabled}
                                            className={`
                                                aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                                                ${isDisabled
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'hover:bg-green-100 text-gray-900'
                                                }
                                                ${isToday ? 'ring-2 ring-green-500' : ''}
                                            `}
                                        >
                                            {date.getDate()}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Slot Selection */}
                    {step === 'slot' && (
                        <div>
                            {selectedDate && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700 capitalize">
                                        {formatDateDisplay(selectedDate)}
                                    </span>
                                </div>
                            )}

                            {isLoadingSlots ? (
                                <div className="py-8 text-center text-gray-500">
                                    Carregando horários...
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <div className="py-8 text-center text-gray-500">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum horário disponível para esta data.</p>
                                    <p className="text-xs mt-1">
                                        {bookingType === 'CLOSED'
                                            ? 'Baterias fechadas precisam de horários vazios.'
                                            : 'Escolha outra data.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleSlotSelect(slot)}
                                            className="p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
                                        >
                                            <span className="font-semibold text-gray-900">
                                                {formatTime(slot.start_time)}
                                            </span>
                                            <span className="block text-xs text-gray-500 mt-1">
                                                {slot.available_spots} vagas
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 'confirm' && selectedDate && selectedSlot && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Confirmar Reagendamento
                            </h3>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-500 mb-1">Nova data e horário:</p>
                                <p className="text-lg font-bold text-gray-900 capitalize">
                                    {formatDateDisplay(selectedDate)}
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatTime(selectedSlot.start_time)}
                                </p>
                            </div>

                            <Button
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="w-full py-6 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isPending ? 'Reagendando...' : 'Confirmar'}
                            </Button>

                            <button
                                onClick={handleBack}
                                disabled={isPending}
                                className="w-full py-3 text-gray-600 text-sm font-medium mt-2"
                            >
                                Voltar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
