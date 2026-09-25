// Segredos da AbacatePay: só podem ser lidos no servidor. Nunca importe este módulo em componente client
// nem use prefixo NEXT_PUBLIC_, que embute o valor no bundle público do navegador.
export const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;
export const ABACATEPAY_WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET;
