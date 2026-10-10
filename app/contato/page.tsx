import ContatoClient from "./contato";

export const metadata = {
	title: "Contato - Askedly Social Network",
	description: "Contato da plataforma Askedly Social Network",
	openGraph: {
		title: "Contato - Askedly Social Network",
		description: "Contato da plataforma Askedly Social Network",
		url: "https://respondeae.com.br/entrar",
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
		title: "Contato - Askedly Social Network",
		description: "Contato da plataforma Askedly Social Network",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/contato",
	},
};

export default function LoginPage() {
	return (
		<div>
			<ContatoClient />
		</div>
	);
}
