import PagamentosClient from "./pagamentos";

export const metadata = {
	title: "Pagamentos - Respondeae.com.br",
	description: "Veja os seus pagamentos da plataforma Respondeae.com.br",
	openGraph: {
		title: "Pagamentos - Respondeae.com.br",
		description: "Veja os seus pagamentos da plataforma Respondeae.com.br",
		url: "https://respondeae.com.br/politica-de-privacidade",
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
		description: "Veja os seus pagamentos da plataforma Respondeae.com.br",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/pagamentos",
	},
};

export default async function PagamentosPage() {
	return <PagamentosClient />;
}
