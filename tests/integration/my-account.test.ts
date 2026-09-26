import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	countPendingQuestions,
	getMyBlockedUsers,
	getMyFollowers,
	getMyFollowing,
	getMyReceivedQuestions,
	getMySentQuestions,
	getMySocialGraph,
} from "@/lib/services/my-account.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const nick = { me: `mme${run}`, fan: `mfan${run}`, idol: `midol${run}`, enemy: `menemy${run}`, pest: `mpest${run}` };
const id: Record<keyof typeof nick, string> = { me: "", fan: "", idol: "", enemy: "", pest: "" };
const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

async function question(owner: string, asker: string, extra: Record<string, unknown> = {}): Promise<void> {
	const webhook = await prisma.webhookAbacatePay.create({
		data: {
			pix_id: `mpix-${run}-${Math.random()}`,
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
			question_text: `q-${Math.random()}`,
			amount_paid: 500,
			owner_user_nickname: owner,
			asked_by_user_nickname: asker,
			webhook_id: webhook.id,
			...extra,
		},
	});
}

describe("my-account.service (integration)", () => {
	beforeAll(async () => {
		for (const [key, nickname] of Object.entries(nick) as [keyof typeof nick, string][]) {
			const user = await prisma.user.create({
				data: { name: nickname, nickname, email: `${nickname}@example.com`, api_key: `k-${nickname}` },
			});
			id[key] = user.id;
		}
		await prisma.follower.create({ data: { followerId: id.fan, followingId: id.me } });
		await prisma.follower.create({ data: { followerId: id.me, followingId: id.idol } });
		await prisma.userBlock.create({ data: { blocker_id: id.me, blocked_id: id.pest } });
		await prisma.userBlock.create({ data: { blocker_id: id.enemy, blocked_id: id.me } });

		await question(nick.me, nick.fan); // pendente
		await question(nick.me, nick.fan, { asker_sent_anonymous_question: true }); // pendente, anônima
		await question(nick.me, nick.fan, { created_at: eightDaysAgo }); // venceu o prazo
		await question(nick.me, nick.fan, { question_answered: true, question_is_awaiting_answer: false });
		await question(nick.idol, nick.me);
	});

	afterAll(async () => {
		await prisma.question.deleteMany({ where: { owner_user_nickname: { in: Object.values(nick) } } });
		await prisma.webhookAbacatePay.deleteMany({ where: { pix_id: { startsWith: `mpix-${run}-` } } });
		await prisma.user.deleteMany({ where: { id: { in: Object.values(id) } } });
	});

	test("counts only questions still waiting inside the answer window", async () => {
		expect(await countPendingQuestions(nick.me)).toBe(2);
	});

	test("received questions hide anonymous askers and mark the overdue one as expired", async () => {
		const received = await getMyReceivedQuestions(nick.me);
		expect(received).toHaveLength(4);
		expect(received.filter((q) => q.asked_by === null)).toHaveLength(1);
		expect(received.filter((q) => q.question_answer_was_expired)).toHaveLength(1);
	});

	test("sent questions are the ones I asked", async () => {
		expect((await getMySentQuestions(nick.me)).map((q) => q.owner_user_nickname)).toEqual([nick.idol]);
	});

	test("followers and following carry only public user fields", async () => {
		const followers = await getMyFollowers(id.me);
		const following = await getMyFollowing(id.me);
		expect(followers.map((f) => f.follower.nickname)).toEqual([nick.fan]);
		expect(following.map((f) => f.following.nickname)).toEqual([nick.idol]);
		expect(JSON.stringify([followers, following])).not.toContain("@example.com");
	});

	test("the social graph names who blocked me, not myself", async () => {
		const graph = await getMySocialGraph(id.me);
		expect(graph.followingNicknames).toEqual([nick.idol]);
		expect(graph.blockedNicknames).toEqual([nick.pest]);
		expect(graph.blockedByNicknames).toEqual([nick.enemy]);
		expect(graph.blockedByUserIds).toEqual([id.enemy]);
	});

	test("blocked users come with what the card shows", async () => {
		const blocked = await getMyBlockedUsers(id.me);
		expect(blocked.map((b) => b.blocked.nickname)).toEqual([nick.pest]);
		expect(JSON.stringify(blocked)).not.toContain("@example.com");
	});
});
