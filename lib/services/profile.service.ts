import { hideAnonymousAsker, toPublicQuestion } from "@/lib/utils/question-privacy";

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
	id: string;
	amount_paid: number;
	amount_paid_is_private: boolean;
	question_answered: boolean;
	asker_want_answer_to_be_private: boolean;
	asker_sent_anonymous_question: boolean;
	liked_by_users: string | null;
	asked_by: unknown;
	asked_by_user_nickname: string;
}

interface Profile {
	id: string;
	questions_received: ProfileQuestion[];
	questions_sent: ProfileQuestion[];
	followers?: unknown[];
	following?: unknown[];
	blocked_users?: unknown[];
	blocked_by_users?: unknown[];
	follow_requests_received?: unknown[];
	follow_requests_sent?: unknown[];
	privacy_show_total_questions_received_public?: boolean;
	privacy_show_total_questions_answered_public?: boolean;
	privacy_show_total_likes_all_answers_public?: boolean;
	privacy_show_total_questions_sent_public?: boolean;
	privacy_show_total_followers_public?: boolean;
}

export interface ProfileViewer {
	viewerId: string | null;
	isFollowing: boolean;
}

// Só o que os contadores do cabeçalho do perfil usam: sem texto, autor ou valor.
function questionSkeleton(question: ProfileQuestion) {
	const likesArePublic = question.question_answered && !question.asker_want_answer_to_be_private;
	return {
		id: question.id,
		question_answered: question.question_answered,
		asker_want_answer_to_be_private: question.asker_want_answer_to_be_private,
		liked_by_users: likesArePublic ? question.liked_by_users : null,
	};
}

const idOnly = (row: unknown): { id: unknown } => ({ id: (row as { id?: unknown }).id });

/**
 * Perfil como o visitante pode recebê-lo. Replica no servidor a regra que a tela aplicava depois de receber tudo:
 * conteúdo de pergunta só para o dono ou, se respondida e não privada, para quem o segue. O resto vira esqueleto
 * para os contadores, e só se o contador for público. O tipo de retorno mantém o shape de entrada por conveniência;
 * em runtime os campos removidos não existem.
 */
export function toPublicProfile<T extends Profile>(user: T, { viewerId, isFollowing }: ProfileViewer): T {
	if (viewerId === user.id) {
		return stripPrivateFields({
			...user,
			questions_received: user.questions_received.map(hideAnonymousAsker),
		}) as T;
	}

	const questionCountsArePublic =
		user.privacy_show_total_questions_received_public ||
		user.privacy_show_total_questions_answered_public ||
		user.privacy_show_total_likes_all_answers_public;
	const canSee = (q: ProfileQuestion): boolean =>
		isFollowing && q.question_answered && !q.asker_want_answer_to_be_private;

	const publicUser = {
		...user,
		questions_received: user.questions_received.flatMap((q) => {
			if (canSee(q)) return [toPublicQuestion(q)];
			return questionCountsArePublic ? [questionSkeleton(q)] : [];
		}),
		questions_sent: user.privacy_show_total_questions_sent_public
			? user.questions_sent.filter((q) => !q.asker_sent_anonymous_question).map(idOnly)
			: [],
		followers: user.privacy_show_total_followers_public ? (user.followers ?? []).map(idOnly) : [],
		following: user.privacy_show_total_followers_public ? (user.following ?? []).map(idOnly) : [],
		blocked_users: [],
		blocked_by_users: [],
		follow_requests_received: [],
		follow_requests_sent: [],
	};
	return stripPrivateFields(publicUser) as T;
}
