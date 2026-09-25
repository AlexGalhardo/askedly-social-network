"use client";

import { DollarSign, MessageCircle, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SobreClient() {
	const { data: session } = useSession();

	return (
		<div className="p-4 lg:p-6">
			<div className="space-y-6 max-w-4xl">
				<Card>
					<CardContent className="p-8 text-center">
						<h2 className="text-3xl font-bold text-foreground mb-4">
							Receba Perguntas, Monetize suas Respostas.
						</h2>
						<p className="text-lg text-muted-foreground mb-6">
							Somos uma rede social de perguntas e respostas pagas. Aqui, você pode fazer perguntas
							públicas, privadas e anônimas para pessoas que você tem interesse. Seja para buscar
							conselhos, troca de conhecimento e experiências, ou por curiosidade.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<h3 className="text-xl font-bold text-foreground mb-6 text-center">RespondeAê em Números</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
							<div>
								<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">1K+</div>
								<div className="text-sm text-muted-foreground">Usuários Ativos</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">10K+</div>
								<div className="text-sm text-muted-foreground">Perguntas Respondidas</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
									R$ 10K+
								</div>
								<div className="text-sm text-muted-foreground">Pagos aos Usuários</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">10k+</div>
								<div className="text-sm text-muted-foreground">De curtidas nas respostas</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<h3 className="text-2xl font-bold text-foreground mb-6">Como Funciona</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<div className="text-center">
								<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
									<Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
								</div>
								<h4 className="font-bold text-foreground mb-2">1. Cadastre-se</h4>
								<p className="text-sm text-muted-foreground">
									Crie sua conta, configure sua chave pix, suas configurações de privacidade e seu
									perfil público.
								</p>
							</div>
							<div className="text-center">
								<div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
									<MessageCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
								</div>
								<h4 className="font-bold text-foreground mb-2">2. Faça Perguntas</h4>
								<p className="text-sm text-muted-foreground">
									Faça perguntas pagando um valor que você considera justo pela resposta que espera
									receber.
								</p>
							</div>
							<div className="text-center">
								<div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
									<DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
								</div>
								<h4 className="font-bold text-foreground mb-2">3. Responda e Ganhe</h4>
								<p className="text-sm text-muted-foreground">
									Responda perguntas e receba pagamentos pelas suas respostas.
								</p>
							</div>
							<div className="text-center">
								<div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
									<Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
								</div>
								<h4 className="font-bold text-foreground mb-2">4. Avalie</h4>
								<p className="text-sm text-muted-foreground">
									Curta respostas que gerou valor, reporte perguntas e respotas problemáticas e ajude
									a melhorar nossa comunidade.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{!session && (
					<Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
						<CardContent className="p-8 text-center">
							<h3 className="text-2xl font-bold text-foreground mb-4">Pronto para começar?</h3>
							<p className="text-muted-foreground mb-6">
								Junte-se à nossa comunidade e comece a compartilhar seu conhecimento, experiências e
								curiosidades com pessoas interessadas em saber o que você tem a dizer.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Button asChild className="bg-green-600 hover:bg-green-700 text-white">
									<Link href="/criar-conta">Crie sua conta gratuitamente</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
