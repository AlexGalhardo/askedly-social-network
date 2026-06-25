"use client";

import * as Progress from "@radix-ui/react-progress";
import { useEffect, useState } from "react";

export default function ProgressBar() {
	const [progress, setProgress] = useState(13);

	useEffect(() => {
		const timer = setInterval(() => {
			setProgress((prev) => (prev >= 100 ? 100 : prev + 5));
		}, 200);

		return () => clearInterval(timer);
	}, []);

	return (
		<div className="w-full max-w-md mx-auto mt-20 px-4">
			<Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full w-full h-4" value={progress}>
				<Progress.Indicator
					className="bg-indigo-600 h-full transition-all duration-300 ease-in-out"
					style={{ width: `${progress}%` }}
				/>
			</Progress.Root>
			<p className="mt-2 text-sm text-center text-gray-600">{progress}% Carregando...</p>
		</div>
	);
}
