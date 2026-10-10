import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { ContactEmail } from "@/emails/contact-email";
import { isCaptchaValid } from "@/lib/captcha";
import { EMAIL_FROM, resendClient } from "@/lib/email";
import { clientIp } from "@/lib/request-ip";
import { createContactSchema } from "@/lib/schemas/contact";
import { consumeRateLimit, RATE_LIMITS, rateLimitMinutes } from "@/lib/services/rate-limit.service";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: Request) {
	const t = await getTranslations("errors");

	try {
		const limit = await consumeRateLimit(`contact:ip:${clientIp(request.headers)}`, RATE_LIMITS.contact);
		if (!limit.allowed) {
			return NextResponse.json(
				{ error: t("rateLimited", { minutes: rateLimitMinutes(limit.retryAfterSeconds) }) },
				{ status: 429 },
			);
		}

		const body = await request.json();

		const contactSchema = createContactSchema(await getTranslations("legal.contact.validation"));
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
					error: t("invalidData"),
					details: errors,
				},
				{ status: 400 },
			);
		}

		if (process.env.NODE_ENV === "production" && !(await isCaptchaValid(body?.captchaToken))) {
			return NextResponse.json({ error: t("invalidCaptcha") }, { status: 400 });
		}

		const { name, email, subject, message } = validationResult.data;

		const { data, error } = await resendClient().emails.send({
			from: EMAIL_FROM,
			to: ["aleexgvieira@gmail.com"],
			subject: `Askedly - ${email} - ${subject}`,
			react: ContactEmail({ name, email, subject, message, t: await getTranslations("emails") }),
		});

		if (error) {
			await TelegramLog.error(`Error sending email via Resend: ${JSON.stringify(error)}`);
			return NextResponse.json({ error: t("emailSendFailed") }, { status: 500 });
		}

		await TelegramLog.info(
			`Contact Message: \n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
		);

		return NextResponse.json({ success: true, data });
	} catch (error: any) {
		await TelegramLog.error(`Error in contact API: ${error?.message}`);
		return NextResponse.json({ error: t("internal") }, { status: 500 });
	}
}
