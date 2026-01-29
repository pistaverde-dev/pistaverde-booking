'use client'

import { useState, useTransition } from 'react'
import { Calendar, Users, Car, CheckCircle, AlertTriangle, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cancelBooking } from './actions'
import { RescheduleModal } from './RescheduleModal'

interface BookingData {
    id: string
    status: string
    people_count: number
    total_amount: number
    created_at: string
    reschedule_count?: number  // Contador de reagendamentos (limite: 1)
    slot: {
        id: string
        start_time: string
        type: string
    } | null
    customer: {
        id: string
        name: string
        phone: string
    } | null
}

interface BookingStatusClientProps {
    booking: BookingData
}

// ===== HELPERS DE FORMATAÇÃO =====

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

function formatDateTime(isoString: string): string {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date).replace(',', ' às')
}

function translateBatteryType(type: string): string {
    switch (type) {
        case 'OPEN':
            return 'Bateria Aberta'
        case 'CLOSED':
        case 'PRIVATE':
            return 'Bateria Fechada'
        default:
            return type
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'CONFIRMED':
            return {
                label: 'Confirmado',
                className: 'bg-green-100 text-green-800 border-green-200',
                icon: CheckCircle
            }
        case 'PENDING':
            return {
                label: 'Pendente',
                className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: null
            }
        case 'CANCELLED':
            return {
                label: 'Cancelado',
                className: 'bg-red-100 text-red-800 border-red-200',
                icon: X
            }
        default:
            return {
                label: status,
                className: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: null
            }
    }
}

