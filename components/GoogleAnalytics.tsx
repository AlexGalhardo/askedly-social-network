"use client";

import Script from "next/script";

interface Props {
	GA_MEASUREMENT_ID: string;
	nonce?: string;
}

export default function GoogleAnalytics({ GA_MEASUREMENT_ID, nonce }: Props) {
	return (
		<>
			<Script
				src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
				strategy="afterInteractive"
				nonce={nonce}
			/>
			<Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
				{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
			</Script>
		</>
	);
}
