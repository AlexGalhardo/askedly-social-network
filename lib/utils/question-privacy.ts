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
