"use client"

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2, User, Phone, CalendarIcon, Users, Loader2 } from 'lucide-react'

// ===== Types =====

export interface BookingFormContentProps {
    // State
    step: 2 | 3
    displayDate: string
    displayTime: string
    peopleCount: number
    customerName: string
    customerPhone: string
    isSubmitting: boolean
    submitError: string | null
    pricing: {
        total: number
        discount: number
    }

    // Handlers
    setCustomerName: (name: string) => void
    setCustomerPhone: (phone: string) => void
    handleConfirmBooking: () => Promise<void>
    onClose: () => void
}

// ===== Helper =====

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

// ===== Component =====

export default function BookingFormContent({
    step,
    displayDate,
    displayTime,
    peopleCount,
    customerName,
    customerPhone,
    isSubmitting,
    submitError,
    pricing,
    setCustomerName,
    setCustomerPhone,
    handleConfirmBooking,
    onClose,
}: BookingFormContentProps) {
    // Handler para scroll suave ao focar em inputs
    // Espera o teclado abrir e então centraliza o campo suavemente
    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        const input = e.target
        // Pequeno delay para o teclado abrir e viewport ajustar
        requestAnimationFrame(() => {
            setTimeout(() => {
                input.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                })
            }, 150)
        })
    }

    const canSubmit = customerName.trim().length >= 2 &&
        customerPhone.replace(/\D/g, '').length >= 10

    // ===== STEP 2: Customer Form =====
    if (step === 2) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold leading-none tracking-tight">Seus Dados</h2>
                    <p className="text-sm text-muted-foreground">
                        Preencha seus dados para confirmar a reserva
                    </p>
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{displayDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="font-medium">{displayTime}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="font-medium">
                            {peopleCount} {peopleCount === 1 ? 'pessoa' : 'pessoas'}
                        </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900 dark:text-white">Total</span>
                            <span className="text-xl font-bold text-primary">
                                {formatCurrency(pricing.total)}
                            </span>
                        </div>
                        {pricing.discount > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                                Você economiza {formatCurrency(pricing.discount)}!
                            </p>
                        )}
                    </div>
                </div>

                {/* Customer Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome Completo
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Seu nome"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                onFocus={handleInputFocus}
                                className="pl-10 py-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            WhatsApp
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                onFocus={handleInputFocus}
                                className="pl-10 py-6"
                                maxLength={15}
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {submitError}
                    </div>
                )}

                {/* Submit Button - Full Width, No "Voltar" button */}
                <Button
                    onClick={handleConfirmBooking}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full py-6 text-lg font-bold"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Confirmando...
                        </>
                    ) : (
                        'Confirmar Reserva'
                    )}
                </Button>
            </div>
        )
    }

    // ===== STEP 3: Success =====
    return (
        <div className="text-center py-6 space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Agendamento Confirmado!
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Sua reserva foi realizada com sucesso.
                </p>
            </div>

            {/* Booking Details */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-left">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <span>{displayDate}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>{displayTime}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Users className="w-5 h-5 text-primary" />
                    <span>{peopleCount} {peopleCount === 1 ? 'pessoa' : 'pessoas'}</span>
                </div>
            </div>

            {/* Info Message */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Você receberá uma confirmação no seu WhatsApp em instantes.
            </p>

            {/* Close Button */}
            <Button
                onClick={onClose}
                className="w-full py-6 text-lg font-bold bg-green-600 hover:bg-green-700"
            >
                Concluir
            </Button>
        </div>
    )
}
