"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/actions/locale-actions";
import { locales } from "@/i18n/config";

export function LocaleSwitcher() {
	const t = useTranslations("common");
	const locale = useLocale();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<select
			aria-label={t("language")}
			value={locale}
			disabled={isPending}
			onChange={(event) =>
				startTransition(async () => {
					await setLocale(event.target.value);
					router.refresh();
				})
			}
			className="rounded-md border bg-background px-2 py-1 text-sm text-foreground dark:[color-scheme:dark] [&>option]:bg-background [&>option]:text-foreground"
		>
			{locales.map((code) => (
				<option key={code} value={code}>
					{t(`locales.${code}`)}
				</option>
			))}
		</select>
	);
}
