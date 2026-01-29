# PRD - Pistaverde Booking Frontend
> **Documento de Requisitos de Produto | FASE 1 - RESEARCH**  
> Gerado em: 22/01/2026

---

## 1. Auditoria da Lógica Atual vs Escopo

### 1.1 Integração com Supabase

| Aspecto | Status | Análise |
|---------|--------|---------|
| **Cliente Supabase** | ✅ Configurado | `lib/supabase.ts` já inicializa o cliente com variáveis de ambiente |
| **Fetch de Slots** | ✅ Funcional | `page.tsx` linha 69-98 busca slots da tabela `slots` |
| **Filtros** | ✅ Corretos | Filtra por `status: 'AVAILABLE'` e `type: 'OPEN'` quando aplicável |
| **Salvar em `bookings`** | ❌ **NÃO IMPLEMENTADO** | O botão "Reservar Agora" não executa nenhuma ação |
| **Salvar em `customers`** | ❌ **NÃO IMPLEMENTADO** | Não existe tela de coleta de dados do cliente |

> [!IMPORTANT]  
> A lógica de **leitura** já está conectada ao Supabase, mas a **conversão** (criação de booking) ainda não existe. Precisamos implementar todo o fluxo de checkout.

### 1.2 Código de Administração Encontrado

| Arquivo | Status | Ação Recomendada |
|---------|--------|------------------|
| `components/views/MobileHome.tsx` | ✅ Limpo | Apenas UI de Cliente |
| `components/views/DesktopHome.tsx` | ✅ Limpo | Apenas UI de Cliente |
| `app/page.tsx` | ✅ Limpo | Apenas lógica de agendamento |

> [!NOTE]  
> **Nenhum código administrativo encontrado.** O projeto está focado exclusivamente no fluxo do cliente.

### 1.3 Estrutura Atual do Estado (page.tsx)

```typescript
// Estados centralizados na página principal
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
```

**Avaliação:** A lógica está **bem isolada** em `page.tsx`. As views (`MobileHome`, `DesktopHome`) recebem apenas props e renderizam UI.

---

## 2. Análise de Responsividade (Mobile vs Desktop)

### 2.1 Comparativo de Arquitetura

| Aspecto | MobileHome.tsx | DesktopHome.tsx |
|---------|---------------|-----------------|
| **Linhas de código** | 334 | 334 |
| **Interface de props** | Centralizada via `HomeViewProps` | Importa de `MobileHome` |
| **Lógica de negócio** | Nenhuma (apenas UI) | Nenhuma (apenas UI) |
| **Cálculo de preço** | ⚠️ Duplicado (linhas 44-46) | ⚠️ Duplicado (linhas 20-22) |

### 2.2 Código Duplicado Identificado

**Ambos os arquivos contêm:**
```typescript
// Calculate prices dynamically
const subtotal = BUSINESS_CONFIG.price * peopleCount
const discount = subtotal * BUSINESS_CONFIG.discountRate
const total = subtotal - discount
```

### 2.3 Veredito Técnico: Custom Hook `useBooking`

> [!WARNING]  
> **RECOMENDAÇÃO CRÍTICA:** Criar um Custom Hook `useBooking()` para centralizar **toda** a lógica de negócio.

#### Justificativa Técnica:

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **Unificar tudo (1 componente responsivo)** | Menos arquivos | CSS complexo, difícil manutenção, layouts muito diferentes |
| **Custom Hook + UIs separadas** ✅ | Lógica centralizada, fácil teste, UIs otimizadas por device | 2 arquivos de UI |

#### Estrutura Recomendada:

```
hooks/
└── useBooking.ts        # Toda lógica de negócio + estados

components/views/
├── MobileHome.tsx       # Apenas renderização mobile
└── DesktopHome.tsx      # Apenas renderização desktop
```

#### O hook `useBooking` deve conter:
1. **Estados:** `selectedDate`, `selectedSlot`, `peopleCount`, `bookingType`, `customer`, `step`
2. **Derivados:** `subtotal`, `discount`, `total` (calculados, não duplicados)
3. **Ações:** `fetchSlots()`, `selectSlot()`, `submitBooking()`, `validateCustomer()`
4. **Estado da UI:** `isLoading`, `error`, `currentStep`

---

## 3. Arquitetura do Fluxo de Agendamento

### 3.1 Fluxo Completo de Conversão

