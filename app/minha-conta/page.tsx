import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import MinhaContaClient from "./minha-conta";

export const metadata = {
	title: "Minha Conta - Askedly Social Network",
	description: "Configurações da sua conta da plataforma Askedly Social Network",
	openGraph: {
		title: "Entre Na Sua Conta - Askedly Social Network",
		description: "Configurações da sua conta da plataforma Askedly Social Network",
		url: "https://respondeae.com.br/minha-conta",
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
		title: "Minha Conta - Askedly Social Network",
		description: "Configurações da sua conta da plataforma Askedly Social Network",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/minha-conta",
	},
};

export default function MinhaContaPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<MinhaContaClient />
			</Suspense>
		</div>
	);
}
