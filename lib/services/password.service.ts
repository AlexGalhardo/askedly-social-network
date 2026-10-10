import bcrypt from "bcryptjs";
import { updateUserPassword } from "@/lib/repositories/users.repository";
import { prisma } from "@/prisma/prisma-client";

/** Message key of the `account.errors` namespace; whoever catches the error translates. */
export type PasswordChangeErrorKey = "userNotFound" | "currentPasswordIncorrect";

export class PasswordChangeError extends Error {
	declare message: PasswordChangeErrorKey;

	constructor(key: PasswordChangeErrorKey) {
		super(key);
	}
}

/**
 * Changes the password requiring the current password, so that a stolen session is not enough to take over the account.
 * Accounts created through Google have no password: for them this sets the first password.
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
