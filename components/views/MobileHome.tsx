"use client"

import { CalendarIcon, Clock, Users, Heart, MapPin, CheckCircle, ArrowRight, CreditCard, GridIcon, Minus, Plus, Accessibility, Ruler, Baby, Shirt, Car, AlertCircle, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BUSINESS_CONFIG } from '@/app/config'

export interface Slot {
    id: string
    start_time: string
    end_time: string
    max_capacity: number
    current_bookings_count: number
    type: 'OPEN' | 'CLOSED'
    status: string
}

export interface HomeViewProps {
    // State values
    displayDate: string
    displayTime: string
    peopleCount: number
    bookingType: 'OPEN' | 'PRIVATE'
    showMinWarning: boolean

    // Handlers
    onOpenModal: () => void
    onPeopleIncrement: () => void
    onPeopleDecrement: () => void
    onBookingTypeChange: (value: 'OPEN' | 'PRIVATE') => void
}

export default function MobileHome({
    displayDate,
    displayTime,
    peopleCount,
    bookingType,
    showMinWarning,
    onOpenModal,
    onPeopleIncrement,
    onPeopleDecrement,
    onBookingTypeChange,
}: HomeViewProps) {
    // Calculate prices dynamically
    const subtotal = BUSINESS_CONFIG.price * peopleCount
    const discount = subtotal * BUSINESS_CONFIG.discountRate
    const total = subtotal - discount

    return (
        <div className="w-full max-w-xl mx-auto px-4 pb-20 bg-background min-h-screen relative">
            {/* Hero Image */}
            <div className="relative h-48 w-screen -ml-4 overflow-hidden">
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7Yggv6DLP_fJMYHJVE_K5kgj1cdxGM7k-Bf0xvLG0Br4CJWpeISfhJWKrnPvGPtLni-6hXpu9lY7XgWcerl3V5JApLH9MCpirWiW2I3PgIlfKTWcNLkdnVWur_10sw3HKlSJUJcdDTaYy-Zb3EaTBbmBxsDQfp8oXF4RNDyZAyndj3lnBqkObxt7PMYK_FYnljpAY-rUe_bPbpH95pjXpwaYTyM82NAntdNIef0f4dnHVKb5rK0QgMBwslNlcUtHmsqoIGRlbADKP"
                    alt="Pista de Kart"
                    className="w-full h-full object-cover object-[center_60%]"
                />
                {/* <button className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg hover:bg-card transition">
                    <GridIcon className="w-4 h-4" />
                    Mostrar fotos
                </button> */}
            </div>

            {/* Title Card */}
            <div className="-mt-6 relative z-10">
                <div className="bg-card p-6 rounded-xl shadow-xl">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold leading-tight">{BUSINESS_CONFIG.name}</h1>
                        <button className="text-muted-foreground hover:text-red-500 transition">
                            <Heart className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-6">
                        <MapPin className="w-4 h-4" />
                        {BUSINESS_CONFIG.address}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                                <img src="/monaco-logo.png" alt="Mônaco Racing" className="w-full h-full object-contain p-1" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold">Mônaco Racing</p>
                                <p className="text-[10px] text-blue-500 underline cursor-pointer">Ver Perfil</p>
                            </div>
                        </div>
                        <div className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verificado
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Card */}
            <div className="mt-6">
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    {/* Price Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(BUSINESS_CONFIG.price)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">por pessoa</p>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                            <span>🏷️</span> -{BUSINESS_CONFIG.discountRate * 100}% OFF
                        </span>
                    </div>

                    {/* Date and Time - Label OUTSIDE the box */}
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Data e Horário</p>
                    <button
                        onClick={onOpenModal}
                        className="w-full p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary transition-colors text-left flex items-center justify-between mb-5"
                    >
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                                {displayDate === 'Selecionar'
                                    ? 'Selecionar data e horário'
                                    : `${displayDate} • ${displayTime}`
                                }
                            </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Participants - Label OUTSIDE the box */}
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Participantes</p>
                    <div className="w-full p-4 bg-card border border-border rounded-xl flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                                {peopleCount} {peopleCount === 1 ? 'Pessoa' : 'Pessoas'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onPeopleDecrement}
                                className={`w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition text-muted-foreground ${peopleCount <= (bookingType === 'PRIVATE' ? 15 : 1) ? 'opacity-40' : ''}`}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold min-w-[28px] text-center text-foreground">{peopleCount}</span>
                            <button
                                onClick={onPeopleIncrement}
                                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition text-muted-foreground"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Booking Type - Label OUTSIDE the box */}
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Tipo de Bateria</p>
                    <div className="w-full p-4 bg-card border border-border rounded-xl mb-6">
                        <Select
                            value={bookingType}
                            onValueChange={(value) => onBookingTypeChange(value as 'OPEN' | 'PRIVATE')}
                        >
                            <SelectTrigger className="w-full bg-transparent border-none p-0 h-auto text-sm font-medium text-foreground focus:ring-0 shadow-none">
                                <div className="flex items-center gap-3">
                                    <Car className="w-5 h-5 text-muted-foreground" />
                                    <span>{bookingType === 'OPEN' ? 'Bateria Aberta' : 'Bateria Fechada'}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OPEN">
                                    <span className="font-medium">Bateria Aberta</span>
                                </SelectItem>
                                <SelectItem value="PRIVATE">
                                    <span className="font-medium">Bateria Fechada</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price Summary */}
                    <div className="space-y-2 mb-6 pt-4 border-t border-border">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground underline cursor-pointer">{peopleCount}x Bateria Adulto</span>
                            <span className="text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-green-600">Desconto Online ({BUSINESS_CONFIG.discountRate * 100}%)</span>
                            <span className="text-green-600">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-border">
                            <span className="font-bold text-foreground">Total</span>
                            <span className="font-bold text-xl text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                        </div>
                    </div>

                    {/* Reserve Button */}
                    <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 text-base rounded-full shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        Reservar Agora
                    </button>

                    {/* Note */}
                    <p className="text-center text-xs text-muted-foreground mt-4">
                        Não cobraremos nada agora. O pagamento é feito no local.
                    </p>
                </div>
            </div>

            {/* About Section */}
            <section className="mt-10">
                <h2 className="text-lg font-bold mb-4">Sobre a Experiência</h2>
                <div className="bg-card p-6 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Viva a emoção do kart indoor em uma das pistas mais modernas de Curitiba! Nossa experiência oferece karts de alta performance, equipamentos de segurança de última geração e uma pista desafiadora de 400 metros.
                    </p>
                </div>
            </section>

            {/* Requirements & Information */}
            <section className="mt-10">
                <h2 className="text-lg font-bold mb-4">Requisitos & Informações</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card p-3 rounded-xl border border-border flex items-center gap-2">
                        <Accessibility className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold">Acessibilidade</p>
                            <p className="text-[10px] text-muted-foreground">Com restrições</p>
                        </div>
                    </div>
                    <div className="bg-card p-3 rounded-xl border border-border flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold">Altura Mínima</p>
                            <p className="text-[10px] text-muted-foreground">1,40 metros</p>
                        </div>
                    </div>
                    <div className="bg-card p-3 rounded-xl border border-border flex items-center gap-2">
                        <Baby className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold">Idade Mínima</p>
                            <p className="text-[10px] text-muted-foreground">14 anos</p>
                        </div>
                    </div>
                    <div className="bg-card p-3 rounded-xl border border-border flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold">Vestimenta</p>
                            <p className="text-[10px] text-muted-foreground">Roupa confortável e calçado fechado</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="mt-10">
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-lg font-bold">Dúvidas Frequentes</h2>
                    </div>
                    <div className="divide-y divide-border">
                        <details className="group">
                            <summary className="flex items-center justify-between p-4 cursor-pointer transition">
                                <span className="text-sm font-semibold">Qual a altura mínima necessária?</span>
                                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="px-4 pb-4 text-sm text-muted-foreground">
                                A altura mínima para pilotar é de 1,40m. Essa medida garante que o piloto consiga alcançar os pedais e ter controle total do kart com segurança.
                            </div>
                        </details>
                        <details className="group">
                            <summary className="flex items-center justify-between p-4 cursor-pointer transition">
                                <span className="text-sm font-semibold">Preciso ter experiência anterior?</span>
                                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="px-4 pb-4 text-sm text-muted-foreground">
                                Não! Nossa atividade é perfeita tanto para iniciantes quanto para pilotos experientes. Oferecemos um briefing completo antes de cada bateria.
                            </div>
                        </details>
                        <details className="group">
                            <summary className="flex items-center justify-between p-4 cursor-pointer transition">
                                <span className="text-sm font-semibold">Fornecem equipamento?</span>
                                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="px-4 pb-4 text-sm text-muted-foreground">
                                Sim! Fornecemos todos os equipamentos de segurança necessários: capacete, touca higiênica e luvas.
                            </div>
                        </details>
                    </div>
                </div>
            </section>

            {/* Meeting Point */}
            <section className="mt-10">
                <h2 className="text-lg font-bold mb-4">Ponto de Encontro</h2>
                <div className="w-full h-80 relative rounded-xl overflow-hidden border border-border">
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(BUSINESS_CONFIG.address)}&t=m&z=15&output=embed&iwloc=near`}
                    ></iframe>

                    {/* Floating Card - Opens GPS App
                    <a
                        href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(BUSINESS_CONFIG.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-4 left-4 right-4 bg-card p-4 rounded-xl shadow-lg border border-border flex justify-between items-center hover:bg-accent transition-colors cursor-pointer"
                    >
                        <div>
                            <p className="font-bold text-sm text-foreground">{BUSINESS_CONFIG.address.split('-')[0]}</p>
                            <p className="text-xs text-muted-foreground">Toque para abrir no GPS</p>
                        </div>
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold">
                            Abrir Mapa
                        </div>
                    </a>
                    */}
                </div>
            </section>

            {/* Toast Warning */}
            {showMinWarning && (
                <div className="fixed bottom-24 left-4 right-4 max-w-xl mx-auto z-50">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm font-medium">Mínimo de 15 participantes para bateria fechada</p>
                    </div>
                </div>
            )}
        </div>
    )
}