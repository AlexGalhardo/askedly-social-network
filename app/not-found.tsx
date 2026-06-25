import NotFound from "./404";

export const metadata = {
	title: "Página Não Encontrada - Respondeae.com.br",
	description: "Essa página não existe na plataforma Respondeae.com.br",
	openGraph: {
		title: "Página Não Encontrada - Respondeae.com.br",
		description: "Essa página não existe na plataforma Respondeae.com.br",
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
		title: "Página Não Encontrada - Respondeae.com.br",
		description: "Essa página não existe na plataforma Respondeae.com.br",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
};

export default NotFound;
