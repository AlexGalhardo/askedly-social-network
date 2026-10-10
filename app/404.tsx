"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function NotFound() {
	const t = useTranslations("common.notFound");
	const router = useRouter();
	const [countdown, setCountdown] = useState(5);

	useEffect(() => {
		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					router.push("/");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [router]);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center dark:text-white text-black p-4">
			<div className="max-w-md text-center space-y-6">
				<h1 className="text-6xl font-bold text-rose-600">404</h1>
				<h2 className="text-3xl font-semibold">{t("title")}</h2>
				<p className="text-lg text-gray-500">{t("description")}</p>
				<p className="text-gray-500">
					{t.rich("redirecting", {
						seconds: countdown,
						count: (chunks) => <span className="font-bold text-rose-600">{chunks}</span>,
					})}
				</p>
			</div>
		</div>
	);
}
