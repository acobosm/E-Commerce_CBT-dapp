import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { CartProvider } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CBT Market | Store",
    description: "Tu marketplace descentralizado de confianza",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <CartProvider>
                    <div className="min-h-screen flex flex-col bg-gradient-mesh">
                        <Navbar />

                        <main className="flex-1">
                            {children}
                        </main>

                        <footer className="border-t border-white/5 py-12 bg-black/20 relative z-10">
                            <div className="container mx-auto px-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="h-8 w-8 relative flex items-center justify-center grayscale opacity-50">
                                            <Image src="/logo-cbt.png" alt="CBT" width={24} height={24} className="object-contain" />
                                        </div>
                                        <span className="text-sm font-medium">Powered by CBT - Blockchain E-Commerce Project © 2026</span>
                                    </div>
                                    <div className="flex gap-8">
                                        <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">Términos</Link>
                                        <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacidad</Link>
                                        <Link href="/support" className="text-xs text-muted-foreground hover:text-primary transition-colors">Soporte</Link>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </CartProvider>
            </body>
        </html>
    );
}
