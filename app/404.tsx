"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
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
				<h2 className="text-3xl font-semibold">Página não encontrada</h2>
				<p className="text-lg text-gray-500">A página que você está procurando não existe ou foi removida.</p>
				<p className="text-gray-500">
					Redirecionando em <span className="font-bold text-rose-600">{countdown}</span> segundos...
				</p>
			</div>
		</div>
	);
}
