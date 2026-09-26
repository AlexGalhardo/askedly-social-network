import { describe, expect, test } from "bun:test";
import { toPublicProfile } from "./profile.service";

const secrets = {
	password: "hash",
	email: "x@example.com",
	pix_key: "pix",
	api_key: "key",
	reset_password_token: "reset",
	confirm_email_token: "confirm",
};

const question = (id: string, overrides: Record<string, unknown> = {}) => ({
	id,
	question_text: `texto-${id}`,
	answer_text: `resposta-${id}`,
	amount_paid: 500,
	amount_paid_is_private: false,
	question_answered: true,
	asker_want_answer_to_be_private: false,
	asker_sent_anonymous_question: false,
	liked_by_users: '["fan"]',
	asked_by_user_nickname: "open_asker",
	asked_by: { nickname: "open_asker", ...secrets },
	owner: { nickname: "owner", ...secrets },
	...overrides,
});

const profile = {
	id: "owner-id",
	nickname: "owner",
	name: "Owner",
	...secrets,
	privacy_show_total_questions_received_public: true,
	privacy_show_total_questions_answered_public: true,
	privacy_show_total_likes_all_answers_public: true,
	privacy_show_total_questions_sent_public: true,
	privacy_show_total_followers_public: true,
	followers: [{ followerId: "f1", follower: { id: "f1", nickname: "fan", ...secrets } }],
	following: [{ followingId: "g1", following: { id: "g1", nickname: "idol", ...secrets } }],
	blocked_users: [{ blocked: { nickname: "blocked_by_owner" } }],
	blocked_by_users: [{ blocked: { nickname: "someone" } }],
	follow_requests_received: [{ senderId: "x" }],
	follow_requests_sent: [{ receiverId: "y" }],
	questions_received: [
		question("anon", {
			asker_sent_anonymous_question: true,
			asked_by_user_nickname: "secret_asker",
			asked_by: { nickname: "secret_asker" },
		}),
		question("public"),
		question("private", { asker_want_answer_to_be_private: true }),
		question("pending", { question_answered: false, answer_text: null, liked_by_users: null }),
	],
	questions_sent: [question("s-anon", { asker_sent_anonymous_question: true }), question("s-open")],
};

const visitor = { viewerId: null, isFollowing: false };
const follower = { viewerId: "f1", isFollowing: true };
const self = { viewerId: "owner-id", isFollowing: false };
const texts = (p: { questions_received: Record<string, unknown>[] }): unknown[] =>
	p.questions_received.map((q) => q.question_text).filter(Boolean);

describe("toPublicProfile", () => {
	test("never exposes credentials or contact data, at any depth", () => {
		for (const viewer of [visitor, follower, self]) {
			const serialized = JSON.stringify(toPublicProfile(profile, viewer));
			for (const key of Object.keys(secrets)) expect(serialized).not.toContain(`"${key}"`);
		}
		expect(JSON.stringify(toPublicProfile(profile, self))).toContain('"nickname":"fan"');
	});

	test("never reveals who asked an anonymous question", () => {
		for (const viewer of [visitor, follower, self]) {
			expect(JSON.stringify(toPublicProfile(profile, viewer))).not.toContain("secret_asker");
		}
	});

	test("a visitor who does not follow gets counts, not content", () => {
		const p = toPublicProfile(profile, visitor);
		expect(texts(p)).toEqual([]);
		expect(p.questions_received).toHaveLength(4);
		expect(p.questions_received.filter((q) => q.question_answered)).toHaveLength(3);
		expect(JSON.stringify(p.questions_received)).not.toContain("open_asker");
	});

	test("a follower sees only answered, non-private answers", () => {
		expect(texts(toPublicProfile(profile, follower)).sort()).toEqual(["texto-anon", "texto-public"]);
	});

	test("the owner sees everything received", () => {
		expect(texts(toPublicProfile(profile, self))).toHaveLength(4);
	});

	test("sent questions: content only for the owner, anonymous ones hidden from others", () => {
		const sent = toPublicProfile(profile, visitor).questions_sent;
		expect(sent.map((q) => q.id)).toEqual(["s-open"]);
		expect(JSON.stringify(sent)).not.toContain("texto");
		expect(toPublicProfile(profile, self).questions_sent.map((q) => q.id)).toEqual(["s-anon", "s-open"]);
	});

	test("blocks and follow requests stay private", () => {
		for (const viewer of [visitor, follower]) {
			const p = toPublicProfile(profile, viewer);
			expect(p.blocked_users).toEqual([]);
			expect(p.blocked_by_users).toEqual([]);
			expect(p.follow_requests_received).toEqual([]);
			expect(p.follow_requests_sent).toEqual([]);
		}
		expect(toPublicProfile(profile, self).blocked_users).toHaveLength(1);
	});

	test("hidden counts are not leaked through list lengths", () => {
		const closed = {
			...profile,
			privacy_show_total_questions_received_public: false,
			privacy_show_total_questions_answered_public: false,
			privacy_show_total_likes_all_answers_public: false,
			privacy_show_total_questions_sent_public: false,
			privacy_show_total_followers_public: false,
		};
		const p = toPublicProfile(closed, visitor);
		expect(p.questions_received).toEqual([]);
		expect(p.questions_sent).toEqual([]);
		expect(p.followers).toEqual([]);
		expect(p.following).toEqual([]);
	});
});
