"use client";

import Script from "next/script";

interface Props {
	GA_MEASUREMENT_ID: string;
}

export default function GoogleAnalytics({ GA_MEASUREMENT_ID }: Props) {
	return (
		<>
			<Script
				src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
				strategy="afterInteractive"
			/>
			<Script id="ga-init" strategy="afterInteractive">
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
