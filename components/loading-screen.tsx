import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LoadingScreen() {
	const t = useTranslations("common");

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-300">
			<Loader2 className="mb-4 w-10 h-10 animate-spin text-primary" />
			<p className="text-lg font-medium">{t("loading")}</p>
		</div>
	);
}
