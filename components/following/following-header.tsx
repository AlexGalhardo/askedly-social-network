import { useTranslations } from "next-intl";

interface FollowingHeaderProps {
	count: number;
}

export function FollowingHeader({ count }: FollowingHeaderProps) {
	const t = useTranslations("common.following");

	return <h2 className="text-xl font-bold text-foreground mb-4">{t("header", { count })}</h2>;
}
