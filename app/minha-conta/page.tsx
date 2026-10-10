import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import MinhaContaClient from "./minha-conta";

const OG_LOCALE = { en: "en_US", pt: "pt_BR", es: "es_ES" } as const;

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("account.meta");
	const title = t("title");
	const description = t("description");

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: "https://respondeae.com.br/minha-conta",
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
			canonical: "/minha-conta",
		},
	};
}

export default function MinhaContaPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<MinhaContaClient />
			</Suspense>
		</div>
	);
}
