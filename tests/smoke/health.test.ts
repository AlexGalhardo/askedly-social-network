import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Subprocess } from "bun";

// Smoke test: boots the production server (`bun run build` must already have run)
// and checks the app actually comes up and answers a basic request.
const PORT = process.env.SMOKE_TEST_PORT ?? "3100";
const BASE_URL = `http://localhost:${PORT}`;

let server: Subprocess;

async function waitForServer(retries = 30, delayMs = 1000): Promise<void> {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(`${BASE_URL}/api/health`);
			if (res.ok || res.status === 503) return;
		} catch {
			// server not up yet, keep polling
		}
		await new Promise((resolve) => setTimeout(resolve, delayMs));
	}
	throw new Error(`Server did not respond on ${BASE_URL} after ${retries} retries`);
}

describe("smoke: production server boots and responds", () => {
	beforeAll(async () => {
		// Spawn the `next` binary directly (not `bun run start`) so kill() below
		// terminates the actual server process instead of leaking it past a
		// wrapper script that doesn't forward signals to its child.
		// Node, como na Vercel: sob o runtime do Bun os módulos externalizados pelo Next (Prisma, pg) não resolvem.
		server = Bun.spawn(["node", "node_modules/next/dist/bin/next", "start", "-p", PORT], {
			stdout: "pipe",
			stderr: "pipe",
			env: { ...process.env, PORT },
		});
		await waitForServer();
	});

	afterAll(async () => {
		server?.kill();
		await server?.exited;
	});

	test("GET /api/health responds with 200 and status ok", async () => {
		const res = await fetch(`${BASE_URL}/api/health`);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.status).toBe("ok");
		expect(typeof body.timestamp).toBe("string");
	});

	test("GET / (homepage) responds", async () => {
		const res = await fetch(`${BASE_URL}/`);
		expect(res.status).toBeLessThan(500);
	});
});
