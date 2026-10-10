import TermosDeUsoClient from "./termos-de-uso";

export const metadata = {
	title: "Termos de Uso - Askedly Social Network",
	description: "Veja os termos de uso da plataforma Askedly Social Network",
	openGraph: {
		title: "Termos de Uso - Askedly Social Network",
		description: "Veja os termos de uso da plataforma Askedly Social Network",
		url: "https://respondeae.com.br/termos-de-uso",
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
		description: "Veja os termos de uso da plataforma Askedly Social Network",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/termos-de-uso",
	},
};

export default async function TermosDeUsoPage() {
	return <TermosDeUsoClient />;
}
