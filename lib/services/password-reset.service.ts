import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { type AuthErrorKey, signupSchema } from "@/lib/schemas/signup";
import { prisma } from "@/prisma/prisma-client";

const TOKEN_TTL_MS = 60 * 60 * 1000;

// Only the hash goes to the database: whoever reads the database cannot use a still-valid token.
function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

/** Generates the token (32 hex, 128 bits) for the email link. Null if the email has no account. */
export async function createPasswordResetToken(email: string): Promise<{ token: string; name: string } | null> {
	const token = randomBytes(16).toString("hex");
	const { count } = await prisma.user.updateMany({
		where: { email },
		data: {
			reset_password_token: hashToken(token),
			reset_password_token_expires_at: new Date(Date.now() + TOKEN_TTL_MS),
		},
	});
	if (count === 0) return null;
	const user = await prisma.user.findUniqueOrThrow({ where: { email }, select: { name: true } });
	return { token, name: user.name };
}

export async function isResetTokenValid(token: string): Promise<boolean> {
	const user = await prisma.user.findFirst({
		where: { reset_password_token: hashToken(token), reset_password_token_expires_at: { gt: new Date() } },
		select: { id: true },
	});
	return !!user;
}

export type ResetResult = { ok: true } | { ok: false; error: AuthErrorKey };

/** Changes the password and invalidates the token in the same statement: two simultaneous submissions do not use the token twice. */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<ResetResult> {
	const parsed = signupSchema.shape.password.safeParse(newPassword);
	if (!parsed.success) {
		return { ok: false, error: (parsed.error.issues[0]?.message as AuthErrorKey | undefined) ?? "passwordInvalid" };
	}

	const { count } = await prisma.user.updateMany({
		where: { reset_password_token: hashToken(token), reset_password_token_expires_at: { gt: new Date() } },
		data: {
			password: await bcrypt.hash(parsed.data, 12),
			reset_password_token: null,
			reset_password_token_expires_at: null,
			session_version: { increment: 1 },
			updated_at: new Date(),
		},
	});
	return count === 1 ? { ok: true } : { ok: false, error: "invalidOrExpiredToken" };
}
