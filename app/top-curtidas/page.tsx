import {
	getTopLikedAnswersAllTime,
	getTopLikedAnswersThisMonth,
	getTopLikedAnswersThisWeek,
	getTopLikedAnswersThisYear,
	getTopLikedAnswersToday,
} from "@/lib/repositories/questions.repository";
import TopCurtidasClient from "./top-curtidas";

export const metadata = {
	title: "Top 10 Perguntas & Respostas Curtidas - Respondeae.com.br",
	description:
		"Veja o TOP 10 perguntas e respostas curtidas da platforma Respondeae.com.br por dia, semana, mês, ano e geral.",
	openGraph: {
		title: "Top 10 Perguntas & Respostas Curtidas - Respondeae.com.br",
		description:
			"Veja o TOP 10 perguntas e respostas curtidas da platforma Respondeae.com.br por dia, semana, mês, ano e geral.",
		url: "https://respondeae.com.br/top-curtidas",
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
		title: "Top 10 Perguntas & Respostas Curtidas - Respondeae.com.br",
		description:
			"Veja o TOP 10 perguntas e respostas curtidas da platforma Respondeae.com.br por dia, semana, mês, ano e geral.",
		images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
	},
	metadataBase: new URL("https://respondeae.com.br"),
	alternates: {
		canonical: "/top-curtidas",
	},
};

export default async function TopCurtidasPage() {
	const topLikedAnswersToday = await getTopLikedAnswersToday();
	const topLikedAnswersThisWeek = await getTopLikedAnswersThisWeek();
	const topLikedAnswersThisMonth = await getTopLikedAnswersThisMonth();
	const topLikedAnswersThisYear = await getTopLikedAnswersThisYear();
	const topLikedAnswersAllTime = await getTopLikedAnswersAllTime();

	return (
		<TopCurtidasClient
			today={topLikedAnswersToday}
			week={topLikedAnswersThisWeek}
			month={topLikedAnswersThisMonth}
			year={topLikedAnswersThisYear}
			allTime={topLikedAnswersAllTime}
		/>
	);
}
