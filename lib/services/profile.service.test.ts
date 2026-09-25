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

const profile = {
	id: "owner-id",
	nickname: "owner",
	name: "Owner",
	...secrets,
	followers: [{ followerId: "f1", follower: { id: "f1", nickname: "fan", ...secrets } }],
	questions_received: [
		{
			id: "q1",
			asker_sent_anonymous_question: true,
			asked_by_user_nickname: "secret_asker",
			asked_by: { nickname: "secret_asker", ...secrets },
			owner: { nickname: "owner", ...secrets },
		},
		{
			id: "q2",
			asker_sent_anonymous_question: false,
			asked_by_user_nickname: "open_asker",
			asked_by: { nickname: "open_asker", ...secrets },
			owner: { nickname: "owner", ...secrets },
		},
	],
	questions_sent: [
		{ id: "s1", asker_sent_anonymous_question: true, asked_by_user_nickname: "owner", asked_by: null },
		{ id: "s2", asker_sent_anonymous_question: false, asked_by_user_nickname: "owner", asked_by: null },
	],
};

describe("toPublicProfile", () => {
	test("never exposes credentials or contact data, at any depth", () => {
		const serialized = JSON.stringify(toPublicProfile(profile, null));
		for (const key of Object.keys(secrets)) expect(serialized).not.toContain(`"${key}"`);
		expect(serialized).toContain('"nickname":"fan"');
	});

	test("hides who asked an anonymous question", () => {
		const serialized = JSON.stringify(toPublicProfile(profile, null));
		expect(serialized).not.toContain("secret_asker");
		expect(serialized).toContain("open_asker");
	});

	test("shows the anonymous questions a user sent only to that user", () => {
		const sentIds = (viewerId: string | null): string[] =>
			toPublicProfile(profile, viewerId).questions_sent.map((q) => q.id);
		expect(sentIds(null)).toEqual(["s2"]);
		expect(sentIds("someone-else")).toEqual(["s2"]);
		expect(sentIds("owner-id")).toEqual(["s1", "s2"]);
	});
});
