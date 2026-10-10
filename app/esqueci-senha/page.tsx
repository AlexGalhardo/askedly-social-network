import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import EsqueciSenhaClient from "./esqueci-senha";

export const metadata = {
	title: "Esqueci Minha Senha - Askedly Social Network",
	description: "Recupere sua senha da plataforma Askedly Social Network",
	openGraph: {
		title: "Entre Na Sua Conta - Askedly Social Network",
		description: "Recupere sua senha da plataforma Askedly Social Network",
		url: "https://respondeae.com.br/esqueci-senha",
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
		title: "Esqueci Minha Senha - Askedly Social Network",
		description: "Recupere sua senha da plataforma Askedly Social Network",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/esqueci-senha",
	},
};

export default function LoginPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<EsqueciSenhaClient />
			</Suspense>
		</div>
	);
}
