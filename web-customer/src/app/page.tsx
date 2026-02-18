"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWeb3 } from "@/hooks/useWeb3";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ShoppingCart, ArrowRight, Wallet, CreditCard, ShoppingBag, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard, Product } from "@/components/ProductCard";

export default function Home() {
    const { addToCart } = useCart();
    const { connectWallet, account, contract, isSeller, isAdmin, sellerRuc } = useWeb3();
    const [latestProducts, setLatestProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchLatest = async () => {
            if (!contract) return;
            try {
                const nextId = await contract.nextProductId();
                const total = Number(nextId);
                const loaded: Product[] = [];

                // Get last 4 products (or as many as available)
                const start = Math.max(1, total - 4);

                const companyCache: Record<string, string> = {};

                for (let i = start; i < total; i++) {
                    const p = await contract.products(i);
                    if (p.isActive) {
                        if (!companyCache[p.companyRuc]) {
                            const company = await contract.companies(p.companyRuc);
                            companyCache[p.companyRuc] = company.name || "Vendedor Verificado";
                        }

                        // Fetch photos explicitly
                        let photos: string[] = [];
                        try {
                            const photoData = await contract.getProductPhotos(i);
                            photos = Array.from(photoData);
                        } catch (err) {
                            console.warn(`Could not load photos for product ${i}`, err);
                        }

                        loaded.push({
                            id: i,
                            name: p.name,
                            description: p.description || "",
                            price: ethers.formatUnits(p.price_1, 6),
                            stock: Number(p.stock),
                            companyRuc: p.companyRuc,
                            companyName: companyCache[p.companyRuc],
                            photos: photos,
                            active: p.isActive,
                            iva: Number(p.iva)
                        });
                    }
                }
                setLatestProducts(loaded.reverse());
            } catch (e) {
                console.error("Error fetching latest products", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLatest();
    }, [contract]);

    return (
        <div className="flex flex-col gap-20 pb-20">
            {/* Hero Section */}
            <section className="relative py-32 flex flex-col items-center justify-center text-center overflow-hidden">
                {/* ... (Hero content remains unchanged, keeping it for context but implementing ProductCard below) ... */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0,transparent_70%)]" />
                </div>

                <div className="container relative z-10 mx-auto px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter mb-8 text-white"
                    >
                        EL FUTURO DEL <br />
                        <span className="text-primary italic">E-COMMERCE</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 font-medium"
                    >
                        Adquiere productos exclusivos pagando con su stablecoin favorita. <br />
                        Seguro, rápido y 100% descentralizado.
                    </motion.p>
                    <div className="flex flex-wrap justify-center gap-6 relative z-20">
                        <Link href="/products" className="h-14 px-10 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-all flex items-center justify-center shadow-xl shadow-white/10 cursor-pointer">
                            Explorar Catálogo
                        </Link>
                        <a href="#how-it-works" className="h-14 px-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-lg font-medium flex items-center justify-center cursor-pointer text-white">
                            Cómo funciona
                        </a>
                    </div>
                </div>
            </section>

            {/* Recién Llegados Section */}
            <section className="container mx-auto px-4">
                <div className="flex flex-col gap-12">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-white">Recién Llegados</h2>
                            <p className="text-muted-foreground">Las últimas incorporaciones a nuestro marketplace descentralizado.</p>
                        </div>
                        <Link href="/products" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                            Ver catálogo completo <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
                            <Loader2 className="animate-spin w-8 h-8" />
                            Cargando novedades...
                        </div>
                    ) : latestProducts.length === 0 ? (
                        <div className="h-64 flex items-center justify-center glass-card rounded-3xl border-dashed">
                            <p className="text-muted-foreground italic">Pronto tendremos nuevos productos para ti.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">
                                {latestProducts.map((product, idx) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        isSeller={isSeller}
                                        isAdmin={isAdmin}
                                        sellerRuc={sellerRuc}
                                        index={idx}
                                        onRestock={() => { }} // No restock on Home
                                        onAddToCart={(p) => setPendingProduct(p)}
                                        onEdit={() => { }} // No edit on Home
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </section>

            {/* How it works Section */}
            <section id="how-it-works" className="container mx-auto px-4 py-20 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-white">¿Cómo comprar?</h2>
                    <p className="text-white/50 max-w-2xl mx-auto">Sigue estos tres simples pasos para empezar a operar en CBT Market.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Paso 1 */}
                    <div className="glass-card rounded-3xl p-8 flex flex-col gap-6 group hover:border-primary/50 transition-all">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">01. Conecta tu Wallet</h3>
                            <p className="text-white/60 text-sm leading-relaxed mb-6">Usa MetaMask para entrar de forma segura y descentralizada a nuestra red.</p>
                            <button
                                onClick={connectWallet}
                                className="text-xs font-bold text-primary flex items-center gap-2 hover:gap-3 transition-all"
                            >
                                {account ? "Wallet Conectada" : "Conectar ahora"} <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Paso 2 */}
                    <div className="glass-card rounded-3xl p-8 flex flex-col gap-6 group hover:border-primary/50 transition-all">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <CreditCard className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">02. Obtén CBTokens</h3>
                            <p className="text-white/60 text-sm leading-relaxed mb-6">Nuestra pasarela de pago te permite comprar CBT con tu tarjeta de crédito favorita.</p>
                            <a
                                href="http://localhost:6001"
                                target="_blank"
                                className="text-xs font-bold text-primary flex items-center gap-2 hover:gap-3 transition-all"
                            >
                                Ir a la pasarela <ArrowRight className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* Paso 3 */}
                    <div className="glass-card rounded-3xl p-8 flex flex-col gap-6 group hover:border-primary/50 transition-all">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">03. ¡Haz tu pedido!</h3>
                            <p className="text-white/60 text-sm leading-relaxed mb-6">Elige entre miles de productos y paga al instante con tus tokens de forma segura.</p>
                            <Link
                                href="/products"
                                className="text-xs font-bold text-primary flex items-center gap-2 hover:gap-3 transition-all"
                            >
                                Ir a productos <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Add to Cart Modal */}
            <AnimatePresence>
                {pendingProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-white/10 max-w-sm w-full p-8 rounded-3xl shadow-2xl"
                        >
                            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <ShoppingCart className="w-8 h-8 text-primary" />
                            </div>

                            <h3 className="text-xl font-bold text-center mb-2 text-white">
                                ¿Añadir al Carrito?
                            </h3>

                            <p className="text-sm text-muted-foreground text-center mb-8">
                                El producto <span className="text-white font-bold">{pendingProduct.name}</span> se va a agregar al carrito. ¿Deseas continuar?
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPendingProduct(null)}
                                    className="flex-1 h-12 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-bold text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={isProcessing}
                                    onClick={() => {
                                        addToCart(pendingProduct);
                                        setPendingProduct(null);
                                    }}
                                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
