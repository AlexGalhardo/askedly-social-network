"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { publicErrorMessage } from "@/lib/errors";
import { getUserByNickname } from "@/lib/repositories/users.repository";
import { changePassword, PasswordChangeError } from "@/lib/services/password.service";
import { toPublicProfile } from "@/lib/services/profile.service";
import { consumeRateLimit, RATE_LIMITS, rateLimitMessage } from "@/lib/services/rate-limit.service";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

const personalInfoSchema = z.object({
	name: z
		.string()
		.min(4, "O nome deve ter pelo menos 4 caracteres")
		.max(24, "O nome deve ter no máximo 24 caracteres"),
	website: z
		.string()
		.optional()
		.refine((val) => !val || val.startsWith("https://"), {
			message: "O website deve começar com https://",
		}),
	description: z
		.string()
		.optional()
		.refine((val) => !val || (val.length >= 32 && val.length <= 256), {
			message: "A descrição deve ter entre 32 e 256 caracteres",
		}),
});

const socialMediaSchema = z.object({
	instagram: z.string().optional(),
	facebook: z.string().optional(),
	youtube: z.string().optional(),
	twitter: z.string().optional(),
	tiktok: z.string().optional(),
	linkedin: z.string().optional(),
	twitch: z.string().optional(),
	github: z.string().optional(),
});

const pixSchema = z.object({
	pixKey: z
		.string()
		.min(11, "A chave PIX deve ter pelo menos 11 caracteres")
		.max(128, "A chave PIX deve ter no máximo 128 caracteres"),
});

const passwordSchema = z
	.object({
		newPassword: z
			.string()
			.min(8, "A senha deve ter pelo menos 8 caracteres")
			.regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
			.regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
			.regex(/[0-9]/, "A senha deve conter pelo menos um número")
			.regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

export async function updatePersonalInfo(data: FormData) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		const formData = {
			name: data.get("name") as string,
			website: (data.get("website") as string) || undefined,
			description: (data.get("description") as string) || undefined,
		};

		const validatedData = personalInfoSchema.parse(formData);

		const updatedUser = await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				name: validatedData.name.trim(),
				website: validatedData.website ?? null,
				description: validatedData.description ?? null,
				updated_at: new Date(),
			},
		});

		updateTag(`user-${session.user.id}`);
		revalidatePath("/minha-conta");

		return {
			success: true,
			user: {
				id: updatedUser.id,
				name: updatedUser.name,
				website: updatedUser.website,
				description: updatedUser.description,
			},
		};
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts update personal info: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro interno do servidor") };
	}
}

export async function updateSocialMedia(data: FormData) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		const formData = {
			instagram: (data.get("instagram") as string) || undefined,
			facebook: (data.get("facebook") as string) || undefined,
			youtube: (data.get("youtube") as string) || undefined,
			twitter: (data.get("twitter") as string) || undefined,
			tiktok: (data.get("tiktok") as string) || undefined,
			linkedin: (data.get("linkedin") as string) || undefined,
			twitch: (data.get("twitch") as string) || undefined,
			github: (data.get("github") as string) || undefined,
		};

		const validatedData = socialMediaSchema.parse(formData);

		await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				instagram: validatedData.instagram ?? null,
				facebook: validatedData.facebook ?? null,
				youtube: validatedData.youtube ?? null,
				twitter: validatedData.twitter ?? null,
				tiktok: validatedData.tiktok ?? null,
				linkedin: validatedData.linkedin ?? null,
				twitch: validatedData.twitch ?? null,
				github: validatedData.github ?? null,
				updated_at: new Date(),
			},
		});

		updateTag(`user-${session.user.id}`);
		revalidatePath("/minha-conta");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts update social media: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro interno do servidor") };
	}
}

export async function updatePixKey(data: FormData) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		const pixKey = data.get("pixKey") as string;
		const validatedData = pixSchema.parse({ pixKey });

		await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				pix_key: validatedData.pixKey,
				updated_at: new Date(),
			},
		});

		updateTag(`user-${session.user.id}`);
		revalidatePath("/minha-conta");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts update pix key: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro interno do servidor") };
	}
}

