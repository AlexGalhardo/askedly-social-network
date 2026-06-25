"use client";

import { FollowRequestInterface } from "@/types/FollowerUserInterface";
import { FollowRequestCard } from "./follow-request-card";
import { Skeleton } from "@/components/ui/skeleton";

interface FollowRequestsListProps {
	requests: FollowRequestInterface[];
	isLoading: boolean;
	onAccept: (requestId: string) => void;
	onReject: (requestId: string) => void;
}

function FollowRequestsSkeleton() {
	return (
		<div className="space-y-4">
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className="p-4 border rounded-lg">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<Skeleton className="h-12 w-12 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
						<div className="flex gap-2">
							<Skeleton className="h-8 w-20" />
							<Skeleton className="h-8 w-20" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

export function FollowRequestsList({ requests, isLoading, onAccept, onReject }: FollowRequestsListProps) {
	if (isLoading) {
		return <FollowRequestsSkeleton />;
	}

	if (requests.length === 0) {
		return <div className="text-center py-12 text-gray-500">Nenhum pedido para seguir.</div>;
	}

	return (
		<div className="space-y-4">
			{requests.map((request) => (
				<FollowRequestCard key={request.id} request={request} onAccept={onAccept} onReject={onReject} />
			))}
		</div>
	);
}
