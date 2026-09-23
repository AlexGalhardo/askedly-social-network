import { describe, expect, test } from "bun:test";
import type { SentQuestionInterface } from "@/types/SentQuestion";
import {
	calculateFinancialData,
	filterSentQuestionsByStatus,
	getSentQuestionStatus,
	isSentQuestionExpired,
	paginateSentQuestions,
} from "./sent-question-utils";

function makeSentQuestion(overrides: Partial<SentQuestionInterface> = {}): SentQuestionInterface {
	return {
		id: "q1",
		is_seed: false,
		question_text: "Qual sua cor favorita?",
		answer_text: null,
		answered_at: null,
		amount_paid: 1000,
		amount_already_withdraw: false,
		asker_want_answer_to_be_private: false,
		asker_sent_anonymous_question: false,
		amount_paid_is_private: false,
		onwer_wants_amount_paid_not_show_public: false,
		owner_user_nickname: "owner",
		asked_by_user_nickname: "asker",
		question_is_awaiting_answer: true,
		question_answered: false,
		question_answer_was_recused: false,
		question_answer_was_expired: false,
		question_answer_recused_at: null,
		question_answer_expired_at: null,
		liked_by_users: [],
		desliked_by_users: [],
		owner_reported_offensive_question: false,
		onwer_reported_inadequate_question: false,
		onwer_reported_question_at: null,
		asker_reported_answer: false,
		asker_reported_answer_reason: null,
		asker_reported_answer_at: null,
		payment_withdraw_id: null,
		created_at: new Date(),
		updated_at: null,
		deleted_at: null,
		webhook_id: "wh1",
		owner: {
			id: "owner-id",
			name: "Owner",
			nickname: "owner",
			email: "owner@example.com",
			avatar_url: null,
			description: null,
			website: null,
			twitter: null,
			instagram: null,
			youtube: null,
			tiktok: null,
			linkedin: null,
			twitch: null,
			facebook: null,
			github: null,
			created_at: new Date().toISOString(),
		},
		asked_by: null,
		...overrides,
	};
}

describe("isSentQuestionExpired", () => {
	test("is false right after creation and true after 7 days", () => {
		expect(isSentQuestionExpired(new Date())).toBe(false);
		expect(isSentQuestionExpired(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000))).toBe(true);
	});
});

describe("getSentQuestionStatus", () => {
	test("answered has top priority", () => {
		expect(getSentQuestionStatus(makeSentQuestion({ question_answered: true }))).toBe("answered");
	});

	test("declined when recused and not answered", () => {
		expect(getSentQuestionStatus(makeSentQuestion({ question_answer_was_recused: true }))).toBe("declined");
	});

	test("expired when older than 7 days", () => {
		const question = makeSentQuestion({ created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) });
		expect(getSentQuestionStatus(question)).toBe("expired");
	});

	test("pending for a fresh, untouched question", () => {
		expect(getSentQuestionStatus(makeSentQuestion())).toBe("pending");
	});
});

describe("filterSentQuestionsByStatus", () => {
	test("filters and sorts by created_at descending", () => {
		const older = makeSentQuestion({ id: "old", question_answered: true, created_at: new Date("2024-01-01") });
		const newer = makeSentQuestion({ id: "new", question_answered: true, created_at: new Date("2024-06-01") });
		const result = filterSentQuestionsByStatus([older, newer], "answered");
		expect(result.map((q) => q.id)).toEqual(["new", "old"]);
	});
});

describe("paginateSentQuestions", () => {
	const questions = Array.from({ length: 15 }, (_, i) => makeSentQuestion({ id: `q${i}` }));

	test("slices the requested page and reports metadata", () => {
		const page = paginateSentQuestions(questions, 1, 10);
		expect(page.questions).toHaveLength(10);
		expect(page.totalPages).toBe(2);
		expect(page.hasNextPage).toBe(true);
		expect(page.hasPrevPage).toBe(false);
	});
});

describe("calculateFinancialData", () => {
	test("buckets totals by status", () => {
		const answered = makeSentQuestion({ id: "a", amount_paid: 1000, question_answered: true });
		const declined = makeSentQuestion({ id: "d", amount_paid: 500, question_answer_was_recused: true });
		const expired = makeSentQuestion({
			id: "e",
			amount_paid: 300,
			created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
		});

		const totals = calculateFinancialData([answered, declined, expired]);

		expect(totals.totalPaid).toBe(1000);
		expect(totals.totalDeclined).toBe(500);
		expect(totals.totalExpired).toBe(300);
	});
});
