import { describe, expect, test } from "bun:test";
import type { QuestionInterface } from "@/types/QuestionInterface";
import {
	filterQuestionsByStatus,
	getDeleteTimer,
	getQuestionStatus,
	isQuestionExpired,
	paginateQuestions,
} from "./question-utils";

function makeQuestion(overrides: Partial<QuestionInterface> = {}): QuestionInterface {
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
		liked_by_users: null,
		desliked_by_users: null,
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
		owner: null,
		asked_by: null,
		...overrides,
	};
}

describe("isQuestionExpired", () => {
	test("is false right after creation", () => {
		expect(isQuestionExpired(new Date())).toBe(false);
	});

	test("is true after 7 days", () => {
		const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
		expect(isQuestionExpired(eightDaysAgo)).toBe(true);
	});
});

describe("getQuestionStatus", () => {
	test("answered takes priority over everything else", () => {
		const question = makeQuestion({
			question_answered: true,
			question_is_awaiting_answer: false,
			answer_text: "42",
			answered_at: new Date(),
		});
		expect(getQuestionStatus(question)).toBe("answered");
	});

	test("reported takes priority over declined/expired", () => {
		const question = makeQuestion({ owner_reported_offensive_question: true });
		expect(getQuestionStatus(question)).toBe("reported");
	});

	test("declined when explicitly recused", () => {
		const question = makeQuestion({ question_answer_was_recused: true });
		expect(getQuestionStatus(question)).toBe("declined");
	});

	test("expired when older than 7 days and untouched otherwise", () => {
		const question = makeQuestion({ created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) });
		expect(getQuestionStatus(question)).toBe("expired");
	});

	test("pending for a fresh, untouched question", () => {
		expect(getQuestionStatus(makeQuestion())).toBe("pending");
	});
});

describe("filterQuestionsByStatus", () => {
	test("returns an empty array for non-array input", () => {
		expect(filterQuestionsByStatus(null as unknown as QuestionInterface[], "pending")).toEqual([]);
	});

	test("only keeps questions matching the requested status", () => {
		const pending = makeQuestion({ id: "p1" });
		const answered = makeQuestion({
			id: "a1",
			question_answered: true,
			question_is_awaiting_answer: false,
			answer_text: "ok",
			answered_at: new Date(),
		});
		const result = filterQuestionsByStatus([pending, answered], "answered");
		expect(result.map((q) => q.id)).toEqual(["a1"]);
	});
});

describe("paginateQuestions", () => {
	const questions = Array.from({ length: 25 }, (_, i) => makeQuestion({ id: `q${i}` }));

	test("slices the requested page", () => {
		const page = paginateQuestions(questions, 2, 10);
		expect(page.questions).toHaveLength(10);
		expect(page.questions[0].id).toBe("q10");
	});

	test("reports pagination metadata correctly", () => {
		const page = paginateQuestions(questions, 3, 10);
		expect(page.totalPages).toBe(3);
		expect(page.hasNextPage).toBe(false);
		expect(page.hasPreviousPage).toBe(true);
	});
});

describe("getDeleteTimer", () => {
	test("says ready to delete once 7 days have passed", () => {
		const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
		expect(getDeleteTimer(eightDaysAgo)).toBe("Pronto para deletar");
	});

	test("returns a countdown before 7 days have passed", () => {
		const justDeclined = new Date().toISOString();
		expect(getDeleteTimer(justDeclined)).toMatch(/^\d+d \d+h \d+m \d+s para pergunta ser deletada$/);
	});
});
