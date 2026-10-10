"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Any error while rendering a page lands here, inside the layout (sidebar and locale keep working),
// instead of becoming the server's 500 error screen.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	const t = useTranslations("common.errorPage");

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<p className="max-w-md text-muted-foreground">{t("description")}</p>
			<div className="flex gap-2">
				<Button onClick={reset}>{t("retry")}</Button>
				<Button variant="outline" render={<Link href="/" />}>
					{t("home")}
				</Button>
			</div>
		</div>
	);
}
