import { expect, test } from "bun:test";
import { checkEnv } from "./env";

const essential = {
	DATABASE_URL: "postgresql://u:p@localhost:5432/db",
	NEXTAUTH_SECRET: "secret",
	NEXTAUTH_URL: "http://localhost:3000",
	NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

test("essential variables missing or invalid are errors", () => {
	expect(checkEnv({}).errors).toHaveLength(4);
	expect(checkEnv({ ...essential, NEXTAUTH_URL: "not-a-url" }).errors).toHaveLength(1);
	expect(checkEnv(essential).errors).toHaveLength(0);
});

test("optional features only warn, including a half-configured one", () => {
	const { errors, warnings } = checkEnv({ ...essential, STRIPE_SECRET_KEY: "rk_test_x" });
	expect(errors).toHaveLength(0);
	expect(warnings).toContain("Credits and payouts (Stripe) is half configured: missing STRIPE_WEBHOOK_SECRET");
	expect(warnings.some((warning) => warning.startsWith("PIX (AbacatePay) is off"))).toBe(true);
});
