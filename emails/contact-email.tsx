import { Body, Container, Head, Heading, Html, Section, Text } from "@react-email/components";

interface ContactEmailProps {
	name: string;
	email: string;
	subject: string;
	message: string;
}

export function ContactEmail({ name, email, subject, message }: ContactEmailProps) {
	return (
		<Html>
			<Head />
			<Body style={{ fontFamily: "Arial, sans-serif", margin: 0, padding: 0 }}>
				<Container style={{ padding: "20px", maxWidth: "600px" }}>
					<Section style={{ marginBottom: "20px" }}>
						<Heading className="font-semibold text-[24px] text-indigo-400 leading-[32px]">
							Formulário de Contato do RespondeAe
						</Heading>
					</Section>
					<Section style={{ marginBottom: "10px" }}>
						<Text style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
							<strong>Nome:</strong> {name}
						</Text>
						<Text style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
							<strong>Email:</strong> {email}
						</Text>
						<Text style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
							<strong>Assunto:</strong> {subject}
						</Text>
						<Text style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
							<strong>Mensagem:</strong>
						</Text>
						<Text style={{ margin: "0", fontSize: "16px", whiteSpace: "pre-wrap" }}>{message}</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
