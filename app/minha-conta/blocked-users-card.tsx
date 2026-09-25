"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import TelegramLog from "@/lib/telegram-logger";

export default function BlockedUsersCard() {
	const { data: session, update } = useSession();
	const [blockedUsers, setBlockedUsers] = useState<any[]>(session?.user?.blocked_users || []);
	const [unblockingUsers, setUnblockingUsers] = useState<Set<string>>(new Set());
	const [isOpen, setIsOpen] = useState(false);

	const handleUnblockUser = async (targetUserNickname: string, userId: string) => {
		if (unblockingUsers.has(userId)) return;

		setUnblockingUsers((prev) => new Set([...prev, userId]));

		try {
			const response = await fetch("/api/user/unblock", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					targetUserNickname,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Erro ao desbloquear usuário");
			}

			setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));

			await update();

			toast({
				title: "Usuário Desbloqueado",
				variant: "success",
			});
		} catch (error: any) {
			await TelegramLog.error(`Error blocked-users-card.ts handleUnblockUser: ${error?.message}`);
			toast({
				title: "Erro ao desbloquear usuário",
				variant: "error",
			});
		} finally {
			setUnblockingUsers((prev) => {
				const newSet = new Set(prev);
				newSet.delete(userId);
				return newSet;
			});
		}
	};

	return (
		<div className="w-full mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
				aria-expanded={isOpen}
			>
				<div className="flex items-center gap-2">
					<span className="font-medium text-gray-900">Usuários Bloqueados</span>
					<span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
						{blockedUsers.length}
					</span>
				</div>
				<svg
					aria-hidden="true"
					className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isOpen && (
				<div className="border-t border-gray-200">
					{blockedUsers.length === 0 ? (
						<div className="px-4 py-6 text-center text-gray-500">
							<svg
								aria-hidden="true"
								className="w-12 h-12 mx-auto mb-3 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"
								/>
							</svg>
							<p className="text-sm">Nenhum usuário bloqueado</p>
						</div>
					) : (
						<div className="divide-y divide-gray-100">
							{blockedUsers.map((user) => (
								<div
									key={user.id}
									className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
											{user?.blocked?.avatar_url ? (
												<img
													src={user?.blocked?.avatar_url}
													alt={`Avatar de ${user?.blocked?.name}`}
													className="w-full h-full object-cover"
												/>
											) : (
												<span className="text-gray-500 text-sm font-medium">
													{user?.blocked?.name?.charAt(0).toUpperCase()}
												</span>
											)}
										</div>
										<div>
											<p className="font-medium text-gray-900 text-sm">{user.blocked?.name}</p>
											<p className="text-gray-500 text-xs">@{user.blocked?.nickname}</p>
										</div>
									</div>

									<button
										type="button"
										onClick={() => handleUnblockUser(user?.blocked?.nickname, user?.blocked?.id)}
										disabled={unblockingUsers.has(user?.blocked?.id)}
										className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{unblockingUsers.has(user?.blocked?.id) ? (
											<div className="flex items-center gap-1">
												<svg
													aria-hidden="true"
													className="w-3 h-3 animate-spin"
													viewBox="0 0 24 24"
												>
													<circle
														className="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														strokeWidth="4"
														fill="none"
													/>
													<path
														className="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													/>
												</svg>
												Desbloqueando...
											</div>
										) : (
											"Desbloquear"
										)}
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
