import { z } from "./zod";

type ContactValidationKey = "nameMin" | "nameMax" | "emailInvalid" | "emailRequired" | "subjectInvalid" | "messageMin";

/** `t` é o tradutor do namespace `legal.contact.validation`. */
export function createContactSchema(t: (key: ContactValidationKey) => string) {
	return z.object({
		name: z.string().min(4, t("nameMin")).max(24, t("nameMax")).trim(),
		email: z.string().email(t("emailInvalid")).min(1, t("emailRequired")),
		// Valores enviados no email de contato: só os rótulos exibidos no formulário são traduzidos.
		subject: z.enum(
			[
				"Problemas Técnicos",
				"Problemas Com Pagamentos",
				"Problemas com Conta",
				"Sugestões e Feedbacks",
				"Outros",
			],
			{ error: t("subjectInvalid") },
		),
		message: z.string().min(32, t("messageMin")).trim(),
	});
}
