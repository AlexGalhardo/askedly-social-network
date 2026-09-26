import { describe, expect, test } from "bun:test";
import { toPublicQuestion } from "./question-privacy";

const base = {
	id: "q1",
	question_text: "texto",
	amount_paid: 1500,
	amount_paid_is_private: false,
	asker_sent_anonymous_question: false,
	asked_by_user_nickname: "asker",
	asked_by: { nickname: "asker" },
	owner: { nickname: "owner", privacy_show_value_received_from_answering_question: true },
	webhook_id: "wh_123",
	payment_withdraw_id: "pw_456",
	amount_already_withdraw: true,
	asker_reported_answer_reason: "offensive",
	onwer_reported_question_at: new Date(),
};

describe("toPublicQuestion", () => {
	test("drops internal payment and moderation fields", () => {
		const serialized = JSON.stringify(toPublicQuestion(base));
		for (const key of [
			"webhook_id",
			"payment_withdraw_id",
			"amount_already_withdraw",
			"asker_reported_answer_reason",
			"onwer_reported_question_at",
		]) {
			expect(serialized).not.toContain(key);
		}
	});

	test("keeps the amount only when the owner made it public", () => {
		expect(toPublicQuestion(base).amount_paid).toBe(1500);
		expect(toPublicQuestion({ ...base, amount_paid_is_private: true }).amount_paid).toBeNull();
		const hiddenByOwner = {
			...base,
			owner: { nickname: "owner", privacy_show_value_received_from_answering_question: false },
		};
		expect(toPublicQuestion(hiddenByOwner).amount_paid).toBeNull();
	});

	test("hides the asker of anonymous questions", () => {
		const anonymous = toPublicQuestion({ ...base, asker_sent_anonymous_question: true });
		expect(anonymous.asked_by).toBeNull();
		expect(anonymous.asked_by_user_nickname).toBe("");
	});
});
