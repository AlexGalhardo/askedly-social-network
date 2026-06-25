import TermosDeUsoClient from "./termos-de-uso";

export const metadata = {
	title: "Termos de Uso - Respondeae.com.br",
	description: "Veja os termos de uso da plataforma Respondeae.com.br",
	openGraph: {
		title: "Termos de Uso - Respondeae.com.br",
		description: "Veja os termos de uso da plataforma Respondeae.com.br",
		url: "https://respondeae.com.br/termos-de-uso",
		siteName: "Respondeae.com.br",
		images: [
			{
				url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
				width: 1200,
				height: 630,
				alt: "RespondeAê",
			},
		],
		locale: "pt_BR",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Feed - Respondeae.com.br",
		description: "Veja os termos de uso da plataforma Respondeae.com.br",
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
