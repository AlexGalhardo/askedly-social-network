import { expect, test } from "bun:test";
import { Glob } from "bun";

// "use server" turns every export of the module into a public endpoint callable with any argument.
// In lib/ this has already exposed a user dump, password change for any account and creation of a "paid" webhook.
test("no module under lib/ is a Server Action module", async () => {
	const offenders: string[] = [];
	for await (const file of new Glob("**/*.{ts,tsx}").scan("lib")) {
		const source = await Bun.file(`lib/${file}`).text();
		if (/^\s*["']use server["']/.test(source)) offenders.push(file);
	}
	expect(offenders).toEqual([]);
});
