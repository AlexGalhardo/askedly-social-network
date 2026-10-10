import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { publicErrorMessage } from "./errors";

describe("publicErrorMessage", () => {
	test("keeps validation messages, which are written for the user", () => {
		const result = z.object({ name: z.string().min(4, "Name too short") }).safeParse({ name: "a" });
		expect(publicErrorMessage(result.error, "Error")).toBe("Name too short");
	});

	test("hides anything else behind the fallback", () => {
		const prismaLike = new Error("Invalid `prisma.user.update()` invocation: column users.password ...");
		expect(publicErrorMessage(prismaLike, "Internal server error")).toBe("Internal server error");
	});
});
