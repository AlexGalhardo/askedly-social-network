import type { getTranslations } from "next-intl/server";
import { Resend } from "resend";

/** Translator for the `emails` namespace, resolved by the sender: `await getTranslations("emails")`. */
export type EmailTranslator = Awaited<ReturnType<typeof getTranslations<"emails">>>;

// `onboarding@resend.dev` is Resend's test sender and only delivers to the account owner. In production,
// RESEND_FROM_EMAIL must be an address on a domain verified in Resend, otherwise the reset emails do not arrive.
export const EMAIL_FROM: string = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

// Created at send time, not at import: `new Resend()` without a key throws, and the build (which imports the routes to
// collect metadata) does not need a runtime secret.
export function resendClient(): Resend {
	return new Resend(process.env.RESEND_API_KEY);
}
