import type { Messages } from "@/messages/en";
import { z } from "./zod";

/** Message key of the `auth.errors` namespace. */
export type AuthErrorKey = keyof Messages["auth"]["errors"];

// The public profile lives at `/<nickname>`: a nickname equal to a route (current or old, which redirects) would be
// unreachable. Routes with a hyphen are not included: the nickname does not accept hyphens.
const RESERVED_NICKNAMES = new Set([
	"admin",
	"login",
	"signup",
	"about",
	"contact",
	"payments",
	"followers",
	"following",
	"offline",
	"feed",
	"entrar",
	"sobre",
	"contato",
	"pagamentos",
	"seguidores",
	"seguindo",
	"teste",
]);

export const createSignupSchema = (t: (key: AuthErrorKey) => string) =>
	z.object({
		name: z.string().min(4, t("nameMin")).max(32, t("nameMax")),
		nickname: z
			.string()
			.min(4, t("nicknameMin"))
			.max(16, t("nicknameMax"))
			.regex(/^[a-z0-9_]+$/, t("nicknameChars"))
			.refine((value) => !RESERVED_NICKNAMES.has(value), t("nicknameTaken")),
		email: z.string().email(t("emailInvalid")),
		password: z
			.string()
			.min(8, t("passwordMin"))
			.regex(/(?=.*[a-z])/, t("passwordLowercase"))
			.regex(/(?=.*[A-Z])/, t("passwordUppercase"))
			.regex(/(?=.*\d)/, t("passwordNumber"))
			.regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, t("passwordSpecial")),
		acceptTerms: z.boolean().refine((val) => val === true, t("acceptTerms")),
	});

// For the services, which do not translate: each issue's message is the `auth.errors` key itself.
export const signupSchema = createSignupSchema((key) => key);

export type SignupInput = z.infer<typeof signupSchema>;
export type SignupField = keyof SignupInput;
