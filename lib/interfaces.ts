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

export interface ProfileQuestionInterface {
	id: string;
	question_text: string;
	answer_text: string;
	answered_at: string | Date;
	amount_paid: number;
	currency?: string;
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
	/** null when the question is anonymous and the viewer is not the author. */
	asked_by: User | null;
}

export interface FeedClientProps {
	allLatestDescPublicQuestionsAnswered: QuestionInterface[];
}

export interface FollowerUserInterface {
	id: string;
	followerId: string;
	followingId: string;
	created_at: string;
	updated_at: string;
	follower: {
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
	};
}

export interface FollowRequestInterface {
	id: string;
	senderId: string;
	receiverId: string;
	created_at: string;
	updated_at: string;
	sender: {
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
	};
}

export interface FollowingUserInterface {
	id: string;
	followerId: string;
	followingId: string;
	created_at: string;
	updated_at: string;
	following: {
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
	};
}

export interface PaymentData {
	paymentToWithdraw: number;
	paymentAwaitingAnswer: number;
	paymentSentAnsweredQuestions?: number;
	paymentWithdrawHistory: WithdrawHistory[];
	questionsToPayAmount: any[];
}

export interface WithdrawHistory {
	id: string;
	amount_withdraw: number;
	created_at: Date | string;
	send_to_pix_key: string;
}

export interface WithdrawParams {
	userId: string;
	nickname: string;
	amount: number;
	sentToPixKey: string;
	questions: any[];
}

export type PaymentTab = "answered" | "sent";

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

export interface SentQuestionInterface {
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
	liked_by_users: string[];
	desliked_by_users: string[];
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
	};
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
	total_likes?: number;
	total_dislikes?: number;
}

export type SentQuestionStatus = "pending" | "answered" | "declined" | "expired";

export interface ReportAnswerParams {
	questionId: string;
	reason: "offensive" | "inappropriate";
}

export interface WithdrawUnansweredParams {
	userId: string;
}
