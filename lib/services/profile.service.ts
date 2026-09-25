import { hideAnonymousAsker } from "@/lib/repositories/questions.repository";

const PRIVATE_USER_FIELDS = new Set([
	"password",
	"email",
	"pix_key",
	"api_key",
	"reset_password_token",
	"reset_password_token_expires_at",
	"confirm_email_token",
	"confirm_email_token_expires_at",
]);

// Remove em qualquer profundidade: perfil e sessão vêm com includes aninhados (seguidores, perguntas com dono e
// autor) e cada um desses é uma linha inteira de User.
export function stripPrivateFields(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(stripPrivateFields);
	if (value === null || typeof value !== "object" || value instanceof Date) return value;
	return Object.fromEntries(
		Object.entries(value)
			.filter(([key]) => !PRIVATE_USER_FIELDS.has(key))
			.map(([key, nested]) => [key, stripPrivateFields(nested)]),
	);
}

interface ProfileQuestion {
	asker_sent_anonymous_question: boolean;
	asked_by: unknown;
	asked_by_user_nickname: string;
}

interface Profile {
	id: string;
	questions_received: ProfileQuestion[];
	questions_sent: ProfileQuestion[];
}

/**
 * Perfil como qualquer visitante pode recebê-lo. O tipo de retorno mantém o shape de entrada por conveniência,
 * mas os campos de `PRIVATE_USER_FIELDS` não existem em runtime.
 */
export function toPublicProfile<T extends Profile>(user: T, viewerId: string | null): T {
	const isSelf = viewerId === user.id;
	const publicUser = {
		...user,
		questions_received: user.questions_received.map(hideAnonymousAsker),
		questions_sent: isSelf
			? user.questions_sent
			: user.questions_sent.filter((question) => !question.asker_sent_anonymous_question),
	};
	return stripPrivateFields(publicUser) as T;
}
