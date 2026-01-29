"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const BottomSheet = DialogPrimitive.Root
const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetPortal = DialogPrimitive.Portal
const BottomSheetClose = DialogPrimitive.Close

const BottomSheetOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            // Força o overlay a ficar em layer separada
            "will-change-[opacity]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
))
BottomSheetOverlay.displayName = "BottomSheetOverlay"

// ===== CONFIGURAÇÕES DE FÍSICA =====
const CLOSE_THRESHOLD = 100
const DRAG_RESISTANCE_UP = 0.15
const MAX_DRAG_UP = 0
const SCROLL_PADDING_BOTTOM = 24 // px de espaço extra ao scrollar

interface BottomSheetContentProps
    extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
    hideCloseButton?: boolean
}

const BottomSheetContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    BottomSheetContentProps
>(({ className, children, hideCloseButton = false, ...props }, ref) => {
    // Estado de drag
    const [dragOffset, setDragOffset] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const [isClosing, setIsClosing] = React.useState(false)
    const startY = React.useRef<number>(0)

    // Refs
    const closeButtonRef = React.useRef<HTMLButtonElement>(null)
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)

    // Controle de keyboard
    const activeInputRef = React.useRef<HTMLElement | null>(null)
    const keyboardHeight = React.useRef(0)

    // Reset estado ao abrir
    React.useEffect(() => {
        setIsClosing(false)
        setDragOffset(0)
        setIsDragging(false)
        activeInputRef.current = null
        keyboardHeight.current = 0
    }, [])

    // ===== SOLUÇÃO PROFISSIONAL PARA KEYBOARD AVOIDANCE =====
    React.useEffect(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer || typeof window === "undefined") return

        // Função para scrollar o input para posição visível
        const scrollInputIntoView = (target: HTMLElement) => {
            // Aguarda o próximo frame para garantir que o layout foi atualizado
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!scrollContainer) return

                    const inputRect = target.getBoundingClientRect()
                    const containerRect = scrollContainer.getBoundingClientRect()

                    // Calcula a posição ideal: input deve ficar no terço superior da área visível
                    const visualViewport = window.visualViewport
                    const availableHeight = visualViewport
                        ? visualViewport.height
                        : window.innerHeight

                    // Posição onde queremos que o input fique (terço superior da tela)
                    const targetPosition = availableHeight * 0.25

                    // Calcula quanto precisamos scrollar
                    const inputTopRelativeToContainer = inputRect.top - containerRect.top
                    const currentScroll = scrollContainer.scrollTop
                    const newScroll = currentScroll + inputTopRelativeToContainer - targetPosition + SCROLL_PADDING_BOTTOM

                    // Scroll suave
                    scrollContainer.scrollTo({
                        top: Math.max(0, newScroll),
                        behavior: 'smooth'
                    })
                })
            })
        }

        // Handler para focus em inputs
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement
            const isFormElement = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT'

            if (isFormElement) {
                activeInputRef.current = target
                scrollInputIntoView(target)
            }
        }

        // Handler para quando o input perde foco
        const handleFocusOut = () => {
            activeInputRef.current = null
        }

        // Handler para resize do visualViewport (quando keyboard abre/fecha)
        const handleViewportResize = () => {
            if (!window.visualViewport) return

            const currentHeight = window.visualViewport.height
            const previousHeight = keyboardHeight.current || window.innerHeight

            // Detecta se o keyboard abriu (viewport diminuiu)
            const keyboardOpened = currentHeight < previousHeight

            keyboardHeight.current = currentHeight

            // Se keyboard abriu E temos um input ativo, scrolla novamente
            if (keyboardOpened && activeInputRef.current) {
                scrollInputIntoView(activeInputRef.current)
            }
        }

        // Listeners
        scrollContainer.addEventListener('focusin', handleFocusIn)
        scrollContainer.addEventListener('focusout', handleFocusOut)

        // Visual Viewport API para detecção precisa do keyboard
        if (window.visualViewport) {
            keyboardHeight.current = window.visualViewport.height
            window.visualViewport.addEventListener('resize', handleViewportResize)
        }

        return () => {
            scrollContainer.removeEventListener('focusin', handleFocusIn)
            scrollContainer.removeEventListener('focusout', handleFocusOut)
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportResize)
            }
        }
    }, [])

    // ===== TOUCH HANDLERS (sem alterações) =====
    const handleTouchStart = (e: React.TouchEvent) => {
        if (hideCloseButton) return

        // Previne drag se estiver interagindo com input
        const target = e.target as HTMLElement
        const isFormElement = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.closest('input, textarea, select')

        if (isFormElement) return

        startY.current = e.touches[0].clientY
        setIsDragging(true)
        setIsClosing(false)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || hideCloseButton) return
        const currentY = e.touches[0].clientY
        let diff = currentY - startY.current

        if (diff < 0) {
            diff = diff * DRAG_RESISTANCE_UP
            if (diff < MAX_DRAG_UP) diff = MAX_DRAG_UP
        }
        setDragOffset(diff)
    }

    const handleTouchEnd = () => {
        if (!isDragging || hideCloseButton) return
        setIsDragging(false)

        if (dragOffset > CLOSE_THRESHOLD) {
            setIsClosing(true)
            setTimeout(() => closeButtonRef.current?.click(), 120)
        } else {
            setDragOffset(0)
        }
    }

    // ===== ESTILO COM CORREÇÕES ANTI-GLITCH =====
    const dragStyle: React.CSSProperties = {
        transform: isClosing
            ? 'translate3d(0, 100%, 0)'
            : `translate3d(0, ${dragOffset}px, 0)`,
        transition: isDragging
            ? 'none'
            : isClosing
                ? 'transform 0.10s ease-out'
                : 'transform 0.10s cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Anti-glitch properties
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        perspective: 1000,
        WebkitPerspective: 1000,
        // Força rendering em layer separada
        willChange: isDragging ? 'transform' : 'auto',
    }

    const handleOpenAutoFocus = (e: Event) => {
        e.preventDefault()
        setIsClosing(false)
        setDragOffset(0)
        setIsDragging(false)
    }

    return (
        <BottomSheetPortal>
            <BottomSheetOverlay />
            <DialogPrimitive.Content
                ref={ref}
                style={dragStyle}
                onOpenAutoFocus={handleOpenAutoFocus}
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-50",
                    "w-full md:max-w-lg md:left-1/2 md:-translate-x-1/2",
                    "bg-background border-t border-x rounded-t-3xl shadow-2xl",
                    // Isolamento crítico para evitar glitches
                    "isolate",
                    // Força contexto de empilhamento independente
                    "transform-gpu",
                    "max-h-[100dvh] flex flex-col",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                    "data-[state=closed]:duration-200 data-[state=open]:duration-300",
                    className
                )}
                {...props}
            >
                {/* Drag Handle */}
                <div
                    className={cn(
                        "flex justify-center touch-none select-none",
                        hideCloseButton ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                        "pt-3 pb-2 flex-shrink-0"
                    )}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>

                {/* Scrollable Content Area */}
                <div
                    ref={scrollContainerRef}
                    className={cn(
                        "flex-1 overflow-y-auto overscroll-contain px-6 w-full",
                        // Suaviza scroll no iOS
                        "-webkit-overflow-scrolling-touch"
                    )}
                    style={{
                        // Garante que o scroll container tenha uma layer própria
                        willChange: 'scroll-position',
                    }}
                >
                    {/* Content wrapper com padding dinâmico */}
                    <div
                        ref={contentRef}
                        className="w-full"
                        style={{
                            // Padding bottom generoso para garantir scroll completo
                            // Considera safe-area do iOS
                            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                            minHeight: '100%',
                        }}
                    >
                        {children}
                    </div>
                </div>

                {/* Close Button */}
                <DialogPrimitive.Close
                    ref={closeButtonRef}
                    className={cn(
                        "absolute right-4 top-4 z-10 rounded-full p-2 opacity-70",
                        "ring-offset-background transition-opacity",
                        "hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        "disabled:pointer-events-none",
                        hideCloseButton && "hidden"
                    )}
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Fechar</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </BottomSheetPortal>
    )
})
BottomSheetContent.displayName = "BottomSheetContent"

const BottomSheetHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("space-y-1.5 text-center sm:text-left mb-4", className)}
        {...props}
    />
)
BottomSheetHeader.displayName = "BottomSheetHeader"

const BottomSheetTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn("text-xl font-bold leading-none tracking-tight", className)}
        {...props}
    />
))
BottomSheetTitle.displayName = "BottomSheetTitle"

const BottomSheetDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground mt-1", className)}
        {...props}
    />
))
BottomSheetDescription.displayName = "BottomSheetDescription"

export {
    BottomSheet,
    BottomSheetPortal,
    BottomSheetOverlay,
    BottomSheetTrigger,
    BottomSheetClose,
    BottomSheetContent,
    BottomSheetHeader,
    BottomSheetTitle,
    BottomSheetDescription,
}