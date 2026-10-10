import PagamentosClient from "./pagamentos";

export const metadata = {
	title: "Pagamentos - Askedly Social Network",
	description: "Veja os seus pagamentos da plataforma Askedly Social Network",
	openGraph: {
		title: "Pagamentos - Askedly Social Network",
		description: "Veja os seus pagamentos da plataforma Askedly Social Network",
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
		description: "Veja os seus pagamentos da plataforma Askedly Social Network",
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
