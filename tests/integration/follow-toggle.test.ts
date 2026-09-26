import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { toggleFollow } from "@/lib/services/follow-toggle.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const nicknames = { fan: `tfan${run}`, open: `topen${run}`, closed: `tclosed${run}` };
const ids: Record<keyof typeof nicknames, string> = { fan: "", open: "", closed: "" };

describe("toggleFollow (integration)", () => {
	beforeAll(async () => {
		for (const [key, nickname] of Object.entries(nicknames) as [keyof typeof nicknames, string][]) {
			const user = await prisma.user.create({
				data: {
					name: nickname,
					nickname,
					email: `${nickname}@example.com`,
					api_key: `k-${nickname}`,
					privacy_is_private_profile: key === "closed",
				},
			});
			ids[key] = user.id;
		}
	});

	afterAll(async () => {
		await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
	});

	test("follows a public profile and unfollows on the second call", async () => {
		expect(await toggleFollow(ids.fan, ids.open)).toMatchObject({ isFollowing: true, hasPendingRequest: false });
		expect(await toggleFollow(ids.fan, ids.open)).toMatchObject({ isFollowing: false, hasPendingRequest: false });
	});

	test("sends (and cancels) a request to a private profile instead of following", async () => {
		expect(await toggleFollow(ids.fan, ids.closed)).toMatchObject({ isFollowing: false, hasPendingRequest: true });
		expect(await prisma.follower.count({ where: { followerId: ids.fan, followingId: ids.closed } })).toBe(0);
		expect(await toggleFollow(ids.fan, ids.closed)).toMatchObject({ hasPendingRequest: false });
	});

	test("refuses to follow yourself or someone who does not exist", async () => {
		expect(await toggleFollow(ids.fan, ids.fan)).toBeNull();
		expect(await toggleFollow(ids.fan, "00000000-0000-0000-0000-000000000000")).toBeNull();
	});
});
