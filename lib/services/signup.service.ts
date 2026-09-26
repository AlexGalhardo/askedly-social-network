import { createUser, getUserByEmail, getUserByNickname } from "@/lib/repositories/users.repository";
import { type SignupField, signupSchema } from "@/lib/schemas/signup";

export type SignupResult =
	| { ok: true }
	| { ok: false; fieldErrors: Partial<Record<SignupField, string>>; error?: string };

/** Cadastro com senha. `input` vem do browser: a validação do client é só conveniência, a que vale é esta. */
export interface SignupCaptcha {
	captchaToken: string | undefined;
	/** Em produção, `isCaptchaValid` (lib/captcha.ts). Injetável para testar sem rede. */
	verifyCaptcha: (token: string | undefined) => Promise<boolean>;
}

export async function signUp(input: unknown, captcha?: SignupCaptcha): Promise<SignupResult> {
	// Captcha antes de qualquer consulta: robô nem chega a testar quais nicknames/emails existem.
	if (captcha && !(await captcha.verifyCaptcha(captcha.captchaToken))) {
		return { ok: false, fieldErrors: {}, error: "Por favor, verifique o CAPTCHA." };
	}

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
