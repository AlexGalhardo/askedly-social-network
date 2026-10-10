"use client";

import { Progress } from "@base-ui/react/progress";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function ProgressBar() {
	const t = useTranslations("common");
	const [progress, setProgress] = useState(13);

	useEffect(() => {
		const timer = setInterval(() => {
			setProgress((prev) => (prev >= 100 ? 100 : prev + 5));
		}, 200);

		return () => clearInterval(timer);
	}, []);

	return (
		<div className="w-full max-w-md mx-auto mt-20 px-4">
			<Progress.Root value={progress}>
				<Progress.Track className="relative overflow-hidden bg-gray-200 rounded-full w-full h-4">
					<Progress.Indicator className="bg-indigo-600 h-full transition-all duration-300 ease-in-out" />
				</Progress.Track>
			</Progress.Root>
			<p className="mt-2 text-sm text-center text-gray-600">{t("loadingProgress", { progress })}</p>
		</div>
	);
}
