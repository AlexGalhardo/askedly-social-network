"use client";

import { cn } from "@/lib/utils";

export type FeedType = "community" | "following";

interface FeedTabsProps {
	activeTab: FeedType;
	onTabChange: (tab: FeedType) => void;
	isLoggedIn: boolean;
	className?: string;
}

export const FeedTabs = ({ activeTab, onTabChange, isLoggedIn, className }: FeedTabsProps) => {
	if (!isLoggedIn) return null;

	return (
		<div className={cn("flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6", className)}>
			<button
				onClick={() => onTabChange("community")}
				className={cn(
					"flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
					activeTab === "community"
						? "bg-black text-white shadow-sm"
						: "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
				)}
			>
				Comunidade
			</button>

			<button
				onClick={() => onTabChange("following")}
				className={cn(
					"flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
					activeTab === "following"
						? "bg-black text-white shadow-sm"
						: "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
				)}
			>
				Seguindo
			</button>
		</div>
	);
};