```mermaid
stateDiagram-v2
    [*] --> Passo1_Selecao: Usuário acessa página
    Passo1_Selecao --> Passo2_Dados: Clica "Reservar Agora"
    Passo2_Dados --> Passo3_Confirmacao: Preenche Nome/Celular
    Passo3_Confirmacao --> [*]: Vê confirmação + Feedback

    note right of Passo1_Selecao: 📅 Seleção de Data/Hora + Participantes
    note right of Passo2_Dados: 👤 Coleta Nome + Celular → customers
    note right of Passo3_Confirmacao: ✅ Criar booking + Tela de Sucesso
```

### 3.2 Estrutura Proposta: Multi-Step Modal

> [!TIP]  
> **Recomendação:** Usar **Modals com steps** em vez de novas rotas. Isso mantém a experiência fluida e evita recarregamentos de página (melhor conversão).

#### Estrutura de Pastas:

```
components/
├── booking/                        # Novo diretório de checkout
│   ├── BookingModal.tsx           # Container principal do modal
│   ├── steps/
│   │   ├── StepSlotSelection.tsx  # Passo 1: Calendário + Horários (já existe parcialmente)
│   │   ├── StepCustomerData.tsx   # Passo 2: Formulário Nome + Celular
│   │   └── StepConfirmation.tsx   # Passo 3: Resumo + Ação final
│   └── BookingSuccess.tsx         # Tela de sucesso pós-booking
│
├── views/
│   ├── MobileHome.tsx             # Mantido
│   └── DesktopHome.tsx            # Mantido
│
└── ui/                            # Shadcn (mantido)

hooks/
└── useBooking.ts                  # Nova lógica centralizada

lib/
├── supabase.ts                    # Mantido
├── utils.ts                       # Mantido
└── api/
    └── bookings.ts                # Funções: createCustomer(), createBooking()
```

### 3.3 Fluxo de Dados Detalhado

#### Passo 1: Seleção de Horário (Existente +/-)
- **Já existe:** Calendário, seleção de slots, contagem de pessoas
- **Modificar:** "Reservar Agora" → abre próximo step (não apenas `console.log`)

#### Passo 2: Coleta de Dados (Novo)

```typescript
interface CustomerData {
  name: string      // Validar: mínimo 3 caracteres
  phone: string     // Validar: formato brasileiro (11-12 dígitos)
}
```

**UI Sugerida:**
- Input de Nome (obrigatório)
- Input de Celular com máscara `(99) 99999-9999`
- Botão "Continuar" (validação antes de avançar)

#### Passo 3: Confirmação (Novo)

**Ações ao confirmar:**
1. `INSERT INTO customers (name, phone)` → retorna `customer.id`
2. `INSERT INTO bookings (slot_id, customer_id, people_count)` → retorna `booking.id`
3. Exibir tela de sucesso com código de reserva

> [!CAUTION]  
> Os **triggers do banco** já previnem overbooking. O frontend deve capturar erros de capacidade e exibir feedback amigável.

### 3.4 Tratamento de Erros

| Erro | Causa | Ação no Frontend |
|------|-------|------------------|
| `capacity_exceeded` | Trigger rejeitou por falta de vagas | Mostrar toast: "Desculpe, as vagas esgotaram" |
| `slot_unavailable` | Slot mudou para BOOKED | Voltar ao calendário, recarregar slots |
| `network_error` | Falha de conexão | Botão "Tentar Novamente" |

---

## 4. Resumo Executivo de Ações

| Prioridade | Ação | Impacto na Conversão |
|------------|------|---------------------|
| 🔴 Alta | Criar `useBooking` hook | Evita bugs de estado, facilita manutenção |
| 🔴 Alta | Implementar `StepCustomerData` | **Crítico:** Sem isso, não há booking |
| 🔴 Alta | Implementar `StepConfirmation` | **Crítico:** Fecha o funil de conversão |
| 🟡 Média | Criar `lib/api/bookings.ts` | Organização e testabilidade |
| 🟡 Média | Adicionar validação de celular | Melhora qualidade dos dados |
| 🟢 Baixa | Remover cálculo duplicado de preço | Dívida técnica menor |

---

## 5. Considerações de Performance

| Aspecto | Recomendação |
|---------|--------------|
| **Bundle Size** | Lazy load do modal de booking |
| **UX de Formulário** | Validação em tempo real (react-hook-form) |
| **Otimistic UI** | Ao confirmar, mostrar sucesso imediato enquanto aguarda resposta |
| **Cache de Slots** | Invalidar cache ao selecionar novo dia |

---

**Próximos Passos:** Aguardar aprovação para iniciar FASE 2 (Implementação).
