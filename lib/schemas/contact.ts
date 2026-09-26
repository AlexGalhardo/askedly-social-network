import { z } from "./zod";

export const contactSchema = z.object({
	name: z
		.string()
		.min(4, "Nome deve ter pelo menos 4 caracteres")
		.max(24, "Nome deve ter no máximo 24 caracteres")
		.trim(),
	email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
	subject: z.enum(
		["Problemas Técnicos", "Problemas Com Pagamentos", "Problemas com Conta", "Sugestões e Feedbacks", "Outros"],
		{ error: "Assunto inválido" },
	),
	message: z.string().min(32, "Mensagem deve ter pelo menos 32 caracteres").trim(),
});
