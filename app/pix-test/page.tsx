"use client";

import { useState } from "react";
import TelegramLog from "@/lib/telegram-logger";
import { ABACATEPAY_API_KEY } from "../api/pix/create/route";

interface PixQrCodeData {
	id: string;
	amount: number;
	status: string;
	devMode: boolean;
	brCode: string;
	brCodeBase64: string;
	platformFee: number;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
}

interface PixQrCodeResponse {
	data: PixQrCodeData;
	error: string | null;
}

export default function PixQrCodePage() {
	const [qrData, setQrData] = useState<PixQrCodeData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createPixQrCode = async () => {
		setLoading(true);
		setError(null);

		const options = {
			method: "POST",
			headers: {
				Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount: 200,
				expiresIn: 600,
				description: "Payment description",
				customer: {
					name: "Respondeae PIX Test",
					cellphone: "(11) 4002-8922",
					email: "daniel_lima@abacatepay.com",
					taxId: "123.456.789-01",
				},
			}),
		};

		try {
			const response = await fetch("https://api.abacatepay.com/v1/pixQrCode/create", options);
			const result: PixQrCodeResponse = await response.json();

			if (result.error) {
				setError(result.error);
			} else {
				setQrData(result.data);
			}
		} catch (err: any) {
			await TelegramLog.error(`Error creating PIX QR code: ${err?.message}`);
			setError("Failed to create PIX QR code");
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(amount / 100);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString("pt-BR");
	};

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-2xl mx-auto">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">PIX QR Code Generator</h1>

					{!qrData && (
						<div className="text-center">
							<button
								onClick={createPixQrCode}
								disabled={loading}
								className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
							>
								{loading ? "Creating..." : "Generate PIX QR Code"}
							</button>
						</div>
					)}

					{error && (
						<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700">{error}</p>
						</div>
					)}

					{qrData && (
						<div className="mt-8">
							<div className="text-center mb-6">
								<img
									src={qrData.brCodeBase64}
									alt="PIX QR Code"
									className="mx-auto border-2 border-gray-200 rounded-lg"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="font-medium text-gray-600">Amount:</span>
										<span className="text-gray-900">{formatCurrency(qrData.amount)}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium text-gray-600">Status:</span>
										<span
											className={`px-2 py-1 rounded-full text-xs ${
												qrData.status === "PENDING"
													? "bg-yellow-100 text-yellow-800"
													: "bg-green-100 text-green-800"
											}`}
										>
											{qrData.status}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium text-gray-600">Platform Fee:</span>
										<span className="text-gray-900">{formatCurrency(qrData.platformFee)}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium text-gray-600">Dev Mode:</span>
										<span className="text-gray-900">{qrData.devMode ? "Yes" : "No"}</span>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="font-medium text-gray-600">ID:</span>
										<span className="text-gray-900 text-xs">{qrData.id}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium text-gray-600">Created:</span>
										<span className="text-gray-900 text-xs">{formatDate(qrData.createdAt)}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium text-gray-600">Expires:</span>
										<span className="text-gray-900 text-xs">{formatDate(qrData.expiresAt)}</span>
									</div>
								</div>
							</div>

							<div className="mt-6 p-4 bg-gray-50 rounded-lg">
								<h3 className="font-medium text-gray-900 mb-2">BR Code:</h3>
								<p className="text-xs text-gray-600 font-mono break-all">{qrData.brCode}</p>
							</div>

							<div className="mt-6 text-center">
								<button
									onClick={() => setQrData(null)}
									className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
								>
									Generate New QR Code
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
