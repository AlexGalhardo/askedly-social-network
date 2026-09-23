import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import EsqueciSenhaClient from "./esqueci-senha";

export const metadata = {
	title: "Esqueci Minha Senha - Respondeae.com.br",
	description: "Recupere sua senha da plataforma Respondeae.com.br",
	openGraph: {
		title: "Entre Na Sua Conta - Respondeae.com.br",
		description: "Recupere sua senha da plataforma Respondeae.com.br",
		url: "https://respondeae.com.br/esqueci-senha",
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
		title: "Esqueci Minha Senha - Respondeae.com.br",
		description: "Recupere sua senha da plataforma Respondeae.com.br",
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
