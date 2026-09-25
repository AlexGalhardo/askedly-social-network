import { Body, Button, Container, Head, Heading, Html, Link, Section, Text } from "@react-email/components";

interface ResetPasswordEmailProps {
	name: string;
	resetLink: string;
}

export function ResetPasswordEmail({ name, resetLink }: ResetPasswordEmailProps) {
	return (
		<Html>
			<Head />
			<Body style={{ fontFamily: "Arial, sans-serif", margin: 0, padding: 0, backgroundColor: "#f4f4f4" }}>
				<Container style={{ padding: "20px", maxWidth: "600px" }}>
					<Section style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "5px" }}>
						<Heading className="text-[24px] font-bold text-center">Recuperação de Senha</Heading>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>Olá {name},</Text>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							Recebemos uma solicitação para redefinir a senha da sua conta no Respondeae.com.br
						</Text>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							Se você não solicitou uma redefinição de senha, por favor ignore este email.
						</Text>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							Para redefinir sua senha, clique no botão abaixo:
						</Text>

						<Section style={{ textAlign: "center", margin: "30px 0" }}>
							<Button
								href={resetLink}
								style={{
									backgroundColor: "#4F46E5",
									color: "#ffffff",
									padding: "12px 20px",
									borderRadius: "5px",
									textDecoration: "none",
									fontWeight: "bold",
									fontSize: "16px",
								}}
							>
								Redefinir Senha
							</Button>
						</Section>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							Ou copie e cole o link abaixo no seu navegador:
						</Text>

						<Text style={{ fontSize: "14px", lineHeight: "1.5", color: "#4F46E5" }}>
							<Link href={resetLink} style={{ color: "#4F46E5", textDecoration: "none" }}>
								{resetLink}
							</Link>
						</Text>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							Este link é válido por 1 hora. Após esse período, você precisará solicitar uma nova
							redefinição de senha.
						</Text>
					</Section>

					<Text style={{ fontSize: "12px", color: "#666666", textAlign: "center", marginTop: "20px" }}>
						© 2025 Respondeae.com.br
					</Text>
				</Container>
			</Body>
		</Html>
	);
}
