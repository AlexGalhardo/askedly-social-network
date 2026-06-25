"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoadingScreen() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-300">
			<motion.div
				animate={{ rotate: 360 }}
				transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
				className="mb-4"
			>
				<Loader2 className="w-10 h-10 animate-spin text-primary" />
			</motion.div>
			<p className="text-lg font-medium">Carregando...</p>
		</div>
	);
}
