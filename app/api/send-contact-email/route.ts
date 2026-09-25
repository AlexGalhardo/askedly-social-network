import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ContactEmail } from "@/emails/contact-email";
import { contactSchema } from "@/lib/schemas/contact";
import TelegramLog from "@/lib/telegram-logger";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	try {
		const body = await request.json();

		console.log("body do contato -> ", body);

		const validationResult = contactSchema.safeParse({
			name: body.name,
			email: body.email,
			subject: body.subject,
			message: body.message,
		});

		console.log("validationResult.success -> ", validationResult.success);

		if (!validationResult.success) {
			const errors = validationResult.error.issues.map((error) => ({
				field: error.path[0],
				message: error.message,
			}));

			return NextResponse.json(
				{
					error: "Dados inválidos",
					details: errors,
				},
				{ status: 400 },
			);
		}

		if (process.env.NODE_ENV === "production") {
			const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET;
			const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

			try {
				const res = await fetch(verifyUrl, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({
						secret: turnstileSecret ?? "",
						response: body?.captchaToken,
					}),
				});

				const data = await res.json();

				if (!data.success) {
					console.warn("Captcha inválido: ", data);
					return NextResponse.json({ error: "Captcha inválido" }, { status: 500 });
				}
			} catch (err) {
				await TelegramLog.error(`Error sending email via Resend: ${JSON.stringify(err)}`);
				return NextResponse.json({ error: "Erro na verificação do CAPTCHA" }, { status: 500 });
			}
		}

		const { name, email, subject, message } = validationResult.data;

		const { data, error } = await resend.emails.send({
			from: "onboarding@resend.dev",
			to: ["aleexgvieira@gmail.com"],
			subject: `Respondeae.com.br - ${email} - ${subject}`,
			react: ContactEmail({ name, email, subject, message }),
		});

		if (error) {
			await TelegramLog.error(`Error sending email via Resend: ${JSON.stringify(error)}`);
			return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
		}

		await TelegramLog.info(
			`Contact Message: \n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
		);

		return NextResponse.json({ success: true, data });
	} catch (error: any) {
		await TelegramLog.error(`Error in contact API: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
