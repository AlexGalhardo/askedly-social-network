"use client";

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
	return (
		<Tabs defaultValue="followers" className="w-full">
			<TabsList className="flex flex-wrap justify-between gap-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
				<TabsTrigger
					value="followers"
					className="flex-1 text-[0.7rem] sm:text-xs py-2 px-2 rounded-md text-center font-medium transition-all duration-200
          data-[state=active]:bg-white data-[state=active]:shadow-sm
          data-[state=inactive]:opacity-70
          dark:data-[state=active]:bg-white dark:data-[state=active]:text-black
          dark:data-[state=inactive]:bg-neutral-700 dark:data-[state=inactive]:text-neutral-300"
				>
					Seus Seguidores ({followers.length})
				</TabsTrigger>
				<TabsTrigger
					value="requests"
					className="flex-1 text-[0.7rem] sm:text-xs py-2 px-2 rounded-md text-center font-medium transition-all duration-200
          data-[state=active]:bg-white data-[state=active]:shadow-sm
          data-[state=inactive]:opacity-70
          dark:data-[state=active]:bg-white dark:data-[state=active]:text-black
          dark:data-[state=inactive]:bg-neutral-700 dark:data-[state=inactive]:text-neutral-300"
				>
					Solicitações Para Te Seguir ({followRequests.length})
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
