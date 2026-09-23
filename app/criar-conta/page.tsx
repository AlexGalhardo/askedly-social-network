import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import CriarContaClient from "./criar-conta";

export const metadata = {
	title: "Crie Sua Conta - Respondeae.com.br",
	description: "Crie Sua Conta na plataforma Respondeae.com.br",
	openGraph: {
		title: "Crie Sua Conta - Respondeae.com.br",
		description: "Crie Sua Conta na plataforma Respondeae.com.br",
		url: "https://respondeae.com.br/criar-conta",
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
		title: "Crie Sua Conta - Respondeae.com.br",
		description: "Crie Sua Conta na plataforma Respondeae.com.br",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/criar-conta",
	},
};

export default function CadastroPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<CriarContaClient />
			</Suspense>
		</div>
	);
}
