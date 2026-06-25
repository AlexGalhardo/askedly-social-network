import LoadingScreen from "@/components/loading-screen";
import { Suspense } from "react";
import MinhaContaClient from "./minha-conta";

export const metadata = {
	title: "Minha Conta - Respondeae.com.br",
	description: "Configurações da sua conta da plataforma Respondeae.com.br",
	openGraph: {
		title: "Entre Na Sua Conta - Respondeae.com.br",
		description: "Configurações da sua conta da plataforma Respondeae.com.br",
		url: "https://respondeae.com.br/minha-conta",
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
		title: "Minha Conta - Respondeae.com.br",
		description: "Configurações da sua conta da plataforma Respondeae.com.br",
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
