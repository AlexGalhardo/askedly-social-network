import { expect, test } from "bun:test";
import { Glob } from "bun";

// "use server" transforma cada export do módulo num endpoint público chamável com qualquer argumento.
// Em lib/ isso já expôs dump de usuários, troca de senha de qualquer conta e criação de webhook "pago".
test("no module under lib/ is a Server Action module", async () => {
	const offenders: string[] = [];
	for await (const file of new Glob("**/*.{ts,tsx}").scan("lib")) {
		const source = await Bun.file(`lib/${file}`).text();
		if (/^\s*["']use server["']/.test(source)) offenders.push(file);
	}
	expect(offenders).toEqual([]);
});
