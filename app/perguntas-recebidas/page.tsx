import PerguntasRecebidasClient from "./perguntas-recebidas";

export const metadata = {
	title: "Perguntas Recebidas - Askedly Social Network",
	description: "Veja as Perguntas Recebidas que você recebeu e os status delas.",
	openGraph: {
		title: "Perguntas Recebidas - Askedly Social Network",
		description: "Veja as Perguntas Recebidas que você recebeu e os status delas.",
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
		locale: "pt_BR",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Perguntas Recebidas - Askedly Social Network",
		description: "Veja as Perguntas Recebidas que você recebeu e os status delas.",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/notificacoes",
	},
};

export default async function NotificacoesPage() {
	return <PerguntasRecebidasClient />;
}
