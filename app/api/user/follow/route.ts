import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("account");
	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: te("unauthorized") }, { status: 401 });

		const body = await request.json();
		const { followingId } = body;
		const followerId = user.id;

		if (!followingId) {
			return NextResponse.json({ error: t("errors.followIdsRequired") }, { status: 400 });
		}

		const [followerUser, followingUser] = await Promise.all([
			prisma.user.findUnique({ where: { id: followerId } }),
			prisma.user.findUnique({ where: { id: followingId } }),
		]);

		if (!followerUser || !followingUser) {
			return NextResponse.json({ error: t("errors.userNotFound") }, { status: 404 });
		}

		if (followerId === followingId) {
			return NextResponse.json({ error: t("errors.cannotFollowSelf") }, { status: 400 });
		}

		const existingFollow = await prisma.follower.findUnique({
			where: {
				followerId_followingId: {
					followerId,
					followingId,
				},
			},
		});

		const existingRequest = await prisma.followRequest.findUnique({
			where: {
				senderId_receiverId: {
					senderId: followerId,
					receiverId: followingId,
				},
			},
		});

		let isFollowing = !!existingFollow;
		let hasPendingRequest = !!existingRequest;
		let message: string;

		if (existingFollow) {
			await prisma.follower.delete({
				where: {
					id: existingFollow.id,
				},
			});
			isFollowing = false;
			message = t("follow.stoppedFollowing");
		} else if (existingRequest) {
			await prisma.followRequest.delete({
				where: {
					id: existingRequest.id,
				},
			});
			hasPendingRequest = false;
			message = t("follow.requestCancelled");
		} else {
			if (followingUser.privacy_is_private_profile) {
				await prisma.followRequest.create({
					data: {
						senderId: followerId,
						receiverId: followingId,
					},
				});
				hasPendingRequest = true;
				message = t("follow.requestSent");
			} else {
				await prisma.follower.create({
					data: {
						followerId,
						followingId,
					},
				});
				isFollowing = true;
				message = t("follow.nowFollowing");
			}
		}

		return NextResponse.json(
			{
				message,
				isFollowing,
				hasPendingRequest,
				followerId,
				followingId,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error user-follow.ts: ${error?.message}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
