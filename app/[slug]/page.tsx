import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import ProfileClient from "./profile";

export async function generateMetadata({ params }: any): Promise<Metadata> {
	const resolvedParams = await params;
	const nickname = resolvedParams.slug;
	const t = await getTranslations("profile");
	const locale = await getLocale();

	const title = `@${nickname} - Askedly Social Network`;
	const description = t("meta.description", { nickname });

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: `https://respondeae.com.br/${nickname}`,
			siteName: "Askedly Social Network",
			images: [
				{
					url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
					width: 1200,
					height: 630,
					alt: "Askedly Social Network",
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
	};
}

export default async function ProfileNicknamePage() {
	return <ProfileClient />;
}
