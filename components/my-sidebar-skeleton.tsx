import { Skeleton } from "@/components/ui/skeleton";

export function MySidebarSkeleton() {
	return (
		<div className="space-y-2 px-2 py-6">
			{Array.from({ length: 6 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders fixos de loading, nunca reordenados
				<div key={i} className="flex items-center space-x-3 p-3">
					<Skeleton className="h-5 w-5 rounded" />
					<Skeleton className="h-4 flex-1" />
				</div>
			))}
		</div>
	);
}
