import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ContactEmail } from "@/emails/contact-email";
import { isCaptchaValid } from "@/lib/captcha";
import { clientIp } from "@/lib/request-ip";
import { contactSchema } from "@/lib/schemas/contact";
import { consumeRateLimit, RATE_LIMITS, rateLimitMessage } from "@/lib/services/rate-limit.service";
import TelegramLog from "@/lib/telegram-logger";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	try {
		const limit = await consumeRateLimit(`contact:ip:${clientIp(request.headers)}`, RATE_LIMITS.contact);
		if (!limit.allowed) {
			return NextResponse.json({ error: rateLimitMessage(limit.retryAfterSeconds) }, { status: 429 });
		}

		const body = await request.json();

		const validationResult = contactSchema.safeParse({
			name: body.name,
			email: body.email,
			subject: body.subject,
			message: body.message,
		});

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

		if (process.env.NODE_ENV === "production" && !(await isCaptchaValid(body?.captchaToken))) {
			return NextResponse.json({ error: "Captcha inválido" }, { status: 400 });
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
