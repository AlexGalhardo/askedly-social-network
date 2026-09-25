import bcrypt from "bcryptjs";
import { updateUserPassword } from "@/lib/repositories/users.repository";
import { prisma } from "@/prisma/prisma-client";

export class PasswordChangeError extends Error {}

/**
 * Troca a senha exigindo a senha atual, para que uma sessão roubada não baste para tomar a conta.
 * Contas criadas pelo Google não têm senha: nelas esta é a definição da primeira senha.
 */
export async function changePassword(userId: string, currentPassword: string | undefined, newPassword: string) {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
	if (!user) throw new PasswordChangeError("Usuário não encontrado");

	if (user.password) {
		if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
			throw new PasswordChangeError("Senha atual incorreta");
		}
	}

	await updateUserPassword(userId, newPassword);
}
