"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowerUserInterface, FollowRequestInterface } from "@/types/FollowerUserInterface";
import { FollowRequestsList } from "./follow-requests-list";
import { FollowersList } from "./followers-list";

interface FollowersTabsProps {
	followers: FollowerUserInterface[];
	followRequests: FollowRequestInterface[];
	isLoadingRequests: boolean;
	onRemoveFollower: (followerId: string) => void;
	onAcceptRequest: (requestId: string) => void;
	onRejectRequest: (requestId: string) => void;
}

export function FollowersTabs({
	followers,
	followRequests,
	isLoadingRequests,
	onRemoveFollower,
	onAcceptRequest,
	onRejectRequest,
}: FollowersTabsProps) {
	const t = useTranslations("common.followers");

	return (
		<Tabs defaultValue="followers" className="w-full">
			<TabsList className="flex flex-wrap justify-between gap-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
				<TabsTrigger
					value="followers"
					className="flex-1 text-[0.7rem] sm:text-xs py-2 px-2 rounded-md text-center font-medium transition-all duration-200
          data-[active]:bg-white data-[active]:shadow-sm
          not-data-[active]:opacity-70
          dark:data-[active]:bg-white dark:data-[active]:text-black
          dark:not-data-[active]:bg-neutral-700 dark:not-data-[active]:text-neutral-300"
				>
					{t("tabFollowers", { count: followers.length })}
				</TabsTrigger>
				<TabsTrigger
					value="requests"
					className="flex-1 text-[0.7rem] sm:text-xs py-2 px-2 rounded-md text-center font-medium transition-all duration-200
          data-[active]:bg-white data-[active]:shadow-sm
          not-data-[active]:opacity-70
          dark:data-[active]:bg-white dark:data-[active]:text-black
          dark:not-data-[active]:bg-neutral-700 dark:not-data-[active]:text-neutral-300"
				>
					{t("tabRequests", { count: followRequests.length })}
				</TabsTrigger>
			</TabsList>

			<TabsContent value="followers" className="space-y-3 mt-4">
				<FollowersList followers={followers} onRemove={onRemoveFollower} />
			</TabsContent>

			<TabsContent value="requests" className="space-y-3 mt-4">
				<FollowRequestsList
					requests={followRequests}
					isLoading={isLoadingRequests}
					onAccept={onAcceptRequest}
					onReject={onRejectRequest}
				/>
			</TabsContent>
		</Tabs>
	);
}
