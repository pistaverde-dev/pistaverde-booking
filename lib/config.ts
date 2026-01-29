/**
 * Configurações do negócio para o sistema de reservas
 */
export const BUSINESS_CONFIG = {
    name: "Mônaco Kart",
    address: "Shopping Ventura - G5 - R. Itacolomi, 292 - Portão, Curitiba",

    // Preços
    price: 110.00,           // Valor base por pessoa (R$)
    discountRate: 0.10,      // 10% de desconto

    // Limites de participantes
    minParticipants: 1,
    maxParticipants: 15,
    privateMinParticipants: 15,
    privateMaxParticipants: 50,

    // Configuração de slots
    slots: {
        durationMinutes: 25,
        intervalMinutes: 30
    }
} as const;

export type BusinessConfig = typeof BUSINESS_CONFIG;