export async function updatePassword(data: FormData) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		const formData = {
			newPassword: data.get("newPassword") as string,
			confirmPassword: data.get("confirmPassword") as string,
		};

		const validatedData = passwordSchema.parse(formData);
		const currentPassword = (data.get("currentPassword") as string | null) || undefined;

		const limit = await consumeRateLimit(`password-change:user:${session.user.id}`, RATE_LIMITS.passwordChange);
		if (!limit.allowed) return { error: rateLimitMessage(limit.retryAfterSeconds) };

		await changePassword(session.user.id, currentPassword, validatedData.newPassword);

		return { success: true };
	} catch (error: any) {
		if (error instanceof PasswordChangeError) return { error: error.message };
		await TelegramLog.error(`Catch Error file user-actions.ts update password: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro interno do servidor") };
	}
}

export async function updatePrivacySettings(data: FormData) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		const privacyData = {
			isPrivateProfile: data.get("isPrivateProfile") === "true",
			acceptAnonymousQuestions: data.get("acceptAnonymousQuestions") === "true",
			showQuestionsAnonymousAnsweredPublic: data.get("showQuestionsAnonymousAnsweredPublic") === "true",
			showTotalQuestionsReceived: data.get("showTotalQuestionsReceived") === "true",
			showTotalQuestionsAnswered: data.get("showTotalQuestionsAnswered") === "true",
			showTotalQuestionSent: data.get("showTotalQuestionSent") === "true",
			showAnsweredToFollowersOnly: data.get("showAnsweredToFollowersOnly") === "true",
			showPaymentAmountEachQuestion: data.get("showPaymentAmountEachQuestion") === "true",
			showAnswerDate: data.get("showAnswerDate") === "true",
			showFollowersCount: data.get("showFollowersCount") === "true",
			showIndividualLikes: data.get("showIndividualLikes") === "true",
			showIndividualDislikes: data.get("showIndividualDislikes") === "true",
			showTotalLikes: data.get("showTotalLikes") === "true",
		};

		await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				privacy_is_private_profile: privacyData.isPrivateProfile,
				privacy_accept_anonymous_questions: privacyData.acceptAnonymousQuestions,
				privacy_show_anonymous_questions_public: privacyData.showQuestionsAnonymousAnsweredPublic,
				privacy_show_total_questions_received_public: privacyData.showTotalQuestionsReceived,
				privacy_show_total_questions_answered_public: privacyData.showTotalQuestionsAnswered,
				privacy_show_total_questions_sent_public: privacyData.showTotalQuestionSent,
				privacy_show_questions_answered_only_to_followers: privacyData.showAnsweredToFollowersOnly,
				privacy_show_value_received_from_answering_question: privacyData.showPaymentAmountEachQuestion,
				privacy_show_date_questions_was_answered: privacyData.showAnswerDate,
				privacy_show_total_followers_public: privacyData.showFollowersCount,
				privacy_show_likes_each_answer_public: privacyData.showIndividualLikes,
				privacy_show_dislikes_each_answer_public: privacyData.showIndividualDislikes,
				privacy_show_total_likes_all_answers_public: privacyData.showTotalLikes,
				updated_at: new Date(),
			},
		});

		updateTag(`user-${session.user.id}`);
		revalidatePath("/minha-conta");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts update privacy settings: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro interno do servidor") };
	}
}

export async function deleteAccount() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return { error: "Não autorizado" };

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				id: true,
				name: true,
				nickname: true,
				email: true,
				created_at: true,
			},
		});

		if (!user) {
			return { error: "Usuário não encontrado" };
		}

		await prisma.deletedAccount.create({
			data: {
				user_id_was: user.id,
				name: user.name,
				nickname: user.nickname,
				email: user.email,
				account_was_created_at: user.created_at,
			},
		});

		await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				deleted_at: new Date(),
				updated_at: new Date(),
			},
		});

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts delete account: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro interno do servidor") };
	}
}

export const getUserByNicknameAction = async (nickname: string) => {
	try {
		const session = await getServerSession(authOptions);

		const user = await getUserByNickname(nickname);

		if (!user) {
			return null;
		}

		let isFollowing = false;
		let hasPendingRequest = false;

		if (session?.user?.id) {
			isFollowing = user.followers.some((follower) => follower.followerId === session.user.id);

			hasPendingRequest =
				user.follow_requests_received?.some((request) => request.senderId === session.user.id) || false;
		}

		return {
			...toPublicProfile(user, session?.user?.id ?? null),
			isFollowing,
			hasPendingRequest,
		};
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts get user by nickname: ${error?.message}`);
		return null;
	}
};

export const followUserAction = async (followingId: string, followerId: string) => {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return { error: "Não autorizado" };

		const existingFollow = await prisma.follower.findUnique({
			where: {
				followerId_followingId: {
					followerId: followerId,
					followingId: followingId,
				},
			},
		});

		const followRequest = await prisma.followRequest.findUnique({
			where: {
				senderId_receiverId: {
					senderId: followerId,
					receiverId: followingId,
				},
			},
		});

		const targetUser = await prisma.user.findUnique({
			where: { id: followingId },
			select: { privacy_is_private_profile: true },
		});

		let isFollowing = false;
		let hasPendingRequest = false;
		let message = "";

		if (existingFollow) {
			await prisma.follower.delete({
				where: {
					followerId_followingId: {
						followerId: followerId,
						followingId: followingId,
					},
				},
			});

			isFollowing = false;
			hasPendingRequest = false;
			message = "Você parou de seguir este usuário";
		} else {
			if (targetUser?.privacy_is_private_profile) {
				if (followRequest) {
					await prisma.followRequest.delete({
						where: {
							senderId_receiverId: {
								senderId: followerId,
								receiverId: followingId,
							},
						},
					});
					hasPendingRequest = false;
					message = "Solicitação cancelada";
				} else {
					await prisma.followRequest.create({
						data: {
							senderId: followerId,
							receiverId: followingId,
						},
					});
					hasPendingRequest = true;
					message = "Solicitação enviada";
				}
				isFollowing = false;
			} else {
				await prisma.follower.create({
					data: {
						followerId: followerId,
						followingId: followingId,
					},
				});

				if (followRequest) {
					await prisma.followRequest.delete({
						where: {
							senderId_receiverId: {
								senderId: followerId,
								receiverId: followingId,
							},
						},
					});
				}

				isFollowing = true;
				hasPendingRequest = false;
				message = "Agora você está seguindo este usuário";
			}
		}

		updateTag("user-profile");

		return {
			success: true,
			isFollowing,
			hasPendingRequest,
			message,
		};
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts follow user: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro ao seguir usuário") };
	}
};

