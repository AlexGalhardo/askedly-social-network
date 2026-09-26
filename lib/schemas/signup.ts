import { z } from "./zod";

export const signupSchema = z.object({
	name: z.string().min(4, "Nome deve ter pelo menos 4 letras").max(32, "Nome deve ter no máximo 32 caracters"),
	nickname: z
		.string()
		.min(4, "Nickname deve ter pelo menos 4 letras")
		.max(16, "Nickname deve ter no máximo 16 letras")
		.regex(/^[a-z0-9_]+$/, "Nickname só pode ter letras minúsculas, números e _"),
	email: z.string().email("Email deve ser válido"),
	password: z
		.string()
		.min(8, "Senha deve ter pelo menos 8 caracteres")
		.regex(/(?=.*[a-z])/, "Senha deve conter pelo menos 1 letra minúscula")
		.regex(/(?=.*[A-Z])/, "Senha deve conter pelo menos 1 letra maiúscula")
		.regex(/(?=.*\d)/, "Senha deve conter pelo menos 1 número")
		.regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, "Senha deve conter pelo menos 1 caractere especial"),
	acceptTerms: z
		.boolean()
		.refine((val) => val === true, "Você deve aceitar os termos de uso e política de privacidade"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SignupField = keyof SignupInput;
