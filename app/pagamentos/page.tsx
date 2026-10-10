import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import PagamentosClient from "./pagamentos";

const OPEN_GRAPH_LOCALES: Record<string, string> = { en: "en_US", pt: "pt_BR", es: "es_ES" };

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("payments");
	const title = t("meta.title");
	const description = t("meta.description");

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: "https://respondeae.com.br/politica-de-privacidade",
			siteName: "Askedly Social Network",
			images: [
				{
					url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
					width: 1200,
					height: 630,
					alt: "Askedly Social Network",
				},
			],
			locale: OPEN_GRAPH_LOCALES[await getLocale()],
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
			canonical: "/pagamentos",
		},
	};
}

export default async function PagamentosPage() {
	return <PagamentosClient />;
}
