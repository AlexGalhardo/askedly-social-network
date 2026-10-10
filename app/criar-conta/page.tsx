import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import CriarContaClient from "./criar-conta";

export const metadata = {
	title: "Crie Sua Conta - Askedly Social Network",
	description: "Crie Sua Conta na plataforma Askedly Social Network",
	openGraph: {
		title: "Crie Sua Conta - Askedly Social Network",
		description: "Crie Sua Conta na plataforma Askedly Social Network",
		url: "https://respondeae.com.br/criar-conta",
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
		title: "Crie Sua Conta - Askedly Social Network",
		description: "Crie Sua Conta na plataforma Askedly Social Network",
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
