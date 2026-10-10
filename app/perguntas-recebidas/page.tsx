import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import PerguntasRecebidasClient from "./perguntas-recebidas";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("questions");
	const locale = await getLocale();
	const title = t("received.metaTitle");
	const description = t("received.metaDescription");

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: "https://respondeae.com.br/feed",
			siteName: "Askedly Social Network",
			images: [
				{
					url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
					width: 1200,
					height: 630,
					alt: "Askedly Social Network",
				},
			],
			locale: { en: "en_US", pt: "pt_BR", es: "es_ES" }[locale],
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
			canonical: "/notificacoes",
		},
	};
}

export default async function NotificacoesPage() {
	return <PerguntasRecebidasClient />;
}
