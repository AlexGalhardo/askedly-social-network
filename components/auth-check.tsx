"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingScreen from "./loading-screen";
import ProgressBar from "./pogress-bar";

interface AuthCheckProps {
	children: React.ReactNode;
}

export function AuthCheck({ children }: AuthCheckProps) {
	const router = useRouter();
	const { status } = useSession();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/entrar");
		} else if (status !== "loading") {
			setIsLoading(false);
		}
	}, [status, router]);

	if (isLoading || status === "loading") {
		// return (
		//   <LoadingScreen />
		// )
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingScreen />
			</div>
		);
	}

	if (status === "unauthenticated") {
		return null;
	}

	return <>{children}</>;
}
