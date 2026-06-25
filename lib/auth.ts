import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
	verifyCredentials,
	createUser,
	getUserByEmail,
	reactiveDeletedAccount,
	updateLastLoginAt,
} from "./repositories/users.repository";
import slugify from "slugify";
import { QuestionInterface } from "./interfaces";
import { isQuestionExpired } from "./utils/question-utils";
import TelegramLog from "./telegram-logger";

interface ExtendedUser {
	id: string;
	avatar_url?: string | null;
	name?: string | null;
	nickname?: string | null;
	email?: string | null;
	description?: string | null;
	website?: string | null;
	public_questions_remaining_today?: number;
	anonymous_questions_remaining_today?: number;
	pix_key?: string | null;
	twitter?: string | null;
	instagram?: string | null;
	youtube?: string | null;
	tiktok?: string | null;
	linkedin?: string | null;
	twitch?: string | null;
	facebook?: string | null;
	github?: any;
	api_key?: string;
	privacy_is_private_profile?: boolean;
	privacy_accept_anonymous_questions?: boolean;
	privacy_show_anonymous_questions_public?: boolean;
	privacy_show_questions_answered_only_to_followers?: boolean;
	privacy_show_value_received_from_answering_question?: boolean;
	privacy_show_date_questions_was_answered?: boolean;
	privacy_show_total_followers_public?: boolean;
	privacy_show_total_questions_sent_public?: boolean;
	privacy_show_likes_each_answer_public?: boolean;
	privacy_show_dislikes_each_answer_public?: boolean;
	privacy_show_total_likes_all_answers_public?: boolean;
	privacy_show_total_questions_received_public?: boolean;
	privacy_show_total_questions_answered_public?: boolean;
	questions_received?: QuestionInterface[];
	questions_sent?: QuestionInterface[];
	followers: any[];
	following: any[];
	blocked_users: any[];
	blocked_by_users: any[];
	created_at?: Date | null;
	updated_at?: Date | null;
	deleted_at?: Date | null;
}

declare module "next-auth" {
	interface Session {
		user: ExtendedUser;
	}

	interface JWT extends Omit<ExtendedUser, "questions_received" | "questions_sent" | "followers" | "following"> {
		following?: string[];
		followers?: string[];
	}
}

const processExpiredQuestions = (questions: any[]): any[] => {
	return questions.map((question) => {
		if (
			question.question_is_awaiting_answer &&
			!question.question_answered &&
			!question.question_answer_was_expired &&
			isQuestionExpired(question.created_at)
		) {
			return {
				...question,
				question_answer_was_expired: true,
				question_is_awaiting_answer: false,
				question_answer_expired_at: new Date(),
			};
		}
		return question;
	});
};

const mapUserToSession = (dbUser: any): Partial<ExtendedUser> => ({
	id: dbUser?.id,
	avatar_url: dbUser?.avatar_url,
	name: dbUser?.name,
	nickname: dbUser?.nickname,
	email: dbUser?.email,
	description: dbUser?.description,
	website: dbUser?.website,
	public_questions_remaining_today: dbUser?.public_questions_remaining_today,
	anonymous_questions_remaining_today: dbUser?.anonymous_questions_remaining_today,
	pix_key: dbUser?.pix_key,
	twitter: dbUser?.twitter,
	instagram: dbUser?.instagram,
	youtube: dbUser?.youtube,
	tiktok: dbUser?.tiktok,
	linkedin: dbUser?.linkedin,
	twitch: dbUser?.twitch,
	facebook: dbUser?.facebook,
	github: dbUser?.github,
	api_key: dbUser?.api_key,
	privacy_is_private_profile: dbUser?.privacy_is_private_profile,
	privacy_accept_anonymous_questions: dbUser?.privacy_accept_anonymous_questions,
	privacy_show_anonymous_questions_public: dbUser?.privacy_show_anonymous_questions_public,
	privacy_show_questions_answered_only_to_followers: dbUser?.privacy_show_questions_answered_only_to_followers,
	privacy_show_value_received_from_answering_question: dbUser?.privacy_show_value_received_from_answering_question,
	privacy_show_date_questions_was_answered: dbUser?.privacy_show_date_questions_was_answered,
	privacy_show_total_followers_public: dbUser?.privacy_show_total_followers_public,
	privacy_show_total_questions_sent_public: dbUser?.privacy_show_total_questions_sent_public,
	privacy_show_likes_each_answer_public: dbUser?.privacy_show_likes_each_answer_public,
	privacy_show_dislikes_each_answer_public: dbUser?.privacy_show_dislikes_each_answer_public,
	privacy_show_total_likes_all_answers_public: dbUser?.privacy_show_total_likes_all_answers_public,
	privacy_show_total_questions_received_public: dbUser?.privacy_show_total_questions_received_public,
	privacy_show_total_questions_answered_public: dbUser?.privacy_show_total_questions_answered_public,
	created_at: dbUser?.created_at,
	updated_at: dbUser?.updated_at,
	deleted_at: dbUser?.deleted_at,
});

