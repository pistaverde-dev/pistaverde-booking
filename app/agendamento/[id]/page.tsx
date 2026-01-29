import { supabase } from '@/lib/supabase'
import { BookingStatusClient } from './BookingStatusClient'

interface BookingPageProps {
    params: Promise<{ id: string }>
}

// Tipo para os dados da reserva com relacionamentos
interface BookingData {
    id: string
    status: string
    people_count: number
    total_amount: number
    created_at: string
    reschedule_count?: number  // Contador de reagendamentos
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

// Função para buscar reserva por ID com joins
async function getBookingById(id: string): Promise<BookingData | null> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            id,
            status,
            people_count,
            total_amount,
            created_at,
            reschedule_count,
            slot:slots (
                id,
                start_time,
                type
            ),
            customer:customers (
                id,
                name,
                phone
            )
        `)
        .eq('id', id)
        .single()

    if (error || !data) {
        console.error('Error fetching booking:', error)
        return null
    }

    return data as BookingData
}

export default async function BookingStatusPage({ params }: BookingPageProps) {
    const { id } = await params

    // Valida se é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">ID inválido</h1>
                    <p className="text-gray-600">O link que você acessou não é válido.</p>
                </div>
            </div>
        )
    }

    // Busca a reserva
    const booking = await getBookingById(id)

    // Reserva não encontrada
    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Reserva não encontrada</h1>
                    <p className="text-gray-600">Não conseguimos localizar esta reserva.</p>
                </div>
            </div>
        )
    }

    return <BookingStatusClient booking={booking} />
}
