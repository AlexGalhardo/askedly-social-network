import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { openGraphLocale } from "@/lib/utils";
import SobreClient from "./sobre";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("legal.about");
	const title = t("metaTitle");
	const description = t("metaDescription");

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: "https://respondeae.com.br/sobre",
			siteName: "Askedly Social Network",
			images: [
				{
					url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
					width: 1200,
					height: 630,
					alt: "Askedly Social Network",
				},
			],
			locale: openGraphLocale(await getLocale()),
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
		},
		metadataBase: new URL("https://respondeae.com.br/sobre"),
		alternates: {
			canonical: "/sobre",
		},
	};
}

export default async function SobrePage() {
	return <SobreClient />;
}
