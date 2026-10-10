import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import EntrarClient from "./entrar";

export const metadata = {
	title: "Entre Na Sua Conta - Askedly Social Network",
	description: "Entre na sua conta da plataforma Askedly Social Network",
	openGraph: {
		title: "Entre Na Sua Conta - Askedly Social Network",
		description: "Entre na sua conta da plataforma Askedly Social Network",
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
		title: "Entre Na Sua Conta - Askedly Social Network",
		description: "Entre na sua conta da plataforma Askedly Social Network",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/entrar",
	},
};

export default function LoginPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<EntrarClient />
			</Suspense>
		</div>
	);
}
