"use client";

import { useWeb3 } from "@/hooks/useWeb3";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShoppingCart, LayoutDashboard, Store, Wallet, User, Menu, X, PackageX, Plus, Loader2, Settings2, PlusCircle } from "lucide-react";
import { ProductCard, Product } from "@/components/ProductCard";

export default function ProductsPage() {
    const { contract, loading: web3Loading, isAdmin, isCommerce, account, isSeller, sellerRuc } = useWeb3();
    const { addToCart } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!contract) return;

            try {
                setLoading(true);
                const totalProducts = await contract.nextProductId();
                const loadedProducts: Product[] = [];

                const companyCache: Record<string, string> = {};

                for (let i = 1; i < Number(totalProducts); i++) {
                    try {
                        const p = await contract.products(i);
                        if (p.name && p.isActive) {
                            if (!companyCache[p.companyRuc]) {
                                const company = await contract.companies(p.companyRuc);
                                companyCache[p.companyRuc] = company.name || "Vendedor Verificado";
                            }

                            // Fetch photos explicitly as they are not returned by the mapping getter
                            let photos = [];
                            try {
                                const photoData = await contract.getProductPhotos(i);
                                photos = Array.from(photoData);
                            } catch (err) {
                                console.warn(`Could not load photos for product ${i}`, err);
                            }

                            loadedProducts.push({
                                id: i,
                                name: p.name,
                                description: p.description,
                                price: ethers.formatUnits(p.price_1, 6),
                                stock: Number(p.stock),
                                companyRuc: p.companyRuc,
                                companyName: companyCache[p.companyRuc],
                                photos: photos,
                                active: p.isActive,
                                iva: Number(p.iva)
                            });
                        }
                    } catch (e) {
                        console.error(`Error loading product ${i}`, e);
                    }
                }
                setProducts(loadedProducts);
            } catch (err) {
                console.error("Error fetching products:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [contract]);

    const handleRestock = async (productId: number, amount: number) => {
        if (!contract) return;
        try {
            setIsProcessing(true);
            const tx = await contract.buyStock(productId, amount);
            await tx.wait();
            alert("Stock actualizado exitosamente");
            setPendingProduct(null);
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            alert("Error al actualizar stock: " + (error.reason || error.message));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateProduct = async (productData: any) => {
        if (!contract) return;
        try {
            setIsProcessing(true);
            const priceUnits = ethers.parseUnits(productData.price, 6);
            // Asegurar que el array de fotos tenga exactamente 4 elementos (Fixed Array string[4] en Solidity)
            const photoArray = Array.isArray(productData.photos) ? productData.photos : [];
            const fixedPhotos = ["", "", "", ""];
            for (let i = 0; i < 4; i++) {
                fixedPhotos[i] = photoArray[i] || "";
            }

            const tx = await contract.updateProduct(
                productData.id,
                productData.name,
                fixedPhotos,
                priceUnits,
                productData.iva,
                productData.active
            );
            await tx.wait();
            alert("Producto actualizado exitosamente");
            setPendingProduct(null);
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            alert("Error al actualizar producto: " + (error.reason || error.message));
        } finally {
            setIsProcessing(false);
        }
    };

    const myProducts = products.filter(p => p.companyRuc === sellerRuc);
    const otherProducts = products.filter(p => p.companyRuc !== sellerRuc);

    if (web3Loading || loading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="animate-pulse text-xl text-muted-foreground font-medium text-white/50">Sincronizando con la Blockchain...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Nuestro Catálogo</h1>
                    <p className="text-muted-foreground">Explora productos exclusivos de vendedores verificados.</p>
                </div>

                {isAdmin && (
                    <div className="px-6 py-3 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 shadow-lg shadow-red-500/10">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                        <div>
                            <p className="text-red-400 font-black text-xs uppercase tracking-widest">Modo Administrador</p>
                            <p className="text-slate-500 text-[10px] font-bold">VISTA DE SOLO LECTURA</p>
                        </div>
                    </div>
                )}

                {isCommerce && (
                    <div className="px-6 py-3 bg-blue-500/10 border border-blue-500/50 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-500/10">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <div>
                            <p className="text-blue-400 font-black text-xs uppercase tracking-widest">Modo Reabastecimiento</p>
                            <p className="text-slate-500 text-[10px] font-bold">GESTIÓN DE STOCK CORPORATIVO</p>
                        </div>
                    </div>
                )}
            </motion.div>

            {products.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-3xl p-20 text-center"
                >
                    <PackageX className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h2 className="text-2xl font-bold mb-2 text-white">No hay productos disponibles</h2>
                    <p className="text-muted-foreground">Vuelve más tarde para ver nuevas ofertas.</p>
                </motion.div>
            ) : isSeller ? (
                <div className="space-y-12">
                    {/* MY PRODUCTS SECTION */}
                    <div>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <LayoutDashboard className="w-6 h-6 text-primary" /> Mis Productos
                                </h2>
                                <p className="text-muted-foreground text-sm mt-1">Gestiona tu catálogo personal.</p>
                            </div>
                            <Link href="/seller" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
                                <PlusCircle className="w-4 h-4" /> Gestionar en Panel
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* CREATE NEW CARD */}
                            <Link href="/seller" className="bg-primary/5 hover:bg-primary/10 border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group transition-all h-full min-h-[350px]">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-primary" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">Nuevo Producto</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Añadir al catálogo global</p>
                                </div>
                            </Link>

                            {/* MY PRODUCTS LIST */}
                            <AnimatePresence mode="popLayout">
                                {myProducts.map((product, idx) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        isSeller={isSeller}
                                        isAdmin={isAdmin}
                                        sellerRuc={sellerRuc}
                                        index={idx}
                                        onRestock={(p) => setPendingProduct({ ...p, isRestock: true })}
                                        onAddToCart={(p) => setPendingProduct(p)}
                                        onEdit={(p) => setPendingProduct({ ...p, isEdit: true })}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* MARKETPLACE SECTION */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-t border-white/5 pt-8">
                            <Store className="w-6 h-6 text-blue-400" /> Catálogo Global
                        </h2>
                        {otherProducts.length === 0 ? (
                            <p className="text-muted-foreground italic">No hay productos de otros vendedores aún.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {otherProducts.map((product, idx) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            isSeller={isSeller}
                                            isAdmin={isAdmin}
                                            sellerRuc={sellerRuc}
                                            index={idx}
                                            onRestock={(p) => setPendingProduct({ ...p, isRestock: true })}
                                            onAddToCart={(p) => setPendingProduct(p)}
                                            onEdit={(p) => setPendingProduct({ ...p, isEdit: true })}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {products.map((product, idx) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                isSeller={isSeller}
                                isAdmin={isAdmin}
                                sellerRuc={sellerRuc}
                                index={idx}
                                onRestock={(p) => setPendingProduct({ ...p, isRestock: true })}
                                onAddToCart={(p) => setPendingProduct(p)}
                                onEdit={(p) => setPendingProduct({ ...p, isEdit: true })}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {(pendingProduct as any) && (pendingProduct as any).isEdit ? (
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
                            className="bg-slate-900 border border-white/10 max-w-md w-full p-8 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <Settings2 className="w-8 h-8 text-red-400" />
                            </div>

                            <h3 className="text-xl font-bold text-center mb-2 text-white">Editar Producto</h3>
                            <p className="text-sm text-muted-foreground text-center mb-8">Modo Administrador: Solo edición de metadatos básicos.</p>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Nombre del Producto</label>
                                    <input
                                        id="edit-name"
                                        defaultValue={pendingProduct.name}
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:border-red-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Precio (CBT)</label>
                                    <input
                                        id="edit-price"
                                        defaultValue={pendingProduct.price}
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:border-red-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">IVA (%)</label>
                                    <select
                                        id="edit-iva"
                                        defaultValue={pendingProduct.iva}
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:border-red-500 outline-none"
                                    >
                                        <option value="0">0%</option>
                                        <option value="15">15%</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="edit-active"
                                        defaultChecked={pendingProduct.active}
                                        className="w-5 h-5 rounded border-white/10 bg-white/5"
                                    />
                                    <label htmlFor="edit-active" className="text-sm text-white font-medium">Producto Activo</label>
                                </div>

                                <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                    <p className="text-[10px] text-orange-200 uppercase font-black mb-1">Nota de Seguridad</p>
                                    <p className="text-[10px] text-orange-200/70">Como Administrador, Usted tendrá administración limitada de los productos. La administración completa la tendrá cada Compañía, únicamente sobre sus propios productos.</p>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setPendingProduct(null)}
                                        className="flex-1 h-12 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-bold text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => {
                                            const name = (document.getElementById("edit-name") as HTMLInputElement)?.value || pendingProduct.name;
                                            const price = (document.getElementById("edit-price") as HTMLInputElement)?.value || pendingProduct.price;
                                            const iva = parseInt((document.getElementById("edit-iva") as HTMLSelectElement)?.value || pendingProduct.iva.toString());
                                            const active = (document.getElementById("edit-active") as HTMLInputElement)?.checked ?? pendingProduct.active;

                                            handleUpdateProduct({
                                                ...pendingProduct,
                                                name,
                                                price,
                                                iva,
                                                active
                                            });
                                        }}
                                        className="flex-1 h-12 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center"
                                    >
                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : pendingProduct && (
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
                                {pendingProduct.isRestock ? <Plus className="w-8 h-8 text-blue-400" /> : <ShoppingCart className="w-8 h-8 text-primary" />}
                            </div>

                            <h3 className="text-xl font-bold text-center mb-2 text-white">
                                {pendingProduct.isRestock ? "Reabastecer Producto" : isSeller ? "¿Reabastecer desde Terceros?" : "¿Añadir al Carrito?"}
                            </h3>

                            <p className="text-sm text-muted-foreground text-center mb-8">
                                {pendingProduct.isRestock
                                    ? <>Ingresa la cantidad de stock a añadir para <span className="text-white font-bold">{pendingProduct.name}</span>.</>
                                    : isSeller
                                        ? <>El producto <span className="text-white font-bold">{pendingProduct.name}</span> se añadirá a tu inventario para reventa.</>
                                        : <>El producto <span className="text-white font-bold">{pendingProduct.name}</span> se va a agregar al carrito. ¿Deseas continuar?</>
                                }
                            </p>

                            {pendingProduct.isRestock && (
                                <div className="mb-6">
                                    <input
                                        type="number"
                                        min="1"
                                        defaultValue="10"
                                        id="restock-amount"
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold text-xl outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            )}

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
                                        if (pendingProduct.isRestock) {
                                            const amount = (document.getElementById("restock-amount") as HTMLInputElement)?.value || "0";
                                            if (pendingProduct) {
                                                handleRestock(pendingProduct.id, parseInt(amount));
                                            }
                                        } else {
                                            addToCart({
                                                ...pendingProduct,
                                                companyRuc: pendingProduct.companyRuc,
                                                companyName: pendingProduct.companyName
                                            });
                                            setPendingProduct(null);
                                        }
                                    }}
                                    className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center ${pendingProduct.isRestock || isSeller
                                        ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                                        }`}
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
