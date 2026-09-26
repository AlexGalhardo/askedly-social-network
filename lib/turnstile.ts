// Site key é pública por natureza. O env existe para o CI usar a chave de teste da Cloudflare, que sempre passa
// (1x00000000000000000000AA, com o secret 1x0000000000000000000000000000000AA).
export const TURNSTILE_SITE_KEY: string =
	process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? "0x4AAAAAABiCEoK5rM8dg1Xm";

interface TurnstileApi {
	render(container: HTMLElement, options: { sitekey: string }): string;
	getResponse(widgetId?: string): string | undefined;
	reset(widgetId?: string): void;
}

export function getTurnstile(): TurnstileApi | undefined {
	return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

/**
 * O token do Turnstile é de uso único. Quando um fluxo precisa de dois (cadastro, depois login), reseta o widget e
 * espera o novo. Null se não chegar a tempo (ex.: a Cloudflare pediu interação).
 */
export async function waitForFreshTurnstileToken(timeoutMs = 15_000): Promise<string | null> {
	const turnstile = getTurnstile();
	if (!turnstile) return null;
	turnstile.reset();
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const token = turnstile.getResponse();
		if (token) return token;
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	return null;
}
