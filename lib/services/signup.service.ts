import { createUser, getUserByEmail, getUserByNickname } from "@/lib/repositories/users.repository";
import { type SignupField, signupSchema } from "@/lib/schemas/signup";

export type SignupResult =
	| { ok: true }
	| { ok: false; fieldErrors: Partial<Record<SignupField, string>>; error?: string };

/** Cadastro com senha. `input` vem do browser: a validação do client é só conveniência, a que vale é esta. */
export async function signUp(input: unknown): Promise<SignupResult> {
	const parsed = signupSchema.safeParse(input);
	if (!parsed.success) {
		const fieldErrors: Partial<Record<SignupField, string>> = {};
		for (const issue of parsed.error.issues) {
			const field = issue.path[0] as SignupField;
			fieldErrors[field] ??= issue.message;
		}
		return { ok: false, fieldErrors };
	}

	const { name, nickname, email, password } = parsed.data;

	if (await getUserByNickname(nickname)) {
		return { ok: false, fieldErrors: { nickname: `Esse @${nickname} está indisponível` } };
	}
	if (await getUserByEmail(email)) {
		return { ok: false, fieldErrors: { email: "Esse Email está indisponível" } };
	}

	await createUser(name, nickname, email, password);
	return { ok: true };
}
