import type { Metadata } from "next";
import type React from "react";
import "@/app/globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { MySidebar } from "@/components/my-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { openGraphLocale } from "@/lib/utils";
import { ReactQueryProvider } from "../providers/react-query-provider";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("common.meta");
	const title = t("title");
	const description = t("description");

	return {
		title,
		description,
		keywords: t("keywords"),
		openGraph: {
			title,
			description,
			url: "https://respondeae.com.br",
			siteName: "Askedly",
			images: [
				{
					url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
					width: 1200,
					height: 630,
					alt: "Askedly",
				},
			],
			locale: openGraphLocale(await getLocale()),
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: t("twitterDescription"),
			images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
		},
		metadataBase: new URL("https://respondeae.com.br"),
	};
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Gerado a cada requisição em proxy.ts. Ler o header torna todas as páginas dinâmicas, o que o CSP por nonce exige:
	// página estática é gerada no build, sem requisição, e seus scripts seriam bloqueados.
	const nonce = (await headers()).get("x-nonce") ?? undefined;

	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className={inter.className}>
				<GoogleAnalytics GA_MEASUREMENT_ID="G-3QEQRYL4P9" nonce={nonce} />

				<NextIntlClientProvider>
					<Providers>
						<ThemeProvider
							attribute="class"
							defaultTheme="light"
							enableSystem={false}
							disableTransitionOnChange
							nonce={nonce}
						>
							<ReactQueryProvider>
								<div className="min-h-screen bg-background">
									<MySidebar />
									<main className="pt-14 lg:pt-0 lg:max-w-7xl lg:mx-auto lg:pl-96 lg:pr-6 lg:min-h-screen">
										{children}
									</main>
								</div>
							</ReactQueryProvider>
						</ThemeProvider>
					</Providers>
				</NextIntlClientProvider>

				<Toaster />

				<SpeedInsights />

				<Script id="ms-clarity" strategy="afterInteractive" nonce={nonce}>
					{`
							(function(c,l,a,r,i,t,y){
								c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
								t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
								y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
							})(window, document, "clarity", "script", "rxiv4z7b4u");
						`}
				</Script>
			</body>
		</html>
	);
}
