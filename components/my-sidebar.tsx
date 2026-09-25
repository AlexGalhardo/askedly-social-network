"use client";

import { isAfter, subDays } from "date-fns";
import {
	AlertCircle,
	Bell,
	CreditCard,
	FileText,
	Home,
	Info,
	LogIn,
	LogOut,
	Mail,
	Menu,
	Moon,
	Send,
	Settings,
	Shield,
	Sun,
	Trophy,
	User,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSessionVerification } from "@/hooks/use-session-verification";
import { MySidebarSkeleton } from "./my-sidebar-skeleton";

type SidebarItem = {
	icon: React.ElementType;
	label: string;
	href: string;
	active: boolean;
	badge?: string;
	requiresAuth?: boolean;
};

export function MySidebar() {
	const { session, isAuthenticated, isLoading, error, refetch } = useSessionVerification();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { theme, setTheme } = useTheme();
	const pathname = usePathname();

	const sidebarItems = useMemo((): SidebarItem[] => {
		const items: SidebarItem[] = [
			{
				icon: Home,
				label: "Feed",
				href: "/",
				active: pathname === "/",
				requiresAuth: false,
			},
			{
				icon: Trophy,
				label: "TOP 10 Curtidas",
				href: "/top-curtidas",
				active: pathname === "/top-curtidas",
				requiresAuth: true,
			},
		];

		if (isAuthenticated && session?.user) {
			let pendingQuestions = 0;

			try {
				if (Array.isArray(session.user.questions_received)) {
					console.log("session.user.questions_received -> ", session.user.questions_received);
					pendingQuestions = session.user.questions_received.filter((question) => {
						return (
							question &&
							typeof question === "object" &&
							"question_is_awaiting_answer" in question &&
							"question_answer_was_expired" in question &&
							"created_at" in question &&
							(question as any).question_is_awaiting_answer === true &&
							(question as any).question_answer_was_expired === false &&
							((question as any).question_answer_expired_at === null ||
								isAfter(new Date((question as any).created_at), subDays(new Date(), 7)))
						);
					}).length;
				}
			} catch {
				pendingQuestions = 0;
			}

			items.push(
				{
					icon: User,
					label: "Meu Perfil",
					href: `/${session.user.nickname}`,
					active: pathname === `/${session.user.nickname}`,
					requiresAuth: true,
				},
				{
					icon: Settings,
					label: "Minha Conta",
					href: "/minha-conta",
					active: pathname === "/minha-conta",
					requiresAuth: true,
				},
				{
					icon: Bell,
					label: "Perguntas Recebidas",
					href: "/perguntas-recebidas",
					active: pathname === "/perguntas-recebidas",
					badge: pendingQuestions > 0 ? pendingQuestions.toString() : undefined,
					requiresAuth: true,
				},
				{
					icon: Send,
					label: "Perguntas Enviadas",
					href: "/perguntas-enviadas",
					active: pathname === "/perguntas-enviadas",
					requiresAuth: true,
				},
				{
					icon: CreditCard,
					label: "Pagamentos",
					href: "/pagamentos",
					active: pathname === "/pagamentos",
					requiresAuth: true,
				},
				{
					icon: UserPlus,
					label: "Seguidores",
					href: "/seguidores",
					active: pathname === "/seguidores",
					requiresAuth: true,
				},
				{
					icon: Users,
					label: "Seguindo",
					href: "/seguindo",
					active: pathname === "/seguindo",
					requiresAuth: true,
				},
			);
		}

		return items;
	}, [isAuthenticated, session, pathname]);

	const legalItems: SidebarItem[] = [
		{ icon: Info, label: "Sobre", href: "/sobre", active: pathname === "/sobre", requiresAuth: false },
		{ icon: Mail, label: "Contato", href: "/contato", active: pathname === "/contato", requiresAuth: false },
		{
			icon: Shield,
			label: "Política de Privacidade",
			href: "/politica-de-privacidade",
			active: pathname === "/politica-de-privacidade",
			requiresAuth: false,
		},
		{
			icon: FileText,
			label: "Termos de Uso",
			href: "/termos-de-uso",
			active: pathname === "/termos-de-uso",
			requiresAuth: false,
		},
	];

	const handleSignOut = async () => {
		setSidebarOpen(false);
		await signOut({ callbackUrl: "/" });
	};

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
		setSidebarOpen(false);
	};

	const renderNavItems = (items: SidebarItem[], isMobile = false) => (
		<>
			{items.map((item) => (
				<Link key={item.label} href={item.href}>
					<Button
						variant={item.active ? "secondary" : "ghost"}
						className={`w-full justify-start h-12 ${
							item.active
								? "bg-foreground text-background font-bold hover:bg-black hover:text-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
								: ""
						}`}
						onClick={() => isMobile && setSidebarOpen(false)}
					>
						<item.icon className="mr-3 h-5 w-5" />
						<span className="flex-1 text-left">{item.label}</span>
						{item.badge && Number(item.badge) > 0 && (
							<Badge variant="destructive" className="ml-2">
								{item.badge}
							</Badge>
						)}
					</Button>
				</Link>
			))}
		</>
	);

	const renderAuthSection = (isMobile = false) => (
		<div className="p-4 border-t space-y-2 flex-shrink-0">
			<Button variant="ghost" className="w-full justify-start h-11" onClick={toggleTheme}>
				{theme === "light" ? <Moon className="mr-3 h-5 w-5" /> : <Sun className="mr-3 h-5 w-5" />}
				<span className="flex-1 text-left">{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
			</Button>

			{isAuthenticated ? (
				<Button
					onClick={handleSignOut}
					variant="ghost"
					className="w-full justify-start h-11 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
				>
					<LogOut className="mr-3 h-5 w-5" />
					<span className="flex-1 text-left">Sair</span>
				</Button>
			) : (
				<Link href="/entrar">
					<Button
						variant="ghost"
						className="w-full justify-start h-11 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950 font-bold"
						onClick={() => isMobile && setSidebarOpen(false)}
					>
						<LogIn className="mr-3 h-5 w-5" />
						<span className="flex-1 text-left">Entrar Na Minha Conta</span>
					</Button>
				</Link>
			)}
		</div>
	);

	const renderSidebarContent = (isMobile = false) => (
		<>
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<MySidebarSkeleton />
				) : error ? (
					<div className="px-4 py-6">
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								Erro ao carregar dados da sessão.{" "}
								<Button
									variant="link"
									className="p-0 h-auto text-destructive underline"
									onClick={() => refetch()}
								>
									Tentar novamente
								</Button>
							</AlertDescription>
						</Alert>
					</div>
				) : (
					<>
						<nav className={`${isMobile ? "px-4" : "px-2"} py-6 space-y-2`}>
							{renderNavItems(sidebarItems, isMobile)}
						</nav>

						<hr className="mx-4 border-border" />

						<div className={`${isMobile ? "px-4" : "px-2"} py-2 space-y-2`}>
							{renderNavItems(legalItems, isMobile)}
						</div>
					</>
				)}
			</div>

			{renderAuthSection(isMobile)}
		</>
	);

	return (
		<>
			<header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex h-full items-center justify-between px-4">
					<Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
						<Menu className="h-5 w-5" />
					</Button>

					<div className="flex items-center space-x-2">
						<Image
							src="https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"
							alt="RespondeAê"
							width={32}
							height={32}
							className="rounded-lg"
						/>
						<span className="text-xl font-bold">RespondeAê</span>
					</div>

					<div className="flex items-center space-x-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setTheme(theme === "light" ? "dark" : "light")}
						>
							{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
						</Button>
					</div>
				</div>
			</header>

			<aside
				className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-80 lg:border-r lg:bg-background lg:z-40"
				style={{ left: "calc(50% - 600px)" }}
			>
				<div className="flex flex-col h-full">
					<div className="flex items-center h-16 px-6 border-b flex-shrink-0">
						<div className="flex items-center space-x-3">
							<Image
								src="https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"
								alt="RespondeAê"
								width={40}
								height={40}
								className="rounded-lg"
							/>
							<span className="text-2xl font-bold">RespondeAê</span>
						</div>
					</div>

					{renderSidebarContent()}
				</div>
			</aside>

			{sidebarOpen && (
				<div className="lg:hidden fixed inset-0 z-50 flex">
					<button
						type="button"
						aria-label="Fechar menu"
						className="fixed inset-0 bg-black/20 cursor-default"
						onClick={() => setSidebarOpen(false)}
					/>
					<aside className="relative flex w-80 h-full flex-col bg-background border-r">
						<div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
							<div className="flex items-center space-x-3">
								<Image
									src="https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct"
									alt="RespondeAê"
									width={32}
									height={32}
									className="rounded-lg"
								/>
							</div>
							<Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
								<X className="h-5 w-5" />
							</Button>
						</div>

						{renderSidebarContent(true)}
					</aside>
				</div>
			)}
		</>
	);
}
