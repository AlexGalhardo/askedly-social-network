export interface UploadResult {
	success: boolean;
	url?: string;
	error?: string;
}

export async function uploadImage(file: File, type: "avatar" | "banner", userId: string): Promise<UploadResult> {
	try {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", type);
		formData.append("userId", userId);

		const response = await fetch("/api/upload/image", {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			return {
				success: false,
				error: errorData.error ?? "Erro no upload da imagem",
			};
		}

		const data = await response.json();
		return {
			success: true,
			url: data.url,
		};
	} catch (error: any) {
		console.error("Erro no upload:", error);
		return {
			success: false,
			error: "Erro de conexão durante o upload",
		};
	}
}

export function validateImageFile(
	file: File,
	maxSizeBytes: number = 5 * 1024 * 1024,
): { valid: boolean; error?: string } {
	if (!file.type.startsWith("image/")) {
		return {
			valid: false,
			error: "Apenas arquivos de imagem são permitidos",
		};
	}

	if (file.size > maxSizeBytes) {
		const maxSizeMB = maxSizeBytes / (1024 * 1024);
		return {
			valid: false,
			error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
		};
	}

	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	if (!allowedTypes.includes(file.type)) {
		return {
			valid: false,
			error: "Formato não suportado. Use JPG, PNG ou WebP",
		};
	}

	return { valid: true };
}

export function resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		img.onload = () => {
			let { width, height } = img;

			if (width > height) {
				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}
			} else {
				if (height > maxHeight) {
					width = (width * maxHeight) / height;
					height = maxHeight;
				}
			}

			canvas.width = width;
			canvas.height = height;

			ctx?.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						const resizedFile = new File([blob], file.name, {
							type: file.type,
							lastModified: Date.now(),
						});
						resolve(resizedFile);
					} else {
						reject(new Error("Erro ao redimensionar imagem"));
					}
				},
				file.type,
				quality,
			);
		};

		img.onerror = () => reject(new Error("Erro ao carregar imagem"));
		img.src = URL.createObjectURL(file);
	});
}

/**
 * Cria um preview da imagem
 */
export function createImagePreview(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			if (e.target?.result) {
				resolve(e.target.result as string);
			} else {
				reject(new Error("Erro ao criar preview"));
			}
		};

		reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
		reader.readAsDataURL(file);
	});
}
