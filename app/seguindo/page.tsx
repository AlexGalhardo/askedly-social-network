"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { FollowingHeader } from "@/components/following/following-header";
import { FollowingList } from "@/components/following/following-list";
import LoadingScreen from "@/components/loading-screen";
import { useFollowing } from "@/hooks/use-following";

export default function SeguindoPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: following, setData: setFollowing } = useFollowing();

	useEffect(() => {
		if (status !== "loading" && !session) {
			router.push("/");
		}
	}, [session, status, router]);

	const handleUnfollow = (followingId: string) => {
		setFollowing((prev) => prev.filter((user) => user.following.id !== followingId));
	};

	if (status === "loading") return <LoadingScreen />;

	if (!session) {
		router.push("/");
		return null;
	}

	return (
		<main className="p-4 lg:p-6">
			<div>
				<FollowingHeader count={following.length} />
				<FollowingList following={following} onUnfollow={handleUnfollow} />
			</div>
		</main>
	);
}
