"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function PoliticaDePrivacidadeClient() {
	return (
		<main className="p-4 lg:p-6">
			<Card className="border-none">
				<CardContent className="p-6 prose prose-gray dark:prose-invert max-w-none">
					<p className="text-muted-foreground mb-6">Última atualização: 15 de junho de 2025</p>

					<h2 className="text-xl font-bold text-foreground mb-4">1. Informações que Coletamos</h2>
					<p className="mb-6">
						Coletamos apenas os dados essenciais para o funcionamento da plataforma. Isso inclui nome,
						email, nickname e, no caso de login com o Google, a URL do avatar do perfil. Também armazenamos
						a chave PIX informada pelo usuário em suas configurações, utilizada exclusivamente para fins de
						recebimento de pagamentos. Além disso, coletamos informações inseridas voluntariamente no perfil
						público, como descrição, website e redes sociais (Instagram, Facebook, YouTube, Twitch,
						LinkedIn, TikTok).
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">2. Como Usamos suas Informações</h2>
					<p className="mb-6">
						Utilizamos suas informações para oferecer e aprimorar nossos serviços, personalizar sua
						experiência, comunicar com você sobre sua conta e exibir publicamente apenas os dados que você
						escolheu tornar visíveis no seu perfil.
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">3. Compartilhamento de Informações</h2>
					<p className="mb-4">
						Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando
						há necessidade de cumprimento a obrigações legais.
					</p>
					<p className="mb-6">
						Usamos ferramentas como Google Analytics e Microsoft Clarity para entender o comportamento dos
						usuários na plataforma, incluindo métricas de navegação e interação. Esses dados são utilizados
						para melhorias contínuas na experiência da plataforma, segurança e estratégias de marketing.
						Mais informações sobre como a Microsoft coleta e usa seus dados podem ser encontradas na{" "}
						<a
							href="https://www.microsoft.com/pt-br/privacy/privacystatement"
							target="_blank"
							className="text-blue-600 underline"
							rel="noopener"
						>
							Declaração de Privacidade da Microsoft
						</a>
						.
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">4. Segurança</h2>
					<p className="mb-6">
						Adotamos medidas técnicas e organizacionais apropriadas para proteger seus dados pessoais contra
						acesso não autorizado, alteração, divulgação ou destruição.
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">5. Seus Direitos</h2>
					<p className="mb-6">
						Conforme a LGPD (Lei Geral de Proteção de Dados), você tem o direito de acessar, corrigir ou
						excluir seus dados pessoais. É possível, também, configurar quais informações deseja exibir
						publicamente no seu perfil. Você pode excluir sua conta a qualquer momento. Após 30 dias de
						desativação, caso não seja reativada, todos os dados relacionados à conta serão permanentemente
						removidos da plataforma.
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">6. Contato</h2>
					<p className="mb-4">
						Caso tenha dúvidas, solicitações ou queira exercer seus direitos de privacidade, entre em
						contato com nossa equipe no <a href="/contato">formulário de contato</a>
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