export function BookingStatusClient({ booking }: BookingStatusClientProps) {
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [showRescheduleWarning, setShowRescheduleWarning] = useState(false) // Modal de aviso
    const [isPending, startTransition] = useTransition()
    const [currentStatus, setCurrentStatus] = useState(booking.status)
    const [currentSlot, setCurrentSlot] = useState(booking.slot)
    const [rescheduleCount, setRescheduleCount] = useState(booking.reschedule_count || 0)

    const statusBadge = getStatusBadge(currentStatus)
    const isCancelled = currentStatus === 'CANCELLED'
    const hasReachedRescheduleLimit = rescheduleCount >= 1
    const StatusIcon = statusBadge.icon

    const handleCancelClick = () => {
        setShowCancelModal(true)
    }

    const handleRescheduleClick = () => {
        // Se ainda não atingiu o limite, mostra o modal de aviso primeiro
        if (!hasReachedRescheduleLimit) {
            setShowRescheduleWarning(true)
        }
    }

    const handleConfirmRescheduleWarning = () => {
        // Usuário confirmou o aviso, agora abre o calendário
        setShowRescheduleWarning(false)
        setShowRescheduleModal(true)
    }

    const handleRescheduleSuccess = (newSlot: { id: string; start_time: string }) => {
        // Atualiza o slot exibido com os novos dados
        setCurrentSlot(prev => prev ? { ...prev, id: newSlot.id, start_time: newSlot.start_time } : null)
        // Incrementa o contador local para desabilitar o botão
        setRescheduleCount(prev => prev + 1)
    }


    const handleConfirmCancel = () => {
        if (!booking.slot?.id) return

        startTransition(async () => {
            const result = await cancelBooking(
                booking.id,
                booking.slot!.id,
                booking.people_count
            )

            if (result.success) {
                setCurrentStatus('CANCELLED')
                setShowCancelModal(false)
            } else {
                alert(result.error || 'Erro ao cancelar reserva')
            }
        })
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 py-4">
                    <h1 className="text-lg font-bold text-center text-gray-900">
                        Detalhes da Reserva
                    </h1>
                </header>

                <main className="max-w-lg mx-auto p-4 space-y-4">
                    {/* Card Principal */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Status Badge */}
                        <div className="pt-6 pb-4 flex justify-center">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1.5 ${statusBadge.className}`}>
                                {StatusIcon && <StatusIcon className="w-4 h-4" />}
                                {statusBadge.label}
                            </span>
                        </div>

                        {/* Data/Hora em Destaque */}
                        <div className="px-6 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isCancelled ? 'bg-gray-100' : 'bg-green-100'}`}>
                                    <Calendar className={`w-6 h-6 ${isCancelled ? 'text-gray-400' : 'text-green-600'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Data e Horário</p>
                                    <p className={`text-lg font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                        {currentSlot?.start_time
                                            ? formatDateTime(currentSlot.start_time)
                                            : 'Não definido'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Informações */}
                        <div className="px-6 py-5 space-y-4">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-gray-500 flex items-center gap-3 flex-shrink-0">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    Responsável
                                </span>
                                <span className="font-semibold text-gray-900 text-right">
                                    {booking.customer?.name || 'N/A'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 flex items-center gap-3">
                                    <Car className="w-5 h-5 text-muted-foreground" />
                                    Tipo de Bateria
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {booking.slot?.type
                                        ? translateBatteryType(booking.slot.type)
                                        : 'N/A'
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 flex items-center gap-3">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                    Participantes
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {booking.people_count} {booking.people_count === 1 ? 'Pessoa' : 'Pessoas'}
                                </span>
                            </div>

                            <div className="h-px bg-gray-100" />

                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Total</span>
                                <span className={`text-xl font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                                    {formatCurrency(booking.total_amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Botões de Ação - Ocultos quando cancelado */}
                    {!isCancelled && (
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                onClick={handleRescheduleClick}
                                disabled={hasReachedRescheduleLimit}
                                className={`w-full py-6 text-base font-semibold ${hasReachedRescheduleLimit
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                    : 'border-green-600 text-green-600 hover:bg-green-50'
                                    }`}
                            >
                                {hasReachedRescheduleLimit
                                    ? 'Limite de alterações atingido'
                                    : 'Alterar Data/Horário'
                                }
                            </Button>

                            <button
                                onClick={handleCancelClick}
                                className="w-full py-3 text-red-600 text-sm font-medium hover:text-red-700 transition-colors"
                            >
                                Cancelar Reserva
                            </button>
                        </div>
                    )}

                    {/* Localização - Oculto quando cancelado */}
                    {!isCancelled && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900">Ponto de Encontro</h2>
                            </div>
                            <div className="h-48 relative">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent("Shopping Ventura - G5 - R. Itacolomi, 292 - Portão, Curitiba")}&t=m&z=15&output=embed&iwloc=near`}
                                ></iframe>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal de Confirmação de Cancelamento */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => !isPending && setShowCancelModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 z-10">
                        {/* Ícone de Alerta */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>

                        {/* Título */}
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Tem certeza?
                        </h2>

                        {/* Texto */}
                        <p className="text-center text-gray-600 mb-6">
                            Isso liberará a vaga para outros pilotos. Essa ação não pode ser desfeita.
                        </p>

                        {/* Botões */}
                        <div className="space-y-3">
                            <Button
                                onClick={handleConfirmCancel}
                                disabled={isPending}
                                className="w-full py-6 text-base font-semibold bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isPending ? 'Cancelando...' : 'Sim, Cancelar'}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setShowCancelModal(false)}
                                disabled={isPending}
                                className="w-full py-6 text-base font-semibold"
                            >
                                Voltar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Reagendamento */}
            {currentSlot && (
                <RescheduleModal
                    isOpen={showRescheduleModal}
                    onClose={() => setShowRescheduleModal(false)}
                    bookingId={booking.id}
                    currentSlotId={currentSlot.id}
                    bookingType={(currentSlot.type === 'OPEN' ? 'OPEN' : 'CLOSED') as 'OPEN' | 'CLOSED'}
                    peopleCount={booking.people_count}
                    onSuccess={handleRescheduleSuccess}
                />
            )}

            {/* Modal de Aviso de Reagendamento */}
            {showRescheduleWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setShowRescheduleWarning(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
                        {/* Ícone de Alerta */}
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-600" />
                        </div>

                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Atenção
                        </h3>

                        <p className="text-center text-gray-600 mb-6">
                            Por segurança, cada agendamento permite apenas uma alteração de data/horário.
                            Ao confirmar esta troca, não será possível alterá-lo novamente.
                        </p>

                        <div className="space-y-3">
                            <Button
                                onClick={handleConfirmRescheduleWarning}
                                className="w-full py-6 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
                            >
                                Estou ciente, continuar
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setShowRescheduleWarning(false)}
                                className="w-full py-6 text-base font-semibold"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
