"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar } from '@/components/ui/calendar'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock } from 'lucide-react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// View Components
import MobileHome from '@/components/views/MobileHome'
import DesktopHome from '@/components/views/DesktopHome'

interface Slot {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  current_bookings_count: number
  type: 'OPEN' | 'CLOSED'
  status: string
}

export default function Home() {
  // State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [displayDate, setDisplayDate] = useState<string>('Selecionar')
  const [displayTime, setDisplayTime] = useState<string>('Selecionar')
  const [peopleCount, setPeopleCount] = useState<number>(1)
  const [bookingType, setBookingType] = useState<'OPEN' | 'PRIVATE'>('OPEN')
  const [showMinWarning, setShowMinWarning] = useState(false)

  // Helper function to format date as "Ter, 13 de Jan"
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

  // Effects
  useEffect(() => {
    if (selectedDate) {
      fetchSlotsForDate(selectedDate)
      setDisplayDate(formatDisplayDate(selectedDate))
    }
  }, [selectedDate])

  // Data Fetching
  async function fetchSlotsForDate(date: Date) {
    setIsLoading(true)
    setSelectedSlotId(null)
    setDisplayTime('Selecionar')

    const dayStart = startOfDay(date).toISOString()
    const dayEnd = endOfDay(date).toISOString()

    let query = supabase
      .from('slots')
      .select('*')
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd)
      .eq('status', 'AVAILABLE')

    if (bookingType === 'OPEN') {
      query = query.eq('type', 'OPEN')
    }

    const { data, error } = await query.order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    } else {
      setAvailableSlots(data || [])
    }

    setIsLoading(false)
  }

  // Handlers
  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId)
    const slot = availableSlots.find(s => s.id === slotId)
    if (slot) {
      setDisplayTime(format(new Date(slot.start_time), 'HH:mm'))
      const remainingCapacity = slot.max_capacity - slot.current_bookings_count
      if (peopleCount > remainingCapacity) {
        setPeopleCount(remainingCapacity)
      }
    }
  }

  const handleConfirmSelection = () => {
    if (selectedSlotId && selectedDate) {
      setIsModalOpen(false)
      console.log('Selected slot:', selectedSlotId, 'Date:', selectedDate)
    }
  }

  const handlePeopleIncrement = () => {
    let maxCapacity = bookingType === 'PRIVATE' ? 50 : 10
    if (selectedSlotId) {
      const selectedSlot = availableSlots.find(s => s.id === selectedSlotId)
      if (selectedSlot) {
        maxCapacity = selectedSlot.max_capacity - selectedSlot.current_bookings_count
      }
    }
    setPeopleCount(Math.min(maxCapacity, peopleCount + 1))
  }

  const handlePeopleDecrement = () => {
    const minPeople = bookingType === 'PRIVATE' ? 15 : 1
    if (peopleCount <= minPeople && bookingType === 'PRIVATE') {
      setShowMinWarning(true)
      setTimeout(() => setShowMinWarning(false), 3000)
      return
    }
    setPeopleCount(Math.max(minPeople, peopleCount - 1))
  }

  const handleBookingTypeChange = (value: 'OPEN' | 'PRIVATE') => {
    setBookingType(value)
    if (value === 'PRIVATE' && peopleCount < 15) {
      setPeopleCount(15)
    }
    setSelectedSlotId(null)
    setDisplayTime('Selecionar')
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const viewProps = {
    displayDate,
    displayTime,
    peopleCount,
    bookingType,
    showMinWarning,
    onOpenModal: handleOpenModal,
    onPeopleIncrement: handlePeopleIncrement,
    onPeopleDecrement: handlePeopleDecrement,
    onBookingTypeChange: handleBookingTypeChange,
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Mobile View - Visible on small screens only */}
      <div className="block md:hidden">
        <MobileHome {...viewProps} />
      </div>

      {/* Desktop View - Visible on medium screens and up */}
      <div className="hidden md:block">
        <DesktopHome {...viewProps} />
      </div>

      {/* Shared Modal - Date & Time Selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Selecione Data e Horário</DialogTitle>
            <DialogDescription>
              Escolha uma data e o horário desejado para sua bateria de kart
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Escolha a Data</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  showOutsideDays={false}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </div>
            </div>


            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                  Horários Disponíveis - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse text-text-sub-light dark:text-text-sub-dark">
                      Carregando horários...
                    </div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-text-sub-light dark:text-text-sub-dark font-medium">
                      Sem baterias disponíveis para este dia
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSlots
                      .filter(slot => {
                        if (bookingType === 'PRIVATE') {
                          return slot.current_bookings_count === 0 || slot.current_bookings_count === null
                        }
                        return true
                      })
                      .map((slot) => {
                        const remainingCapacity = slot.max_capacity - slot.current_bookings_count
                        const isSelected = selectedSlotId === slot.id
                        const isDisabledForPrivate = bookingType === 'PRIVATE' && slot.current_bookings_count > 0

                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot.id)}
                            disabled={remainingCapacity <= 0 || isDisabledForPrivate}
                            className={`
                            p-4 rounded-lg border-2 transition-all text-left
                            ${isSelected
                                ? 'border-primary bg-primary/10 dark:bg-primary/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                              }
                            ${remainingCapacity <= 0 || isDisabledForPrivate
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
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
                                  : remainingCapacity > 0
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                            `}>
                                {isDisabledForPrivate
                                  ? 'Indisponível (reservas existentes)'
                                  : remainingCapacity > 0
                                    ? `${remainingCapacity} vagas`
                                    : 'Esgotado'
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
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedSlotId}
              className={`
                w-full py-3 rounded-xl font-bold text-white transition
                ${selectedSlotId
                  ? 'bg-primary hover:bg-opacity-90'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                }
              `}
            >
              {selectedSlotId ? 'Confirmar Seleção' : 'Selecione um horário'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
