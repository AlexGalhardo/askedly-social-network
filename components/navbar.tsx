import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
	return (
		<nav className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<Link
					href="/feed"
					className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent"
				>
					RespondeAê
				</Link>

				<div className="flex items-center gap-4">
					<Button
						className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700"
						asChild
					>
						<Link href="/entrar">Entrar</Link>
					</Button>
				</div>
			</div>
		</nav>
	);
}
