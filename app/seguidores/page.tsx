"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FollowersTabs } from "@/components/followers/followers-tabs";
import LoadingScreen from "@/components/loading-screen";
import { useFollowers, useFollowRequests } from "@/hooks/use-follower";

export default function SeguidoresPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: followers, setData: setFollowers } = useFollowers();
	const { data: followRequests = [], isLoading: isLoadingRequests } = useFollowRequests();
	const [localRequests, setLocalRequests] = useState(followRequests);

	useEffect(() => {
		if (status !== "loading" && !session) {
			router.push("/");
		}
	}, [session, status, router]);

	useEffect(() => {
		setLocalRequests(followRequests);
	}, [followRequests]);

	const handleRemoveFollower = (followerId: string) => {
		setFollowers((prev) => prev.filter((follower) => follower.follower.id !== followerId));
	};

	const handleAcceptRequest = (requestId: string) => {
		setLocalRequests((prev) => prev.filter((req) => req.id !== requestId));
	};

	const handleRejectRequest = (requestId: string) => {
		setLocalRequests((prev) => prev.filter((req) => req.id !== requestId));
	};

	if (status === "loading") return <LoadingScreen />;

	if (!session) {
		router.push("/");
		return null;
	}

	return (
		<main className="p-4 lg:p-6">
			<FollowersTabs
				followers={followers}
				followRequests={localRequests}
				isLoadingRequests={isLoadingRequests}
				onRemoveFollower={handleRemoveFollower}
				onAcceptRequest={handleAcceptRequest}
				onRejectRequest={handleRejectRequest}
			/>
		</main>
	);
}
