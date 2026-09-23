import type { Metadata } from "next";
import type React from "react";
import "@/app/globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import Script from "next/script";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { MySidebar } from "@/components/my-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ReactQueryProvider } from "../providers/react-query-provider";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "RespondeAê - Receba Perguntas, Monetize Suas Respostas.",
	description:
		"Compartilhe conhecimento e suas experiências com pessoas interessadas em saber o que você tem a dizer.",
	keywords: ["respondeae.com.br", "perguntas", "monetização", "respostas", "plataforma social", "ganhar dinheiro"],
	icons: {
		icon: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
	},
	openGraph: {
		title: "Respondeae.com.br - Receba Perguntas. Monetize Suas Respostas.",
		description:
			"Compartilhe conhecimento e suas experiências com pessoas interessadas em saber o que você tem a dizer.",
		url: "https://respondeae.com.br",
		siteName: "Respondeae.com.br",
		images: [
			{
				url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
				width: 1200,
				height: 630,
				alt: "Respondeae.com.br",
			},
		],
		locale: "pt_BR",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "RespondeAê - Receba Perguntas. Monetize Suas Respostas.",
		description:
			"RespondeAê é uma plataforma onde você pode receber e enviar perguntas para outros perfis, e monetizar suas respostas.",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body className={inter.className}>
				<GoogleAnalytics GA_MEASUREMENT_ID="G-3QEQRYL4P9" />

				<Providers>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
						enableSystem={false}
						disableTransitionOnChange
					>
						<ReactQueryProvider>
							<div className="min-h-screen bg-background">
								<MySidebar />
								<div className="lg:hidden">
									<main className="pt-14">{children}</main>
								</div>
								<div className="hidden lg:block">
									<main className="max-w-7xl mx-auto pl-96 pr-6 min-h-screen">{children}</main>
								</div>
							</div>
						</ReactQueryProvider>
					</ThemeProvider>
				</Providers>

				<Toaster />

				<SpeedInsights />

				<Script
					id="ms-clarity"
					strategy="afterInteractive"
					dangerouslySetInnerHTML={{
						__html: `
							(function(c,l,a,r,i,t,y){
								c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
								t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
								y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
							})(window, document, "clarity", "script", "rxiv4z7b4u");
						`,
					}}
				/>
			</body>
		</html>
	);
}
