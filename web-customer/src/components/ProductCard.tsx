"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Plus, Settings2 } from "lucide-react";
import React from "react";

export interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    stock: number;
    companyRuc: string;
    companyName: string;
    photos: string[];
    active: boolean;
    iva: number;
    isRestock?: boolean;
    isEdit?: boolean;
}

interface ProductCardProps {
    product: Product;
    isSeller: boolean;
    isAdmin: boolean;
    sellerRuc: string | null;
    onRestock: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    onEdit: (product: Product) => void;
    index: number;
}

export function ProductCard({
    product,
    isSeller,
    isAdmin,
    sellerRuc,
    onRestock,
    onAddToCart,
    onEdit,
    index
}: ProductCardProps) {
    const isOwnProduct = sellerRuc === product.companyRuc;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-4 group hover:bg-slate-900/60 transition-all"
        >
            <div className="aspect-square rounded-xl bg-white/5 overflow-hidden relative">
                {product.photos && product.photos[0] ? (
                    <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 group-hover:scale-110 transition-transform">
                        📦
                    </div>
                )}
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-red-500/80 text-white text-xs font-bold px-3 py-1 rounded-full italic">AGOTADO</span>
                    </div>
                )}
                {isSeller && isOwnProduct && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600/80 text-white text-[10px] font-black rounded-lg backdrop-blur-sm">
                        TU PRODUCTO
                    </div>
                )}
            </div>
            <div>
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold truncate text-base text-white group-hover:text-primary transition-colors" title={product.name}>{product.name}</h3>
                    <span className="text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded text-primary">CBT</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4 font-medium uppercase tracking-tight">Vendedor: {product.companyName}</p>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-white">${product.price}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">Stock: {product.stock}</span>
                    </div>
                    {!isAdmin || (isAdmin && !isOwnProduct) ? (
                        <div className="flex gap-2">
                            {isSeller && isOwnProduct ? (
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRestock(product);
                                    }}
                                    className="h-10 px-3 rounded-xl bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Reponer</span>
                                </motion.button>
                            ) : !isAdmin ? (
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    disabled={product.stock === 0}
                                    onClick={() => onAddToCart(product)}
                                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-lg ${isSeller
                                        ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20"
                                        : "bg-white text-black hover:bg-primary hover:text-primary-foreground"
                                        } disabled:opacity-30 disabled:grayscale`}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(product);
                                    }}
                                    className="h-10 px-4 rounded-xl bg-red-600 text-white flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-lg shadow-red-500/20"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Editar</span>
                                </motion.button>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}
