import { z } from "zod";

// Environment variable validation, imported by next.config.ts: runs on every build and every start.
// A missing or invalid essential one breaks the build. A missing optional one only turns the feature off and warns in the log.

const url = z.string().url();

const essential = z.object({
	DATABASE_URL: z.string().min(1),
	NEXTAUTH_SECRET: z.string().min(1),
	NEXTAUTH_URL: url,
	NEXT_PUBLIC_APP_URL: url,
});

/** Feature -> variables it needs. All or none: half configured is a configuration error. */
const optionalFeatures: Record<string, string[]> = {
	"PIX (AbacatePay)": ["ABACATEPAY_API_KEY", "ABACATEPAY_WEBHOOK_SECRET"],
	"Credits and payouts (Stripe)": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
	"Captcha (Cloudflare Turnstile)": ["NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY", "CLOUDFLARE_TURNSTILE_SECRET"],
	"Google login": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
	"Emails (Resend)": ["RESEND_API_KEY"],
	"Avatar upload (UploadThing)": ["UPLOADTHING_TOKEN"],
	"Telegram logs": ["TELEGRAM_BOT_HTTP_TOKEN", "TELEGRAM_BOT_CHANNEL_ID"],
	"Daily cron": ["CRON_SECRET"],
};

export interface EnvReport {
	errors: string[];
	warnings: string[];
}

export function checkEnv(env: Record<string, string | undefined>): EnvReport {
	const errors: string[] = [];
	const warnings: string[] = [];

	const result = essential.safeParse(env);
	if (!result.success) {
		for (const issue of result.error.issues) errors.push(`${issue.path.join(".")}: ${issue.message}`);
	}

	for (const [feature, names] of Object.entries(optionalFeatures)) {
		const missing = names.filter((name) => !env[name]);
		if (missing.length === names.length) warnings.push(`${feature} is off (${names.join(", ")} not set)`);
		else if (missing.length > 0) warnings.push(`${feature} is half configured: missing ${missing.join(", ")}`);
	}

	if (env.VERCEL_ENV === "production" && env.NEXT_PUBLIC_TEST_MODE === "true") {
		warnings.push("NEXT_PUBLIC_TEST_MODE is true in production");
	}

	return { errors, warnings };
}

/** `SKIP_ENV_VALIDATION=true` exists for the Docker image build, which only receives the variables at runtime. */
export function validateEnv(env: Record<string, string | undefined> = process.env): void {
	if (env.SKIP_ENV_VALIDATION === "true") return;

	const { errors, warnings } = checkEnv(env);
	for (const warning of warnings) console.warn(`[env] ${warning}`);
	if (errors.length > 0) {
		throw new Error(`Invalid environment variables:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
	}
}