export const likeQuestionAction = async (questionId: string, nickname: string) => {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		const question = await prisma.question.findUnique({
			where: { id: questionId },
			select: { liked_by_users: true, desliked_by_users: true },
		});

		if (!question) {
			return { error: "Pergunta não encontrada" };
		}

		let likedUsers: string[] = [];
		let dislikedUsers: string[] = [];

		try {
			likedUsers = question.liked_by_users ? JSON.parse(question.liked_by_users) : [];
			dislikedUsers = question.desliked_by_users ? JSON.parse(question.desliked_by_users) : [];
		} catch {
			likedUsers = [];
			dislikedUsers = [];
		}

		const userNickname = session.user.nickname || nickname;
		const hasLiked = likedUsers.includes(userNickname);
		const hasDisliked = dislikedUsers.includes(userNickname);

		if (hasDisliked) {
			dislikedUsers = dislikedUsers.filter((nick) => nick !== userNickname);
		}

		if (hasLiked) {
			likedUsers = likedUsers.filter((nick) => nick !== userNickname);
		} else {
			likedUsers.push(userNickname);
		}

		await prisma.question.update({
			where: { id: questionId },
			data: {
				liked_by_users: JSON.stringify(likedUsers),
				desliked_by_users: JSON.stringify(dislikedUsers),
				updated_at: new Date(),
			},
		});

		updateTag("user-profile");
		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts like question: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro ao curtir pergunta") };
	}
};

export const dislikeQuestionAction = async (questionId: string, nickname: string) => {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		const question = await prisma.question.findUnique({
			where: { id: questionId },
			select: { liked_by_users: true, desliked_by_users: true },
		});

		if (!question) {
			return { error: "Pergunta não encontrada" };
		}

		let likedUsers: string[] = [];
		let dislikedUsers: string[] = [];

		try {
			likedUsers = question.liked_by_users ? JSON.parse(question.liked_by_users) : [];
			dislikedUsers = question.desliked_by_users ? JSON.parse(question.desliked_by_users) : [];
		} catch {
			likedUsers = [];
			dislikedUsers = [];
		}

		const userNickname = session.user.nickname || nickname;
		const hasLiked = likedUsers.includes(userNickname);
		const hasDisliked = dislikedUsers.includes(userNickname);

		if (hasLiked) {
			likedUsers = likedUsers.filter((nick) => nick !== userNickname);
		}

		if (hasDisliked) {
			dislikedUsers = dislikedUsers.filter((nick) => nick !== userNickname);
		} else {
			dislikedUsers.push(userNickname);
		}

		await prisma.question.update({
			where: { id: questionId },
			data: {
				liked_by_users: JSON.stringify(likedUsers),
				desliked_by_users: JSON.stringify(dislikedUsers),
				updated_at: new Date(),
			},
		});

		updateTag("user-profile");
		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts dislike question: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro ao descurtir pergunta") };
	}
};

export const blockUserAction = async (blockedUserId: string) => {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		const existingBlock = await prisma.userBlock.findUnique({
			where: {
				blocker_id_blocked_id: {
					blocker_id: session.user.id,
					blocked_id: blockedUserId,
				},
			},
		});

		if (existingBlock) {
			return { error: "Usuário já está bloqueado" };
		}

		await prisma.userBlock.create({
			data: {
				blocker_id: session.user.id,
				blocked_id: blockedUserId,
			},
		});

		await prisma.follower.deleteMany({
			where: {
				OR: [
					{ followerId: session.user.id, followingId: blockedUserId },
					{ followerId: blockedUserId, followingId: session.user.id },
				],
			},
		});

		updateTag("user-profile");
		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts block user: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro ao bloquear usuário") };
	}
};

export const unblockUserAction = async (blockedUserId: string) => {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return { error: "Não autorizado" };
		}

		await prisma.userBlock.delete({
			where: {
				blocker_id_blocked_id: {
					blocker_id: session.user.id,
					blocked_id: blockedUserId,
				},
			},
		});

		updateTag("user-profile");
		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts unblock user: ${error?.message}`);
		return { error: publicErrorMessage(error, "Erro ao desbloquear usuário") };
	}
};