const generateUniqueNickname = (name: string, email: string): string => {
	const emailPrefix = slugify(email.split("@")[0], { lower: true, strict: true }).replace(/-/g, "");
	return `${emailPrefix}`;
};

const handleDeletedAccount = async (user: any): Promise<void> => {
	if (user?.deleted_at) {
		await reactiveDeletedAccount(user.id);
	}
};

export const authOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		}),
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
				captchaToken: { label: "Captcha Token", type: "text" },
			},
			async authorize(credentials: Record<"email" | "password" | "captchaToken", string> | undefined) {
				if (!credentials?.email || !credentials?.password) return null;

				if (process.env.NODE_ENV === "production") {
					if (!credentials?.captchaToken) return null;

					const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
					const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

					try {
						const res = await fetch(verifyUrl, {
							method: "POST",
							headers: { "Content-Type": "application/x-www-form-urlencoded" },
							body: new URLSearchParams({
								secret: turnstileSecret ?? "",
								response: credentials.captchaToken,
							}),
						});

						const data = await res.json();

						if (!data.success) return null;
					} catch (error: any) {
						await TelegramLog.error(
							`Erro na autenticação auth.ts providers authorize cloudflare captcha: ${error?.message}`,
						);
					}
				}

				try {
					const user = await verifyCredentials(credentials.email, credentials.password);

					if (!user?.id) return null;

					await handleDeletedAccount(user);

					await updateLastLoginAt(user.nickname);

					return {
						id: user.id,
						name: user.name ?? null,
						email: user.email ?? null,
					};
				} catch (error: any) {
					if (error instanceof Error && error.message === "no_password") {
						throw new Error(
							"This user does not have a registered password. Entre com sua conta Google e crie sua senha",
						);
					}
					await TelegramLog.error(`Erro na autenticação auth.ts providers authorize: ${error?.message}`);
					return null;
				}
			},
		}),
	],
	pages: {
		signIn: "/entrar",
		signOut: "/entrar",
		error: "/entrar",
	},
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60,
	},
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async session({ session, token }) {
			if (!token.email) {
				return session;
			}

			try {
				const dbUser = await getUserByEmail(token.email);

				if (!dbUser) return session;

				await handleDeletedAccount(dbUser);

				await updateLastLoginAt(dbUser.nickname);

				Object.assign(session.user, mapUserToSession(dbUser));

				session.user.questions_received = processExpiredQuestions(
					dbUser.questions_received?.map((q: any) => ({
						...q,
						owner: q.owner ?? null,
					})) ?? [],
				);

				session.user.questions_sent = processExpiredQuestions(
					dbUser.questions_sent?.map((q: any) => ({
						...q,
						asked_by: q.asked_by ?? null,
					})) ?? [],
				);

				session.user.followers = dbUser.followers ?? [];
				session.user.following = dbUser.following ?? [];
				session.user.blocked_users = dbUser.blocked_users ?? [];
				session.user.blocked_by_users = dbUser.blocked_by_users ?? [];
			} catch (error: any) {
				await TelegramLog.error(`Erro na autenticação auth.ts callbacks session: ${error?.message}`);
			}

			return session;
		},

		async jwt({ token, user, account, profile }) {
			if (user) {
				token.id = user.id;
			}

			if (account?.provider === "google" && token.email) {
				try {
					let dbUser = await getUserByEmail(token.email);

					if (!dbUser) {
						const nickname = generateUniqueNickname(token.name as string, token.email);
						const avatarUrl = (profile as any)?.picture;

						await createUser(token.name as string, nickname, token.email, undefined, avatarUrl);
						dbUser = await getUserByEmail(token.email);
					}

					await handleDeletedAccount(dbUser);

					Object.assign(token, mapUserToSession(dbUser));

					token.followers =
						dbUser && dbUser.followers ? dbUser.followers.map((f: any) => f.follower?.nickname) : [];
					token.following =
						dbUser && dbUser.following ? dbUser.following.map((f: any) => f.following?.nickname) : [];

					if (!token.avatar_url && (profile as any)?.picture) {
						token.avatar_url = (profile as any).picture;
					}
				} catch (error: any) {
					await TelegramLog.error(`Erro na autenticação auth.ts callbacks jwt: ${error?.message}`);
					throw new Error(`Erro na autenticação ${error?.message}`);
				}
			}

			return token;
		},
	},
	events: {
		async signIn({ user, account, profile }) {
			console.log(`User signed in: ${user.email} via ${account?.provider}`);
		},
		async signOut({ token }) {
			console.log(`User signed out: ${token?.email}`);
		},
	},
	debug: process.env.NODE_ENV === "development",
};
