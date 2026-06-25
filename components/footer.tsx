import Link from "next/link";

export function Footer() {
	return (
		<footer className="border-t bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col md:flex-row justify-between items-center">
					<div className="text-sm text-gray-500 mb-4 md:mb-0">
						© 2024 RespondeAê. Todos os direitos reservados.
					</div>

					<div className="flex items-center gap-6 text-sm text-gray-600">
						<Link href="/privacy" className="hover:text-blue-600 transition-colors">
							Política de Privacidade
						</Link>
						<Link href="/terms" className="hover:text-blue-600 transition-colors">
							Termos de Uso
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
