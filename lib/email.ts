// `onboarding@resend.dev` é o remetente de teste da Resend e só entrega para o dono da conta. Em produção,
// RESEND_FROM_EMAIL precisa ser um endereço de domínio verificado na Resend, senão os emails de reset não chegam.
export const EMAIL_FROM: string = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
