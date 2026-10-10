import { z } from "./zod";

type ContactValidationKey = "nameMin" | "nameMax" | "emailInvalid" | "emailRequired" | "subjectInvalid" | "messageMin";

/** `t` is the translator of the `legal.contact.validation` namespace. */
export function createContactSchema(t: (key: ContactValidationKey) => string) {
	return z.object({
		name: z.string().min(4, t("nameMin")).max(24, t("nameMax")).trim(),
		email: z.string().email(t("emailInvalid")).min(1, t("emailRequired")),
		// Values sent in the contact email: only the labels shown in the form are translated.
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
