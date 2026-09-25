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
