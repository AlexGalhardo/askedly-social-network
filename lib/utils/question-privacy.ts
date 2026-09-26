export interface AnonymizableQuestion {
	asker_sent_anonymous_question: boolean;
	asked_by: unknown;
	asked_by_user_nickname: string;
}

export type WithOptionalAsker<T extends AnonymizableQuestion> = Omit<T, "asked_by"> & {
	asked_by: T["asked_by"] | null;
};

export function hideAnonymousAsker<T extends AnonymizableQuestion>(question: T): WithOptionalAsker<T> {
	return question.asker_sent_anonymous_question
		? { ...question, asked_by: null, asked_by_user_nickname: "" }
		: question;
}

// Campos da pergunta que só servem ao servidor (pagamento, saque, moderação).
const INTERNAL_QUESTION_FIELDS = [
	"webhook_id",
	"payment_withdraw_id",
	"amount_already_withdraw",
	"asker_reported_answer_reason",
	"asker_reported_answer_at",
	"owner_reported_offensive_question",
	"onwer_reported_inadequate_question",
	"onwer_reported_question_at",
] as const;

interface PublicQuestionInput extends AnonymizableQuestion {
	amount_paid: number;
	amount_paid_is_private: boolean;
	owner?: { privacy_show_value_received_from_answering_question?: boolean } | null;
}

export type PublicQuestionView<T extends PublicQuestionInput> = Omit<
	WithOptionalAsker<T>,
	"amount_paid" | (typeof INTERNAL_QUESTION_FIELDS)[number]
> & { amount_paid: number | null };

/**
 * Pergunta como qualquer visitante pode recebê-la: sem autor se anônima, sem campos internos e sem valor pago
 * quando o dono não o tornou público (a tela já escondia, mas o valor ia no JSON).
 */
export function toPublicQuestion<T extends PublicQuestionInput>(question: T): PublicQuestionView<T> {
	const amountIsPublic =
		!!question.owner?.privacy_show_value_received_from_answering_question && !question.amount_paid_is_private;
	const view: Record<string, unknown> = {
		...hideAnonymousAsker(question),
		amount_paid: amountIsPublic ? question.amount_paid : null,
	};
	for (const field of INTERNAL_QUESTION_FIELDS) delete view[field];
	return view as PublicQuestionView<T>;
}
