"use client";

import Script from "next/script";
import { useRef } from "react";
import { getTurnstile, TURNSTILE_ENABLED, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

/**
 * Cloudflare captcha. `onReady` runs when the script loads and again on every mount if it is already on the
 * page, so the widget shows up both on first load and on client-side navigation.
 */
export function TurnstileWidget() {
	const container = useRef<HTMLDivElement>(null);

	const render = (): void => {
		const turnstile = getTurnstile();
		if (!turnstile || !container.current || container.current.childElementCount > 0) return;
		turnstile.render(container.current, { sitekey: TURNSTILE_SITE_KEY });
	};

	if (!TURNSTILE_ENABLED) return null;

	return (
		<>
			<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={render} />
			<div className="w-full" ref={container} />
		</>
	);
}
