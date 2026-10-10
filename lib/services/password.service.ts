import bcrypt from "bcryptjs";
import { updateUserPassword } from "@/lib/repositories/users.repository";
import { prisma } from "@/prisma/prisma-client";

/** Chave de mensagem do namespace `account.errors`; quem captura o erro traduz. */
export type PasswordChangeErrorKey = "userNotFound" | "currentPasswordIncorrect";

export class PasswordChangeError extends Error {
	declare message: PasswordChangeErrorKey;

	constructor(key: PasswordChangeErrorKey) {
		super(key);
	}
}

/**
 * Troca a senha exigindo a senha atual, para que uma sessão roubada não baste para tomar a conta.
 * Contas criadas pelo Google não têm senha: nelas esta é a definição da primeira senha.
 */
export async function changePassword(userId: string, currentPassword: string | undefined, newPassword: string) {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
	if (!user) throw new PasswordChangeError("userNotFound");

	if (user.password) {
		if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
			throw new PasswordChangeError("currentPasswordIncorrect");
		}
	}

	await updateUserPassword(userId, newPassword);
}
