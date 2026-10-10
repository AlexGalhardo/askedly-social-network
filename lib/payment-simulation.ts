/**
 * Demo mode (Docker/local): no gateway is called. The PIX is created and confirmed on the first check,
 * the credit purchase is credited immediately and the payout account and Stripe transfers are fictitious.
 * It gives away free money, so it never turns on in production on Vercel, even with the variable set by mistake.
 */
export const PAYMENTS_SIMULATED = process.env.PAYMENTS_SIMULATED === "true" && process.env.VERCEL_ENV !== "production";
