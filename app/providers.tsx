"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import type React from "react";
import { useState } from "react";

function ReactQueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 2,
						refetchOnWindowFocus: false,
						retry: (failureCount, error: any) => {
							if (error?.status >= 400 && error?.status < 500) {
								return false;
							}
							return failureCount < 3;
						},
						retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
					},
					mutations: {
						retry: 1,
						retryDelay: 1000,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<ReactQueryProvider>{children}</ReactQueryProvider>
		</SessionProvider>
	);
}
