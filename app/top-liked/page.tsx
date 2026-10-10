import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
	getTopLikedAnswersAllTime,
	getTopLikedAnswersThisMonth,
	getTopLikedAnswersThisWeek,
	getTopLikedAnswersThisYear,
	getTopLikedAnswersToday,
} from "@/lib/repositories/questions.repository";
import TopCurtidasClient from "./top-liked";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("feed");
	const locale = await getLocale();
	const title = t("top.metaTitle");
	const description = t("top.metaDescription");

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: "https://respondeae.com.br/top-liked",
			siteName: "Askedly",
			images: [
				{
					url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
					width: 1200,
					height: 630,
					alt: "Askedly",
				},
			],
			locale: { en: "en_US", pt: "pt_BR", es: "es_ES" }[locale],
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: ["https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"],
		},
		metadataBase: new URL("https://respondeae.com.br"),
		alternates: {
			canonical: "/top-liked",
		},
	};
}

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
