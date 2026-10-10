import type { Messages } from "@/messages/en";
import { z } from "./zod";

/** Chave de mensagem do namespace `auth.errors`. */
export type AuthErrorKey = keyof Messages["auth"]["errors"];

// O perfil público mora em `/<nickname>`: um nickname igual a uma rota (atual ou antiga, que redireciona) ficaria
// inacessível. Rotas com hífen não entram: o nickname não aceita hífen.
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

// Para os services, que não traduzem: a mensagem de cada issue é a própria chave de `auth.errors`.
export const signupSchema = createSignupSchema((key) => key);

export type SignupInput = z.infer<typeof signupSchema>;
export type SignupField = keyof SignupInput;
