export interface SeedUserInterface {
	id: string;
	name: string;
	nickname: string;
	email: string;
	password: string;
	description: string | null;
	website: string | null;
	pix_key: string | null;
	avatar_url: string | null;
	twitter: string | null;
	instagram: string | null;
	youtube: string | null;
	tiktok: string | null;
	linkedin: string | null;
	github: string | null;
	facebook: string | null;
	twitch: string | null;
	api_key: string;
	is_admin?: boolean;
	is_seed: boolean;
	privacy_accept_anonymous_questions: boolean;
	privacy_show_anonymous_questions_public: boolean;
	privacy_show_questions_answered_only_to_followers: boolean;
	privacy_show_value_received_from_answering_question: boolean;
	privacy_show_date_questions_was_answered: boolean;
	privacy_show_total_followers_public: boolean;
	privacy_show_total_questions_sent_public: boolean;
	privacy_show_likes_each_answer_public: boolean;
	privacy_show_dislikes_each_answer_public: boolean;
	privacy_show_total_likes_all_answers_public: boolean;
	privacy_show_total_questions_received_public: boolean;
	privacy_show_total_questions_answered_public: boolean;
	created_at?: Date;
	deleted_at?: Date | null;
	banned_until?: Date | null;
}

export interface SeedQuestionInterface {
	id?: number;
	question_text: string;
	answer_text: string | null;
	answered_at: Date | null;
	amount_paid: number;
	asker_want_answer_to_be_private: boolean;
	asker_sent_anonymous_question: boolean;
	owner_user_nickname: string;
	asked_by_user_nickname: string;
	question_is_awaiting_answer: boolean;
	question_answered: boolean;
	question_answer_was_recused: boolean;
	question_answer_was_expired: boolean;
	answer_deleted_at?: Date | null;
	liked_by_users: string;
	desliked_by_users: string;
	webhook_id: string;
	is_seed: boolean;
	created_at: Date;
	deleted_at?: Date | null;
}

export interface SeedWebhookInterface {
	id: string;
	pix_id: string;
	status: string;
	amount: number;
	fee: number;
	method: string;
	kind: string;
	event_status: string;
	dev_mode: boolean;
	complete_event: string;
	is_seed?: boolean;
}

export interface SeedFollowerInterface {
	followerId: string;
	followingId: string;
}

export interface SeedQuestionAnswerInterface {
	question: string;
	answer: string;
}

export interface SeedConfigInterface {
	totalUsers: number;
	totalFollowers: number;
	totalQuestions: number;
}

export type SeedQuestionStateType = "answered" | "waiting" | "refused" | "expired";
