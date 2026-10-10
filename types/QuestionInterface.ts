export interface QuestionInterface {
	id: string;
	is_seed: boolean;
	question_text: string;
	answer_text: string | null;
	answered_at: Date | string | null;
	amount_paid: number;
	currency?: string;
	amount_already_withdraw: boolean;
	asker_want_answer_to_be_private: boolean;
	asker_sent_anonymous_question: boolean;
	amount_paid_is_private: boolean;
	onwer_wants_amount_paid_not_show_public: boolean;
	owner_user_nickname: string;
	asked_by_user_nickname: string;
	question_is_awaiting_answer: boolean;
	question_answered: boolean;
	question_answer_was_recused: boolean;
	question_answer_was_expired: boolean;
	question_answer_recused_at: Date | string | null;
	question_answer_expired_at: Date | string | null;
	liked_by_users: string | null;
	desliked_by_users: string | null;
	owner_reported_offensive_question: boolean;
	onwer_reported_inadequate_question: boolean;
	onwer_reported_question_at: Date | string | null;
	asker_reported_answer: boolean;
	asker_reported_answer_reason: string | null;
	asker_reported_answer_at: Date | string | null;
	payment_withdraw_id: string | null;
	created_at: Date | string;
	updated_at: Date | string | null;
	deleted_at: Date | string | null;
	webhook_id: string | null;
	owner: {
		id: string;
		name: string;
		nickname: string;
		email: string;
		avatar_url: string | null;
		description: string | null;
		website: string | null;
		twitter: string | null;
		instagram: string | null;
		youtube: string | null;
		tiktok: string | null;
		linkedin: string | null;
		twitch: string | null;
		facebook: string | null;
		github: string | null;
		created_at: string;
	} | null;
	asked_by: {
		id: string;
		name: string;
		nickname: string;
		email: string;
		avatar_url: string | null;
		description: string | null;
		website: string | null;
		twitter: string | null;
		instagram: string | null;
		youtube: string | null;
		tiktok: string | null;
		linkedin: string | null;
		twitch: string | null;
		facebook: string | null;
		github: string | null;
		created_at: string;
	} | null;
}

export type QuestionStatus = "pending" | "answered" | "declined" | "expired" | "reported";

export interface QuestionActionParams {
	questionId: string;
	nickname: string;
	answerText?: string;
}

export interface ReportQuestionParams {
	questionId: string;
	nickname: string;
	isOffensive: boolean;
	isInappropriate: boolean;
}
