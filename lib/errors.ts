import { ZodError } from "zod";

/**
 * Mensagem de erro que pode ir para o usuário. Erros de validação (Zod) já são escritos para ele; qualquer outro
 * (Prisma, rede, bug) pode carregar detalhe interno, então vira o texto genérico. O detalhe fica no TelegramLog.
 */
export function publicErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof ZodError) return error.issues[0]?.message ?? fallback;
	return fallback;
}
