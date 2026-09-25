import { faker } from "@faker-js/faker";
import { SeedHelpers } from "../helpers/seed-helpers.helper";
import { SeedQuestionInterface, SeedQuestionStateType, SeedUserInterface } from "../helpers/seed-interfaces.helper";
import { arrayQuestions } from "./seed-array-questions-anwers";

export class SeedQuestionFactory {
	private static selectedQuestion: { question: string; answer: string } | null = null;

	private static getRandomQuestionPair(): { question: string; answer: string } {
		return faker.helpers.arrayElement(arrayQuestions);
	}

	private static getQuestionText(): string {
		if (!this.selectedQuestion) {
			this.selectedQuestion = this.getRandomQuestionPair();
		}
		return this.selectedQuestion.question;
	}

	private static getAnswerText(): string {
		if (!this.selectedQuestion) {
			this.selectedQuestion = this.getRandomQuestionPair();
		}
		return this.selectedQuestion.answer;
	}

	private static generateUserInteractions(users: SeedUserInterface[]): {
		likedByUsers: string[];
		dislikedByUsers: string[];
	} {
		const shuffledUsers = faker.helpers.shuffle(users);
		const maxLikes = Math.min(
			shuffledUsers.length,
			faker.number.int({ min: 3, max: Number(process.env.SEED_TOTAL_RANDOM_USERS_TO_CREATED) - 1 }),
		);
		const maxDislikes = Math.min(shuffledUsers.length, faker.number.int({ min: 1, max: 49 }));

		const likedByUsers = shuffledUsers.slice(0, maxLikes).map((user) => user.nickname);

		const remainingUsers = shuffledUsers.slice(maxLikes);

		const dislikedByUsers = remainingUsers.slice(0, maxDislikes).map((user) => user.nickname);

		return { likedByUsers, dislikedByUsers };
	}

	static create(
		ownerUser: SeedUserInterface,
		askerUser: SeedUserInterface,
		webhookId: string,
		amount: number,
		state: SeedQuestionStateType,
		users: SeedUserInterface[],
	): Omit<SeedQuestionInterface, "id"> {
		this.selectedQuestion = null;

		const isAnswered = state === "answered";
		const isWaiting = state === "waiting";
		const isRefused = state === "refused";
		const isExpired = state === "expired";

		const { likedByUsers, dislikedByUsers } = this.generateUserInteractions(users);

		const createdAt = SeedHelpers.generateCreatedAt();
		const answeredAt = isAnswered ? SeedHelpers.generateAnsweredAtAfter(createdAt) : null;

		return {
			is_seed: true,
			question_text: this.getQuestionText(),
			answer_text: isAnswered ? this.getAnswerText() : null,
			answered_at: answeredAt,
			amount_paid: amount,
			asker_want_answer_to_be_private: faker.datatype.boolean({ probability: 0.2 }),
			asker_sent_anonymous_question: faker.datatype.boolean({ probability: 0.4 }),
			owner_user_nickname: ownerUser.nickname,
			asked_by_user_nickname: askerUser.nickname,
			question_is_awaiting_answer: isWaiting,
			question_answered: isAnswered,
			question_answer_was_recused: isRefused,
			question_answer_was_expired: isExpired,
			liked_by_users: JSON.stringify(likedByUsers),
			desliked_by_users: JSON.stringify(dislikedByUsers),
			webhook_id: webhookId,
			created_at: createdAt,
			deleted_at: isAnswered && SeedHelpers.shouldDelete() ? faker.date.recent() : null,
		};
	}
}
