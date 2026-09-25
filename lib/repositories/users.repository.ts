import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/prisma/prisma-client";
import TelegramLog from "../telegram-logger";

class UsersRepository {
	private static readonly API_KEY_PREFIX = "api_key_dinherin_";
	private static readonly API_KEY_PERGUNTAE_PREFIX = "api_key_perguntae_";

	private generateApiKey(prefix = UsersRepository.API_KEY_PREFIX) {
		return prefix + uuidv4().replace(/-/g, "");
	}

	private async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 12);
	}

	private readonly userIncludeRelations = {
		followers: { include: { follower: true } },
		following: { include: { following: true } },
		questions_received: { include: { asked_by: true, owner: true } },
		questions_sent: { include: { owner: true, asked_by: true } },
		blocked_by_users: { include: { blocked: { select: { nickname: true } } } },
		blocked_users: { include: { blocked: { select: { nickname: true } } } },
		follow_requests_sent: true,
		follow_requests_received: true,
	};

	async getAllUsers() {
		return prisma.user.findMany({ include: this.userIncludeRelations });
	}

	async getUserById(id: string) {
		return prisma.user.findUnique({ where: { id } });
	}

	async getUserByNickname(nickname: string) {
		return prisma.user.findUnique({ where: { nickname }, include: this.userIncludeRelations });
	}

	async getUserByEmail(email: string) {
		return prisma.user.findUnique({
			where: { email },
			include: {
				...this.userIncludeRelations,
			},
		});
	}

	async getUserByApiKey(apiKey: string) {
		return prisma.user.findUnique({ where: { api_key: apiKey } });
	}

	async createUser(name: string, nickname: string, email: string, password?: string, avatarUrl?: string) {
		const id = uuidv4();
		const api_key = this.generateApiKey(UsersRepository.API_KEY_PERGUNTAE_PREFIX);
		const hashedPassword = password ? await this.hashPassword(password) : null;

		await TelegramLog.info(`Novo usuário registrado: 
			Name: ${name}
			Nickname: ${nickname}
			Email: ${email}
		`);

		return prisma.user.create({
			data: {
				id,
				name,
				nickname,
				email,
				password: hashedPassword,
				avatar_url: avatarUrl ?? null,
				api_key,
			},
		});
	}

	async verifyCredentials(email: string, password: string) {
		const user = await this.getUserByEmail(email);
		if (!user) return null;
		if (!user.password) throw new Error("no_password");
		const isValid = await bcrypt.compare(password, user.password);
		return isValid ? user : null;
	}

	async updateUserProfile(userId: string, name: string, email: string) {
		await prisma.user.update({
			where: { id: userId },
			data: { name, email, updated_at: new Date() },
		});
		return { success: true };
	}

	async updateUserPassword(userId: string, newPassword: string) {
		const hashedPassword = await this.hashPassword(newPassword);
		await prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword, updated_at: new Date() },
		});
		return { success: true };
	}

	async createPassword(userEmail: string, newPassword: string) {
		const hashedPassword = await this.hashPassword(newPassword);
		const api_key = this.generateApiKey();
		await prisma.user.update({
			where: { email: userEmail },
			data: { api_key, password: hashedPassword, updated_at: new Date() },
		});
		return { success: true };
	}

	async regenerateApiKey(userId: string) {
		const apiKey = this.generateApiKey();
		await prisma.user.update({
			where: { id: userId },
			data: { api_key: apiKey, updated_at: new Date() },
		});
		return { success: true, apiKey };
	}

	async reactiveDeletedAccount(userId: string) {
		try {
			await prisma.user.update({
				where: { id: userId },
				data: { deleted_at: null, updated_at: new Date() },
			});
			return { success: true };
		} catch (error: any) {
			TelegramLog.error(`Catch Error users.repository.ts reactiveDeletedAccount: ${error?.message}`);
			return { success: false };
		}
	}
}

const repo = new UsersRepository();

export async function getAllUsers() {
	return repo.getAllUsers();
}

export async function reactiveDeletedAccount(userId: string) {
	return repo.reactiveDeletedAccount(userId);
}

export async function updateLastLoginAt(userNickname: string) {
	return prisma.user.update({
		where: { nickname: userNickname },
		data: { last_login_at: new Date() },
	});
}

export async function getUserById(id: string) {
	return repo.getUserById(id);
}

export async function getUserByNickname(nickname: string) {
	return repo.getUserByNickname(nickname);
}

export async function getUserByEmail(email: string) {
	return repo.getUserByEmail(email);
}

export async function getUserByApiKey(apiKey: string) {
	return repo.getUserByApiKey(apiKey);
}

export async function createUser(name: string, nickname: string, email: string, password?: string, avatarUrl?: string) {
	return repo.createUser(name, nickname, email, password, avatarUrl);
}

export async function verifyCredentials(email: string, password: string) {
	return repo.verifyCredentials(email, password);
}

export async function updateUserProfile(userId: string, name: string, email: string) {
	return repo.updateUserProfile(userId, name, email);
}

export async function updateUserPassword(userId: string, newPassword: string) {
	return repo.updateUserPassword(userId, newPassword);
}

export async function createPassword(userEmail: string, newPassword: string) {
	return repo.createPassword(userEmail, newPassword);
}

export async function regenerateApiKey(userId: string) {
	return repo.regenerateApiKey(userId);
}
