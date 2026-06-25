import SobreClient from "./sobre";

export const metadata = {
	title: "Sobre - Respondeae.com.br",
	description: "Saiba mais sobre o respondeae.com.br",
	openGraph: {
		title: "Sobre - Respondeae.com.br",
		description: "Saiba mais sobre o respondeae.com.br",
		url: "https://respondeae.com.br/sobre",
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
		title: "Sobre - Respondeae.com.br",
		description: "Saiba mais sobre o respondeae.com.br",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br/sobre"),
	alternates: {
		canonical: "/sobre",
	},
};

export default async function SobrePage() {
	return <SobreClient />;
}
