"use client";

import Script from "next/script";
import { useRef } from "react";
import { getTurnstile, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

/**
 * Captcha do Cloudflare. `onReady` roda quando o script carrega e de novo a cada montagem se ele já estiver na
 * página, então o widget aparece tanto no primeiro acesso quanto em navegação client-side.
 */
export function TurnstileWidget() {
	const container = useRef<HTMLDivElement>(null);

	const render = (): void => {
		const turnstile = getTurnstile();
		if (!turnstile || !container.current || container.current.childElementCount > 0) return;
		turnstile.render(container.current, { sitekey: TURNSTILE_SITE_KEY });
	};

	return (
		<>
			<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={render} />
			<div className="w-full" ref={container} />
		</>
	);
}
