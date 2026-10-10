import { Body, Button, Container, Head, Heading, Html, Link, Section, Text } from "@react-email/components";
import { createTranslator } from "next-intl";
import type { EmailTranslator } from "@/lib/email";
import en from "@/messages/en";

interface ResetPasswordEmailProps {
	name: string;
	resetLink: string;
	/** Sem tradutor o email sai no idioma padrão (inglês). */
	t?: EmailTranslator;
}

export function ResetPasswordEmail({
	name,
	resetLink,
	t = createTranslator({ locale: "en", messages: en, namespace: "emails" }),
}: ResetPasswordEmailProps) {
	return (
		<Html>
			<Head />
			<Body style={{ fontFamily: "Arial, sans-serif", margin: 0, padding: 0, backgroundColor: "#f4f4f4" }}>
				<Container style={{ padding: "20px", maxWidth: "600px" }}>
					<Section style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "5px" }}>
						<Heading className="text-[24px] font-bold text-center">{t("resetPassword.heading")}</Heading>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							{t("resetPassword.greeting", { name })}
						</Text>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							{t("resetPassword.intro")}
						</Text>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							{t("resetPassword.ignore")}
						</Text>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							{t("resetPassword.instruction")}
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
								{t("resetPassword.button")}
							</Button>
						</Section>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							{t("resetPassword.copyLink")}
						</Text>

						<Text style={{ fontSize: "14px", lineHeight: "1.5", color: "#4F46E5" }}>
							<Link href={resetLink} style={{ color: "#4F46E5", textDecoration: "none" }}>
								{resetLink}
							</Link>
						</Text>

						<Text style={{ fontSize: "16px", lineHeight: "1.5", color: "#333333" }}>
							{t("resetPassword.expiry")}
						</Text>
					</Section>

					<Text style={{ fontSize: "12px", color: "#666666", textAlign: "center", marginTop: "20px" }}>
						© 2025 Askedly Social Network
					</Text>
				</Container>
			</Body>
		</Html>
	);
}
