"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, UserX } from "lucide-react";
import { getInitials } from "@/lib/functions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { FollowRequestInterface } from "@/types/FollowerUserInterface";
import { useAcceptFollowRequest, useRejectFollowRequest } from "@/hooks/use-follower";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import TelegramLog from "@/lib/telegram-logger";

interface FollowRequestCardProps {
	request: FollowRequestInterface;
	onAccept: (requestId: string) => void;
	onReject: (requestId: string) => void;
}

export function FollowRequestCard({ request, onAccept, onReject }: FollowRequestCardProps) {
	const acceptMutation = useAcceptFollowRequest();
	const rejectMutation = useRejectFollowRequest();
	const isMobile = useIsMobile();

	const handleAccept = async () => {
		try {
			await acceptMutation.mutateAsync(request.id);
			onAccept(request.id);
		} catch (error: any) {
			await TelegramLog.error(`Error follower-actions.ts ${error?.message}`);
			toast({
				title: "Erro ao aceitar solicitação",
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	const handleReject = async () => {
		try {
			await rejectMutation.mutateAsync(request.id);
			onReject(request.id);
		} catch (error: any) {
			await TelegramLog.error(`Error follower-actions.ts ${error?.message}`);
			toast({
				title: "Erro ao rejeitar solicitação",
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	return (
		<Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
							<AvatarImage src={request.sender.avatar_url || ""} alt={request.sender.name} />
							<AvatarFallback className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
								{getInitials(request.sender.name)}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="font-bold text-foreground">{request.sender.name}</p>
							<Link
								href={`/${request.sender.nickname}`}
								className="text-sm font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 truncate"
							>
								@{request.sender.nickname}
							</Link>
							{request.sender.description && (
								<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
									{request.sender.description}
								</p>
							)}
							<span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
								{formatDate(request.created_at)}
							</span>
						</div>
					</div>
					<div className="flex gap-2 ml-3">
						<Button
							onClick={handleAccept}
							size="sm"
							className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
							disabled={acceptMutation.isPending}
						>
							<UserCheck className="h-4 w-4" />
							{!isMobile && (
								<span className="ml-1">{acceptMutation.isPending ? "Aceitando..." : "Aceitar"}</span>
							)}
						</Button>
						<Button
							onClick={handleReject}
							variant="outline"
							size="sm"
							className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
							disabled={rejectMutation.isPending}
						>
							<UserX className="h-4 w-4" />
							{!isMobile && (
								<span className="ml-1">{rejectMutation.isPending ? "Rejeitando..." : "Rejeitar"}</span>
							)}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
