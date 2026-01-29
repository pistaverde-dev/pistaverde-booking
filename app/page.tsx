"use client"

import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BottomSheet,
  BottomSheetContent,
} from "@/components/ui/bottom-sheet"
import { Clock, CalendarIcon, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Hook
import { useBooking } from '@/hooks/useBooking'

// View Components
import MobileHome from '@/components/views/MobileHome'
import DesktopHome from '@/components/views/DesktopHome'

// Booking Form (Reusable Content)
import BookingFormContent from '@/components/booking/BookingFormContent'

// Hook for responsive modal rendering
import { useIsMobile } from '@/hooks/useIsMobile'

export default function Home() {
  // Use the centralized booking hook
  const booking = useBooking()

  // Detect mobile for conditional modal rendering (not CSS - portals ignore hidden!)
  const isMobile = useIsMobile(768) // 768px = md: breakpoint

  // Props for view components (Home screens)
  const viewProps = {
    displayDate: booking.displayDate,
    displayTime: booking.displayTime,
    peopleCount: booking.peopleCount,
    bookingType: booking.bookingType,
    showMinWarning: booking.showMinWarning,
    selectedSlotId: booking.selectedSlotId,
    onOpenCalendarModal: booking.openCalendarModal,
    onOpenBookingModal: booking.openBookingModal,
    onPeopleIncrement: booking.handlePeopleIncrement,
    onPeopleDecrement: booking.handlePeopleDecrement,
    onBookingTypeChange: booking.handleBookingTypeChange,
  }

  // Props for the reusable BookingFormContent
  const formProps = {
    step: booking.step as 2 | 3,
    displayDate: booking.displayDate,
    displayTime: booking.displayTime,
    peopleCount: booking.peopleCount,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    isSubmitting: booking.isSubmitting,
    submitError: booking.submitError,
    pricing: booking.pricing,
    setCustomerName: booking.setCustomerName,
    setCustomerPhone: booking.setCustomerPhone,
    handleConfirmBooking: booking.handleConfirmBooking,
    onClose: booking.resetBookingState,
  }

  // Modal open/close handlers
  const handleBookingModalChange = (open: boolean) => {
    // Não permite fechar no Step 3 (sucesso)
    if (booking.step === 3) return
    if (!open) booking.closeBookingModal()
  }

  const preventCloseOnSuccess = (e: Event) => {
    if (booking.step === 3) e.preventDefault()
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ===== HOME VIEWS ===== */}

      {/* Mobile View - Visible on small screens only */}
      <div className="block md:hidden">
        <MobileHome {...viewProps} />
      </div>

      {/* Desktop View - Visible on medium screens and up */}
      <div className="hidden md:block">
        <DesktopHome {...viewProps} />
      </div>

      {/* ===== TOAST WARNINGS ===== */}

      {booking.showParticipantWarning && (
        <div className="fixed bottom-24 left-4 right-4 max-w-xl mx-auto z-50">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm font-medium">Por favor, selecione o número de participantes primeiro</p>
          </div>
        </div>
      )}

      {/* ===== MODAL 1: Calendário (Seleção de Data/Hora) ===== */}
      {/* Mesmo componente para Desktop e Mobile - Dialog centralizado */}
      <Dialog open={booking.isCalendarModalOpen} onOpenChange={(open) => !open && booking.closeCalendarModal()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Selecione Data e Horário</DialogTitle>
            <DialogDescription>
              {booking.bookingType === 'PRIVATE'
                ? 'Mostrando apenas horários disponíveis para bateria fechada'
                : `Mostrando horários com ${booking.peopleCount}+ vagas disponíveis`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Escolha a Data</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={booking.selectedDate}
                  onSelect={booking.setSelectedDate}
                  disabled={(date) => date < new Date()}
                  showOutsideDays={false}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </div>
            </div>

            {/* Time Slots (Filtrados) */}
            {booking.selectedDate && (
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                  Horários Disponíveis - {format(booking.selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>

                {booking.isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse text-gray-500">
                      Carregando horários...
                    </div>
                  </div>
                ) : booking.filteredSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 font-medium">
                      {booking.bookingType === 'PRIVATE'
                        ? 'Sem horários livres para bateria fechada neste dia'
                        : `Sem horários com ${booking.peopleCount}+ vagas neste dia`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {booking.filteredSlots.map((slot) => {
                      const remainingCapacity = slot.max_capacity - (slot.current_bookings_count || 0)
                      const isSelected = booking.selectedSlotId === slot.id

                      return (
                        <button
                          key={slot.id}
                          onClick={() => booking.handleSlotSelect(slot.id)}
                          className={`
                            p-4 rounded-lg border-2 transition-all text-left cursor-pointer
                            ${isSelected
                              ? 'border-primary bg-primary/10 dark:bg-primary/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="font-bold text-gray-900 dark:text-white">
                              {format(new Date(slot.start_time), 'HH:mm')}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className={`
                              font-semibold
                              ${remainingCapacity > 5
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-yellow-600 dark:text-yellow-400'
                              }
                            `}>
                              {booking.bookingType === 'PRIVATE'
                                ? 'Disponível'
                                : `${remainingCapacity} vagas`
                              }
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={booking.handleConfirmSlotSelection}
              disabled={!booking.selectedSlotId}
              className="w-full py-6 text-lg font-bold"
            >
              Confirmar Horário
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL 2: Booking Form ===== */}
      {/* RESPONSIVE STRATEGY: Conditional rendering based on viewport */}
      {/* IMPORTANT: Using JS conditional instead of CSS classes because portals render outside the parent DOM */}

      {isMobile ? (
        // Mobile: Bottom Sheet
        <BottomSheet
          open={booking.isBookingModalOpen}
          onOpenChange={handleBookingModalChange}
        >
          <BottomSheetContent
            hideCloseButton={booking.step === 3}
            onInteractOutside={preventCloseOnSuccess}
            onEscapeKeyDown={preventCloseOnSuccess}
          >
            <BookingFormContent {...formProps} />
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        // Desktop: Dialog Centralizado
        <Dialog
          open={booking.isBookingModalOpen}
          onOpenChange={handleBookingModalChange}
        >
          <DialogContent
            className="max-w-lg max-h-[90vh] overflow-y-auto"
            onInteractOutside={preventCloseOnSuccess}
            onEscapeKeyDown={preventCloseOnSuccess}
          >
            <BookingFormContent {...formProps} />
          </DialogContent>
        </Dialog>
      )}
    </main>
  )
}
