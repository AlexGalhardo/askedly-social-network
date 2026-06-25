import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sistema em Manutenção",
	description: "O sistema está temporariamente indisponível para manutenção.",
	robots: "noindex, nofollow",
};

export default function OfflinePage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center text-white border border-white/20">
				<div className="text-6xl mb-6 animate-pulse">🔧</div>
				<h1 className="text-3xl font-bold mb-4">Sistema em Manutenção</h1>
				<p className="text-lg mb-6 opacity-90">
					Estamos realizando uma manutenção na plataforma. Voltaremos em breve!
				</p>
				<div className="bg-white/20 rounded-lg p-4">
					<div className="flex items-center justify-center mb-2">
						<div className="w-3 h-3 bg-red-400 rounded-full animate-pulse mr-2"></div>
						<span className="font-semibold">Status: Offline</span>
					</div>
					<p className="text-sm opacity-80">Última atualização: {new Date().toLocaleString("pt-BR")}</p>
				</div>
			</div>
		</div>
	);
}
