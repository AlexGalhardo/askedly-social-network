import ContatoClient from "./contato";

export const metadata = {
	title: "Contato - Respondeae.com.br",
	description: "Contato da plataforma Respondeae.com.br",
	openGraph: {
		title: "Contato - Respondeae.com.br",
		description: "Contato da plataforma Respondeae.com.br",
		url: "https://respondeae.com.br/entrar",
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
		title: "Contato - Respondeae.com.br",
		description: "Contato da plataforma Respondeae.com.br",
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
