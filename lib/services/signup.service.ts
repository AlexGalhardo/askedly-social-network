import { createUser, getUserByEmail, getUserByNickname } from "@/lib/repositories/users.repository";
import { type AuthErrorKey, type SignupField, signupSchema } from "@/lib/schemas/signup";

/** In the service the messages are `auth.errors` keys; the action translates and returns `SignupResult<string>`. */
export type SignupResult<Message extends string = AuthErrorKey> =
	| { ok: true }
	| { ok: false; fieldErrors: Partial<Record<SignupField, Message>>; error?: Message };

/** Password signup. `input` comes from the browser: the client validation is only a convenience, this is the one that counts. */
export interface SignupCaptcha {
	captchaToken: string | undefined;
	/** In production, `isCaptchaValid` (lib/captcha.ts). Injectable to test without network. */
	verifyCaptcha: (token: string | undefined) => Promise<boolean>;
}

export async function signUp(input: unknown, captcha?: SignupCaptcha): Promise<SignupResult> {
	// Captcha before any query: a bot does not even get to test which nicknames/emails exist.
	if (captcha && !(await captcha.verifyCaptcha(captcha.captchaToken))) {
		return { ok: false, fieldErrors: {}, error: "captchaRequired" };
	}

	const parsed = signupSchema.safeParse(input);
	if (!parsed.success) {
		const fieldErrors: Partial<Record<SignupField, AuthErrorKey>> = {};
		for (const issue of parsed.error.issues) {
			const field = issue.path[0] as SignupField;
			fieldErrors[field] ??= issue.message as AuthErrorKey;
		}
		return { ok: false, fieldErrors };
	}

	const { name, nickname, email, password } = parsed.data;

	if (await getUserByNickname(nickname)) {
		return { ok: false, fieldErrors: { nickname: "nicknameTaken" } };
	}
	if (await getUserByEmail(email)) {
		return { ok: false, fieldErrors: { email: "emailTaken" } };
	}

	await createUser(name, nickname, email, password);
	return { ok: true };
}
