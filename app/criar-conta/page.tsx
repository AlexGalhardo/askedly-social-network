import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import CriarContaClient from "./criar-conta";

const OG_LOCALE = { en: "en_US", pt: "pt_BR", es: "es_ES" } as const;

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("auth.meta");
	const title = t("signupTitle");
	const description = t("signupDescription");

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: "https://respondeae.com.br/criar-conta",
			siteName: "Askedly Social Network",
			images: [
				{
					url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
					width: 1200,
					height: 630,
					alt: "Askedly Social Network",
				},
			],
			locale: OG_LOCALE[await getLocale()],
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
		},
		metadataBase: new URL("https://respondeae.com.br"),
		alternates: {
			canonical: "/criar-conta",
		},
	};
}

export default function CadastroPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<CriarContaClient />
			</Suspense>
		</div>
	);
}
