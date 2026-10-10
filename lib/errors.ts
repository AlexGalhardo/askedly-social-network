import { ZodError } from "zod";

/**
 * Error message that may go to the user. Validation errors (Zod) are already written for them; any other
 * (Prisma, network, bug) may carry internal detail, so it becomes the generic text. The detail stays in TelegramLog.
 */
export function publicErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof ZodError) return error.issues[0]?.message ?? fallback;
	return fallback;
}
