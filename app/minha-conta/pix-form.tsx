"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdatePixKey } from "@/hooks/use-account-mutations";

interface PixFormProps {
	initialPixKey?: string;
}

export function PixForm({ initialPixKey }: PixFormProps) {
	const [isPending, startTransition] = useTransition();
	const updatePixKeyMutation = useUpdatePixKey();
	const [pixKey, setPixKey] = useState(initialPixKey || "");

	const handleSubmit = (formData: FormData) => {
		startTransition(() => {
			updatePixKeyMutation.mutate(formData);
		});
	};

	const isLoading = isPending || updatePixKeyMutation.isPending;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Dados de Pagamento</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="pix-key">
							Chave PIX <small className="text-gray-400">(necessário para receber pagamentos)</small>
						</Label>
						<p className="text-sm text-orange-600 font-medium">
							⚠️ Importante: É necessário inserir sua chave PIX para receber os pagamentos.
						</p>
						<Input
							id="pix-key"
							name="pixKey"
							value={pixKey}
							minLength={11}
							maxLength={128}
							onChange={(e) => setPixKey(e.target.value)}
							placeholder="Digite sua chave PIX (CPF, email, telefone ou chave aleatória)"
							required
						/>
					</div>

					<Button
						type="submit"
						disabled={isLoading}
						className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 dark:from-gray-200 dark:to-gray-100 dark:hover:from-gray-300 dark:hover:to-gray-200 text-white dark:text-black"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Atualizando...
							</>
						) : (
							"Atualizar Chave PIX"
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
