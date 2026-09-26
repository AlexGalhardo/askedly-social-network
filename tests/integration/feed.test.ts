import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { getTopLikedAnswersAllTime } from "@/lib/repositories/questions.repository";
import { getFeedQuestions } from "@/lib/services/feed.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const owner = `fowner${run}`;
const privateOwner = `fprivate${run}`;
const asker = `fasker${run}`;
const follower = `ffollower${run}`;
const followersOnlyOwner = `fonly${run}`;
const nicknames = [owner, privateOwner, asker, follower, followersOnlyOwner];

async function createAnsweredQuestion(ownerNickname: string, text: string, anonymous = false): Promise<void> {
	const webhook = await prisma.webhookAbacatePay.create({
		data: {
			pix_id: `fpix-${run}-${Math.random()}`,
			status: "PAID",
			amount: 500,
			fee: 0,
			kind: "PIX",
			event_status: "billing.paid",
			dev_mode: true,
			complete_event: "{}",
		},
	});
	await prisma.question.create({
		data: {
			question_text: text,
			answer_text: "Resposta de teste",
			answered_at: new Date(),
			question_answered: true,
			question_is_awaiting_answer: false,
			amount_paid: 500,
			asker_sent_anonymous_question: anonymous,
			owner_user_nickname: ownerNickname,
			asked_by_user_nickname: asker,
			webhook_id: webhook.id,
		},
	});
}

const texts = (questions: { question_text: string }[]): string[] => questions.map((q) => q.question_text);

describe("getFeedQuestions (integration)", () => {
	beforeAll(async () => {
		for (const nickname of nicknames) {
			await prisma.user.create({
				data: {
					name: nickname,
					nickname,
					email: `${nickname}@example.com`,
					api_key: `k-${nickname}`,
					password: "hash-que-nunca-pode-vazar",
					pix_key: `pix-que-nunca-pode-vazar-${nickname}`,
					privacy_is_private_profile: nickname === privateOwner,
					privacy_show_questions_answered_only_to_followers: nickname === followersOnlyOwner,
				},
			});
		}
		const [followerUser, privateUser] = await Promise.all([
			prisma.user.findUniqueOrThrow({ where: { nickname: follower } }),
			prisma.user.findUniqueOrThrow({ where: { nickname: privateOwner } }),
		]);
		await prisma.follower.create({ data: { followerId: followerUser.id, followingId: privateUser.id } });

		await createAnsweredQuestion(owner, `public-${run}`);
		await createAnsweredQuestion(owner, `anonymous-${run}`, true);
		await createAnsweredQuestion(privateOwner, `private-${run}`);
		await createAnsweredQuestion(followersOnlyOwner, `followers-only-${run}`);
	});

	afterAll(async () => {
		await prisma.question.deleteMany({ where: { asked_by_user_nickname: asker } });
		await prisma.webhookAbacatePay.deleteMany({ where: { pix_id: { startsWith: `fpix-${run}-` } } });
		await prisma.user.deleteMany({ where: { nickname: { in: nicknames } } });
	});

	test("never sends private user data to the browser", async () => {
		const serialized = JSON.stringify(await getFeedQuestions("community", null));
		expect(serialized).not.toContain("hash-que-nunca-pode-vazar");
		expect(serialized).not.toContain("pix-que-nunca-pode-vazar");
		expect(serialized).not.toContain(`${asker}@example.com`);
		expect(serialized).not.toContain(`k-${owner}`);
		expect(serialized).not.toContain("webhook_id");
		expect(serialized).not.toContain("payment_withdraw_id");
	});

	test("hides who asked an anonymous question", async () => {
		const questions = await getFeedQuestions("community", null);
		const anonymous = questions.find((q) => q.question_text === `anonymous-${run}`);
		expect(anonymous?.asked_by).toBeNull();
		expect(JSON.stringify(anonymous)).not.toContain(asker);
	});

	test("shows a private profile's answers only to its followers", async () => {
		expect(texts(await getFeedQuestions("community", null))).not.toContain(`private-${run}`);
		expect(texts(await getFeedQuestions("community", asker))).not.toContain(`private-${run}`);
		expect(texts(await getFeedQuestions("community", follower))).toContain(`private-${run}`);
		expect(texts(await getFeedQuestions("community", privateOwner))).toContain(`private-${run}`);
	});

	test("the following feed needs a signed-in viewer", async () => {
		expect(await getFeedQuestions("following", null)).toEqual([]);
		expect(texts(await getFeedQuestions("following", follower))).toEqual([`private-${run}`]);
	});

	test("answers restricted to followers stay out of the community feed for others", async () => {
		expect(texts(await getFeedQuestions("community", asker))).not.toContain(`followers-only-${run}`);
		expect(texts(await getFeedQuestions("community", followersOnlyOwner))).toContain(`followers-only-${run}`);
	});

	test("the public top-liked ranking never lists restricted profiles", async () => {
		await prisma.question.updateMany({
			where: { question_text: { in: [`private-${run}`, `followers-only-${run}`, `public-${run}`] } },
			data: { liked_by_users: JSON.stringify(Array.from({ length: 999 }, (_, i) => `fan${i}`)) },
		});
		const ranking = texts(await getTopLikedAnswersAllTime());
		expect(ranking).not.toContain(`private-${run}`);
		expect(ranking).not.toContain(`followers-only-${run}`);
	});
});
