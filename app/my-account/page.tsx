import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import MyAccountClient from "./my-account";

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
			url: "https://respondeae.com.br/my-account",
			siteName: "Askedly",
			images: [
				{
					url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
					width: 1200,
					height: 630,
					alt: "Askedly",
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
			canonical: "/my-account",
		},
	};
}

export default function MyAccountPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<MyAccountClient />
			</Suspense>
		</div>
	);
}
