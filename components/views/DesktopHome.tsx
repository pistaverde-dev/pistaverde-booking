"use client"

import { CalendarIcon, Users, Heart, MapPin, CheckCircle, ArrowRight, Minus, Plus, Share2, Accessibility, Ruler, Baby, Shirt, Car, AlertCircle, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { HomeViewProps } from './MobileHome'
import { BUSINESS_CONFIG } from '@/lib/config'

export default function DesktopHome({
    displayDate,
    displayTime,
    peopleCount,
    bookingType,
    showMinWarning,
    selectedSlotId,
    onOpenCalendarModal,
    onOpenBookingModal,
    onPeopleIncrement,
    onPeopleDecrement,
    onBookingTypeChange,
}: HomeViewProps) {
    // Calculate prices dynamically
    const subtotal = BUSINESS_CONFIG.price * peopleCount
    const discount = subtotal * BUSINESS_CONFIG.discountRate
    const total = subtotal - discount

    return (
        <div className="w-full min-h-screen bg-background relative">
            {/* Full Width Hero Section */}
            <div className="relative h-[45vh] w-full overflow-hidden">
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7Yggv6DLP_fJMYHJVE_K5kgj1cdxGM7k-Bf0xvLG0Br4CJWpeISfhJWKrnPvGPtLni-6hXpu9lY7XgWcerl3V5JApLH9MCpirWiW2I3PgIlfKTWcNLkdnVWur_10sw3HKlSJUJcdDTaYy-Zb3EaTBbmBxsDQfp8oXF4RNDyZAyndj3lnBqkObxt7PMYK_FYnljpAY-rUe_bPbpH95pjXpwaYTyM82NAntdNIef0f4dnHVKb5rK0QgMBwslNlcUtHmsqoIGRlbADKP"
                    alt="Pista de Kart"
                    className="w-full h-full object-cover object-[center_45%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Hero Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">{BUSINESS_CONFIG.name}</h1>
                                <div className="flex items-center gap-2 text-white/90 text-lg">
                                    <MapPin className="w-5 h-5" />
                                    {BUSINESS_CONFIG.address}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-3 rounded-full font-semibold flex items-center gap-2 transition">
                                    <Share2 className="w-5 h-5" />
                                    Compartilhar
                                </button>
                                <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition">
                                    <Heart className="w-5 h-5" />
                                </button>
                                {/* <button className="bg-card hover:bg-white/90 text-foreground px-5 py-3 rounded-full font-semibold flex items-center gap-2 transition">
                                    <GridIcon className="w-5 h-5" />
                                    Mostrar fotos
                                </button> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 lg:px-12 py-10">
                <div className="grid grid-cols-3 gap-10">
                    {/* Left Column - Content */}
                    <div className="col-span-2 space-y-10">
                        {/* Host Info */}
                        <div className="flex items-center justify-between pb-8 border-b border-border">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                                    <img src="/monaco-logo.png" alt="Mônaco Racing" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">Mônaco Racing</p>
                                    <p className="text-sm text-blue-500 underline cursor-pointer">Ver Perfil</p>
                                </div>
                            </div>
                            <div className="bg-primary/10 text-primary text-sm px-3 py-2 rounded-lg font-bold flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Verificado
                            </div>
                        </div>

                        {/* About Section */}
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Sobre a atividade</h2>
                            <div className="text-muted-foreground text-base leading-relaxed space-y-4">
                                <p>
                                    Sinta a adrenalina de pilotar no Mônaco Kart! Pista profissional indoor no Shopping Ventura com karts de alta performance.
                                </p>
                                <p>
                                    Nossa pista conta com 420 metros de pura emoção, curvas desafiadoras e retas de alta velocidade. Os karts são equipados com motores de última geração que garantem segurança e diversão.
                                </p>
                                <p>
                                    Perfeito para iniciantes e pilotos experientes. Toda bateria inclui briefing de segurança completo e equipamentos de proteção individual.
                                </p>
                            </div>
                        </section>

                        {/* Requirements */}
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Requisitos & Informações</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
                                    <Accessibility className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Acessibilidade</p>
                                        <p className="text-sm text-muted-foreground">Com restrições</p>
                                    </div>
                                </div>
                                <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
                                    <Ruler className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Altura Mínima</p>
                                        <p className="text-sm text-muted-foreground">1,40 metros</p>
                                    </div>
                                </div>
                                <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
                                    <Baby className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Idade Mínima</p>
                                        <p className="text-sm text-muted-foreground">14 anos</p>
                                    </div>
                                </div>
                                <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
                                    <Shirt className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Vestimenta</p>
                                        <p className="text-sm text-muted-foreground">Roupa confortável e calçado fechado</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* FAQ Section */}
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Dúvidas Frequentes</h2>
                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                <div className="divide-y divide-border">
                                    <details className="group">
                                        <summary className="flex items-center justify-between p-6 cursor-pointer transition">
                                            <span className="text-base font-semibold">Qual a altura mínima necessária?</span>
                                            <ArrowRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
                                        </summary>
                                        <div className="px-6 pb-6 text-base text-muted-foreground">
                                            A altura mínima para pilotar é de 1,40m. Essa medida garante que o piloto consiga alcançar os pedais e ter controle total do kart com segurança.
                                        </div>
                                    </details>
                                    <details className="group">
                                        <summary className="flex items-center justify-between p-6 cursor-pointer transition">
                                            <span className="text-base font-semibold">Preciso ter experiência anterior?</span>
                                            <ArrowRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
                                        </summary>
                                        <div className="px-6 pb-6 text-base text-muted-foreground">
                                            Não! Nossa atividade é perfeita tanto para iniciantes quanto para pilotos experientes. Oferecemos um briefing completo antes de cada bateria.
                                        </div>
                                    </details>
                                    <details className="group">
                                        <summary className="flex items-center justify-between p-6 cursor-pointer transition">
                                            <span className="text-base font-semibold">Fornecem equipamento?</span>
                                            <ArrowRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
                                        </summary>
                                        <div className="px-6 pb-6 text-base text-muted-foreground">
                                            Sim! Fornecemos todos os equipamentos de segurança necessários: capacete, touca higiênica e luvas.
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </section>

                        {/* Meeting Point */}
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Ponto de Encontro</h2>
                            <div className="w-full h-80 relative rounded-2xl overflow-hidden border border-border">
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
                                        <p className="text-xs text-muted-foreground">Clique para abrir no GPS</p>
                                    </div>
                                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold">
                                        Abrir Mapa
                                    </div>
                                </a>
                                */}
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Sticky Booking Card */}
                    <div className="col-span-1">
                        <div className="sticky top-6">
                            <div className="bg-card p-8 rounded-2xl shadow-xl border border-border">
                                {/* Price Header */}
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(BUSINESS_CONFIG.price)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">por pessoa</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-sm font-bold px-4 py-2 rounded-full flex items-center gap-1">
                                        <span>🏷️</span> -{BUSINESS_CONFIG.discountRate * 100}% OFF
                                    </span>
                                </div>

                                {/* 1. Booking Type - Label OUTSIDE the box */}
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Tipo de Bateria</p>
                                <div className="w-full p-4 bg-card border border-border rounded-xl mb-5">
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

                                {/* 2. Participants - Label OUTSIDE the box */}
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Participantes</p>
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
                                            className={`w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-background transition text-muted-foreground ${peopleCount <= (bookingType === 'PRIVATE' ? 15 : 1) ? 'opacity-40' : ''}`}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-bold min-w-[32px] text-center text-lg text-foreground">{peopleCount}</span>
                                        <button
                                            onClick={onPeopleIncrement}
                                            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-background transition text-muted-foreground"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* 3. Date and Time - Label OUTSIDE the box */}
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Data e Horário</p>
                                <button
                                    onClick={onOpenCalendarModal}
                                    className="w-full p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary transition-colors text-left flex items-center justify-between mb-6"
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

                                {/* Price Summary */}
                                <div className="space-y-3 mb-6 pt-6 border-t border-border">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground underline cursor-pointer">{peopleCount}x Bateria Adulto</span>
                                        <span className="text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-green-600">Desconto Online ({BUSINESS_CONFIG.discountRate * 100}%)</span>
                                        <span className="text-green-600">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-border">
                                        <span className="font-bold text-lg text-foreground">Total</span>
                                        <span className="font-bold text-2xl text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                                    </div>
                                </div>

                                {/* Reserve Button */}
                                <button
                                    onClick={onOpenBookingModal}
                                    disabled={!selectedSlotId}
                                    className={`w-full font-bold py-5 text-lg rounded-full shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${selectedSlotId
                                        ? 'bg-primary hover:bg-primary/90 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {selectedSlotId ? 'Reservar Agora' : 'Selecione data e horário'}
                                </button>

                                {/* Note */}
                                <p className="text-center text-sm text-muted-foreground mt-5">
                                    Não cobraremos nada agora. O pagamento é feito no local.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Warning */}
            {showMinWarning && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl shadow-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm font-medium">Mínimo de 15 participantes para bateria fechada</p>
                    </div>
                </div>
            )}
        </div>
    )
}
