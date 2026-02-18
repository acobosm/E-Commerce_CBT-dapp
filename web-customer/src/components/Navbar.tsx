"use client";

import { useWeb3 } from "@/hooks/useWeb3";
import { ShoppingCart, LayoutDashboard, Store, Wallet, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useState } from "react";

export function Navbar() {
    const { account, connectWallet, loading, isAdmin, isCommerce, isSeller } = useWeb3();
    const { cartCount } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Inicio", icon: <Store className="w-4 h-4" /> },
        { href: "/products", label: "Productos", icon: <LayoutDashboard className="w-4 h-4" /> },
        { href: "/cart", label: "Carrito", icon: <ShoppingCart className="w-4 h-4" />, badge: cartCount },
        { href: "/orders", label: "Mis Pedidos", icon: <User className="w-4 h-4" /> },
    ];

    // Add Seller Dashboard link if the user is a registered company
    if (isSeller) {
        navLinks.push({
            href: "/seller",
            label: "Panel Vendedor",
            icon: <LayoutDashboard className="w-4 h-4 text-primary" />
        });
    }

    return (
        <header className="sticky top-0 z-[100] bg-black/90 backdrop-blur-xl border-b border-white/5">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="relative h-12 w-24 flex items-center justify-start">
                        <Image
                            src="/logo-cbt.png"
                            alt="CBT Logo"
                            width={96}
                            height={48}
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <nav className="flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-colors relative"
                            >
                                {link.icon}
                                {link.label}
                                {link.badge !== undefined && link.badge > 0 && (
                                    <span className="absolute -top-2 -right-3 h-4 min-w-[16px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <div className="px-3 py-1 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="text-red-400 font-black text-[10px] uppercase tracking-tighter">ADMIN</span>
                            </div>
                        )}
                        {(isCommerce || isSeller) && !isAdmin && (
                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/50 rounded-lg flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-blue-400 font-black text-[10px] uppercase tracking-tighter">CORP</span>
                            </div>
                        )}
                        <button
                            onClick={connectWallet}
                            disabled={loading}
                            className="h-10 px-6 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all shadow-lg shadow-white/5 disabled:opacity-50"
                        >
                            <Wallet className="w-4 h-4" />
                            {loading ? "Conectando..." : account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Conectar Wallet"}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden items-center gap-4">
                    {cartCount > 0 && (
                        <Link href="/cart" className="relative p-2 text-white/70">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        </Link>
                    )}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-white/70 hover:text-white transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/5 bg-black/95 overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white font-medium"
                                >
                                    <div className="text-primary">{link.icon}</div>
                                    {link.label}
                                    {link.badge !== undefined && link.badge > 0 && (
                                        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {link.badge} items
                                        </span>
                                    )}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    connectWallet();
                                    setIsMenuOpen(false);
                                }}
                                disabled={loading}
                                className="w-full h-14 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 mt-4"
                            >
                                <Wallet className="w-5 h-5" />
                                {loading ? "Conectando..." : account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Conectar Wallet"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
