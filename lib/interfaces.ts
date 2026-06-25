export interface User {
	id: string;
	name: string;
	nickname: string;
	email: string;
	password: string;
	description: string;
	website: string | null;
	public_questions_remaining_today: number;
	anonymous_questions_remaining_today: number;
	pix_key: string | null;
	avatar_url: string;
	twitter: string;
	instagram: string;
	youtube: string;
	tiktok: string;
	linkedin: string;
	twitch: string;
	facebook: string;
	github: string;
	reset_password_token: string | null;
	reset_password_token_expires_at: string | null;
	api_key: string;
	privacy_is_private_profile: boolean;
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
	created_at: string | Date;
	updated_at: string | Date;
	deleted_at: string | null;
}

export interface LikeDislikeUser {
	name: string;
	nickname: string;
	email: string;
	avatar_url: string;
	liked_at?: string;
	disliked_at?: string;
}

export interface ReportUser {
	name: string;
	nickname: string;
	email: string;
	avatar_url: string;
	reported_at: string;
}

export interface QuestionInterface {
	id: string;
	question_text: string;
	answer_text: string;
	answered_at: string | Date;
	amount_paid: number;
	amount_already_withdraw: boolean;
	asker_want_answer_to_be_private: boolean;
	asker_sent_anonymous_question: boolean;
	amount_paid_is_private: boolean;
	owner_user_id: string;
	asked_by_user_id: string;
	question_is_awaiting_answer: boolean;
	question_answered: boolean;
	question_answer_was_recused: boolean;
	question_answer_was_expired: boolean;
	question_deleted_at: string | null;
	liked_by_users: string;
	desliked_by_users: string;
	owner_reported_offensive_question: boolean;
	owner_reported_inadequate_question: boolean;
	created_at: string | Date;
	updated_at: string | Date;
	deleted_at: string | null;
	owner: User;
	asked_by: User;
}

export interface FeedClientProps {
	allLatestDescPublicQuestionsAnswered: QuestionInterface[];
}
