import PoliticaDePrivacidadeClient from "./politica-de-privacidade";

export const metadata = {
	title: "Política de Privacidade - Askedly Social Network",
	description: "Veja as Política de Privacidade da plataforma Askedly Social Network",
	openGraph: {
		title: "Política de Privacidade - Askedly Social Network",
		description: "Veja os Política de Privacidade da plataforma Askedly Social Network",
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
		locale: "pt_BR",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Feed - Askedly Social Network",
		description: "Veja as Política de Privacidade da plataforma Askedly Social Network",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/politica-de-privacidade",
	},
};

export default async function PoliticaDePrivacidadePage() {
	return <PoliticaDePrivacidadeClient />;
}
