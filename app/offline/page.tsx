import { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("common.offline");

	return {
		title: t("title"),
		description: t("metaDescription"),
		robots: "noindex, nofollow",
	};
}

export default async function OfflinePage() {
	const t = await getTranslations("common.offline");
	const format = await getFormatter();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center text-white border border-white/20">
				<div className="text-6xl mb-6 animate-pulse">🔧</div>
				<h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
				<p className="text-lg mb-6 opacity-90">{t("description")}</p>
				<div className="bg-white/20 rounded-lg p-4">
					<div className="flex items-center justify-center mb-2">
						<div className="w-3 h-3 bg-red-400 rounded-full animate-pulse mr-2"></div>
						<span className="font-semibold">{t("status")}</span>
					</div>
					<p className="text-sm opacity-80">
						{t("lastUpdate", {
							date: format.dateTime(new Date(), { dateStyle: "short", timeStyle: "medium" }),
						})}
					</p>
				</div>
			</div>
		</div>
	);
}
