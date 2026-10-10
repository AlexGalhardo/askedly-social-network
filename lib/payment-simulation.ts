/**
 * Modo demonstração (Docker/local): nenhum gateway é chamado. O PIX nasce e é confirmado na primeira consulta,
 * a compra de créditos é creditada na hora e a conta de recebimento e as transferências Stripe são fictícias.
 * Dá dinheiro de graça, então nunca liga em produção na Vercel, mesmo com a variável definida por engano.
 */
export const PAYMENTS_SIMULATED = process.env.PAYMENTS_SIMULATED === "true" && process.env.VERCEL_ENV !== "production";
