"use client"

import { useState, useEffect } from 'react'

/**
 * Hook para detectar se estamos em viewport mobile ou desktop
 * Usa matchMedia para sincronizar com os breakpoints do Tailwind
 * 
 * @param breakpoint - O breakpoint em pixels (padrão: 768 para md:)
 * @returns boolean - true se for mobile (viewport < breakpoint)
 */
export function useIsMobile(breakpoint: number = 768): boolean {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Função para verificar o tamanho da viewport
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < breakpoint)
        }

        // Verifica no mount
        checkIsMobile()

        // Usa matchMedia para ouvir mudanças (mais performático que resize)
        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)

        const handleChange = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches)
        }

        // Adiciona listener
        mediaQuery.addEventListener('change', handleChange)

        return () => {
            mediaQuery.removeEventListener('change', handleChange)
        }
    }, [breakpoint])

    return isMobile
}
