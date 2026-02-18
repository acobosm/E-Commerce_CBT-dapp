"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import {
    LayoutDashboard,
    Building2,
    Package,
    FileText,
    Menu,
    X,
    Wallet,
    LogOut,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { account, connectWallet, isAdmin, loading, error } = useWeb3();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Compañías", href: "/companies", icon: Building2 },
        { name: "Productos", href: "/products", icon: Package },
        { name: "Facturas", href: "/invoices", icon: FileText },
    ];

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl fixed inset-y-0 left-0 z-50">
                <div className="h-16 flex items-center px-6 border-b border-border gap-3">
                    <div className="relative h-8 w-24 flex items-center justify-start">
                        <Image
                            src="/logo-cbt.png"
                            alt="CBT Logo"
                            width={96}
                            height={32}
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                                pathname === item.href
                                    ? "bg-primary/20 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-white"
                            )}
                        >
                            <item.icon className={cn("mr-3 h-5 w-5 transition-transform group-hover:scale-110", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs",
                            isAdmin ? "bg-gradient-to-br from-primary to-purple-600" : "bg-gradient-to-br from-gray-500 to-gray-700"
                        )}>
                            {isAdmin ? "AD" : "US"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{isAdmin ? "Administrador" : "Usuario"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {account ? `${account.substring(0, 6)}...${account.substring(38)}` : "No conectado"}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 md:hidden",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                    <span className="font-bold text-lg">MENU</span>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-lg",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
                <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
                    <div className="flex items-center md:hidden">
                        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="hidden md:flex items-center text-sm text-muted-foreground">
                        Dashboard de Gestión Blockchain v1.0
                    </div>

                    <div className="flex items-center gap-4">
                        {!account ? (
                            <Button onClick={connectWallet} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
                                <Wallet className="mr-2 h-4 w-4" /> Conectar Wallet
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium border",
                                    isAdmin ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                )}>
                                    {isAdmin ? "Admin Verificado" : "Acceso Restringido"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-6 relative overflow-hidden">
                    {/* Background Gradient Spotlights */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
