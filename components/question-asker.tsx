import { UserX } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/functions";
import type { PublicQuestion } from "@/lib/repositories/questions.repository";

type Asker = PublicQuestion["asked_by"];

/** `asker` é null em pergunta anônima: o servidor nem envia quem perguntou. */
export function AskerAvatar({ asker }: { asker: Asker }) {
	return (
		<Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
			{asker && <AvatarImage src={asker.avatar_url ?? undefined} alt={asker.name} />}
			<AvatarFallback className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
				{asker ? getInitials(asker.name) : <UserX className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
			</AvatarFallback>
		</Avatar>
	);
}

export function AskerName({ asker }: { asker: Asker }) {
	if (!asker) {
		return <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pergunta Anônima</span>;
	}

	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
			<span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
				{asker.name}
			</span>
			<Link
				href={`/${asker.nickname}`}
				className="text-sm font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 truncate"
			>
				@{asker.nickname}
			</Link>
		</div>
	);
}
