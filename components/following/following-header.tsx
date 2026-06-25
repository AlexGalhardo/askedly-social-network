interface FollowingHeaderProps {
	count: number;
}

export function FollowingHeader({ count }: FollowingHeaderProps) {
	return <h2 className="text-xl font-bold text-foreground mb-4">Você está seguindo {count} pessoas</h2>;
}
