"use client";

import { useWeb3 } from "@/hooks/useWeb3";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Plus,
    Package,
    TrendingUp,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Box,
    Tag,
    Coins,
    LineChart,
    Crown,
    ExternalLink,
    ShieldCheck,
    Wallet,
    X,
    Settings2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard, Product as ProductType } from "@/components/ProductCard";
import CBTokenABI from "@/abis/CBToken.json";

interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    stock: number;
    photos: string[];
    active: boolean;
    iva: number;
    companyRuc: string;  // Added for compatibility with ProductCard
    companyName: string; // Added for compatibility with ProductCard
}

export default function SellerDashboard() {
    const { contract, account, loading: web3Loading, isSeller, sellerRuc } = useWeb3();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"inventory" | "register">("inventory");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<any>(null);

    // Form State
    const [form, setForm] = useState({
        name: "",
        price: "",
        stock: "",
        iva: "15",
        photo: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Edit State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        price: "",
        photo: "",
        iva: "15",
        active: true
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // VIP State
    const [isVipModalOpen, setIsVipModalOpen] = useState(false);
    const [cbtBalance, setCbtBalance] = useState("0");
    const [cbtAllowance, setCbtAllowance] = useState("0");
    const [vipExpiry, setVipExpiry] = useState<number | null>(null);
    const [isBecomingVip, setIsBecomingVip] = useState(false);

    // Reponer State
    const [reponerId, setReponerId] = useState<number | null>(null);
    const [reponerAmount, setReponerAmount] = useState<string>("10");

    const fetchCbtInfo = useCallback(async () => {
        if (!contract || !account) return;
        try {
            const cbtokenAddress = await contract.cbtoken();
            const cbtoken = new ethers.Contract(cbtokenAddress, CBTokenABI.abi, contract.runner);
            const balance = await cbtoken.balanceOf(account);
            const allowance = await cbtoken.allowance(account, await contract.getAddress());
            setCbtBalance(ethers.formatUnits(balance, 6));
            setCbtAllowance(ethers.formatUnits(allowance, 6));
        } catch (err) {
            console.error("Error fetching CBT info", err);
        }
    }, [contract, account]);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!contract || !account || !isSeller) {
                if (!web3Loading && account && !isSeller) {
                    setLoading(false);
                }
                return;
            }

            try {
                setLoading(true);
                // 1. Fetch Company Info
                const rucToUse = sellerRuc || (await contract.walletToRuc(account));
                if (rucToUse) {
                    const info = await contract.companies(rucToUse);
                    setCompanyInfo(info);
                    setVipExpiry(Number(info.vipUntil));

                    // 2. Fetch Products
                    const nextId = await contract.nextProductId();
                    const filtered: Product[] = [];
                    for (let i = 1; i < Number(nextId); i++) {
                        const p = await contract.products(i);
                        if (p.companyRuc === rucToUse) {
                            let photos: string[] = [];
                            try {
                                const photoData = await contract.getProductPhotos(i);
                                photos = Array.from(photoData) as string[];
                            } catch (e) {
                                console.warn(`Error loading photos for ${i}`);
                            }

                            filtered.push({
                                id: i,
                                name: p.name,
                                description: p.description,
                                price: ethers.formatUnits(p.price_1, 6),
                                stock: Number(p.stock),
                                photos: photos,
                                active: p.isActive,
                                iva: Number(p.iva),
                                companyRuc: p.companyRuc,
                                companyName: info?.name || "Empresa"
                            });
                        }
                    }
                    setProducts(filtered);
                    await fetchCbtInfo();
                }
            } catch (err) {
                console.error("Error loading dashboard", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [contract, account, isSeller, sellerRuc, fetchCbtInfo, web3Loading]);

    useEffect(() => {
        if (!web3Loading && account && !isSeller) {
            router.push("/products");
        }
    }, [web3Loading, account, isSeller, router]);

    const handleBecomeVip = async () => {
        if (!contract || !account || !companyInfo) return;
        try {
            setIsBecomingVip(true);
            const cbtokenAddress = await contract.cbtoken();
            const cbtoken = new ethers.Contract(cbtokenAddress, CBTokenABI.abi, contract.runner);
            const cost = ethers.parseUnits("500", 6);

            // 1. Approve if needed
            if (ethers.parseUnits(cbtAllowance, 6) < cost) {
                const txApprove = await cbtoken.approve(await contract.getAddress(), cost);
                await txApprove.wait();
            }

            // 2. Pay subscription
            const txVip = await contract.payVipSubscription(companyInfo.ruc);
            await txVip.wait();

            alert("¡Felicidades! Ahora eres Cliente VIP con 0% de comisión.");
            setIsVipModalOpen(false);
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert("Error al activar VIP: " + (err.reason || err.message));
        } finally {
            setIsBecomingVip(false);
        }
    };

    const formatExpiry = (timestamp: number) => {
        const dateStr = new Date(timestamp * 1000).toLocaleString('es-EC', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        return `${dateStr} (Ecuador Time)`;
    };

    const getNextSundayExpiry = () => {
        const now = Math.floor(Date.now() / 1000);
        const dayOfWeek = (Math.floor(now / 86400) + 3) % 7; // 0=Mon, 6=Sun
        const daysUntilSunday = 6 - dayOfWeek;
        const endOfWeek = (Math.floor(now / 86400) + daysUntilSunday + 1) * 86400 - 1;
        return endOfWeek;
    };

    const handleRegisterProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !companyInfo) return;

        try {
            setIsSubmitting(true);
            setSuccessMsg(null);

            const priceUnits = ethers.parseUnits(form.price, 6);
            const photos = [form.photo || "", "", "", ""];

            const tx = await contract.addProduct(
                companyInfo.ruc,
                form.name,
                photos,
                priceUnits,
                parseInt(form.stock),
                parseInt(form.iva)
            );

            await tx.wait();
            setSuccessMsg("¡Producto registrado exitosamente!");
            setForm({ name: "", price: "", stock: "", iva: "15", photo: "" });
            setIsRegisterModalOpen(false);
            setActiveTab("inventory");

            // Refresh list
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert("Error al registrar: " + (err.reason || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !editingProduct) return;

        try {
            setIsUpdating(true);
            const priceUnits = ethers.parseUnits(editForm.price, 6);
            const photos = [editForm.photo || "", "", "", ""];

            const tx = await contract.updateProduct(
                editingProduct.id,
                editForm.name,
                photos,
                priceUnits,
                parseInt(editForm.iva),
                editForm.active
            );

            await tx.wait();
            alert("Producto actualizado exitosamente");
            setEditingProduct(null);
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert("Error al actualizar: " + (err.reason || err.message));
        } finally {
            setIsUpdating(false);
        }
    };

    const startEditing = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            price: product.price,
            photo: product.photos[0] || "",
            iva: product.iva.toString(),
            active: product.active
        });
    };

    const handleReponer = async () => {
        if (!contract || reponerId === null) return;
        try {
            setIsRefreshing(true);
            const tx = await contract.buyStock(reponerId, parseInt(reponerAmount));
            await tx.wait();
            setReponerId(null);
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert("Error al reponer: " + (err.reason || err.message));
        } finally {
            setIsRefreshing(false);
        }
    };

    if (web3Loading || loading) {
        return (
            <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse font-medium">Cargando Panel de Control...</p>
            </div>
        );
    }

    if (!isSeller) {
        return (
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-md mx-auto glass-panel p-10 text-center rounded-3xl border border-red-500/20">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
                    <p className="text-muted-foreground mb-8">Esta sección es exclusiva para empresas registradas en la plataforma.</p>
                    <Link href="/products" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold transition-all inline-block">
                        Volver al Catálogo
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
            {/* Primer Panel (Título e Info + Estadísticas) */}
            <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Link href="/products" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">Panel de Vendedor</h1>
                    </div>
                    <p className="text-muted-foreground">Bienvenido, <span className="text-primary font-bold">{companyInfo?.name || "Empresa"}</span> (RUC: {companyInfo?.ruc})</p>
                </div>

                {/* Tarjeta de Ventas */}
                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center gap-4 min-w-[300px]">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">INGRESOS POR VENTAS (NO INCLUYE IVA)</p>
                        <p className="text-2xl font-black text-white">
                            {companyInfo?.currentWeekSales
                                ? Number(ethers.formatUnits(companyInfo.currentWeekSales, 6)).toLocaleString('en-US', { minimumFractionDigits: 1 })
                                : "0.0"}{" "}
                            <span className="text-xs text-muted-foreground font-bold">CBT</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. BOTONES DE ACCIÓN (OPERATIVOS) */}
            <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 border-dashed">
                <button
                    onClick={() => setActiveTab("inventory")}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === "inventory"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                >
                    <Package className="w-5 h-5" /> Mis Productos
                </button>
                <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-white/5 text-muted-foreground hover:bg-white/10 transition-all"
                >
                    <Plus className="w-5 h-5" /> Nuevo Producto
                </button>

                {vipExpiry && vipExpiry > Date.now() / 1000 ? (
                    <div className="ml-auto px-6 py-3 bg-yellow-500/10 border border-yellow-500/50 rounded-xl flex items-center gap-3 shadow-lg shadow-yellow-500/10">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        <div>
                            <p className="text-yellow-500 font-black text-xs uppercase tracking-widest">Socio VIP Activo</p>
                            <p className="text-slate-500 text-[10px] font-bold">EXPIRA: {formatExpiry(vipExpiry)}</p>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsVipModalOpen(true)}
                        className="ml-auto px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-yellow-500/20 group"
                    >
                        <Crown className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Convertir a Socio VIP
                    </button>
                )}
            </div>

            {/* 3. CONTENIDO: LISTA DE PRODUCTOS (INVENTARIO REAL) */}
            <div className="p-4 sm:p-8 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.01] min-h-[400px]">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Box className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No tienes productos registrados</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                            Comienza a vender hoy mismo agregando tu primer producto a la plataforma.
                        </p>
                        <button
                            onClick={() => setIsRegisterModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Crear Mi Primer Producto
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product, idx) => (
                            <ProductCard
                                key={product.id}
                                product={{
                                    ...product,
                                    description: product.description || "Sin descripción"
                                }}
                                isSeller={true}
                                isAdmin={false}
                                sellerRuc={sellerRuc}
                                onRestock={() => {
                                    setReponerId(product.id);
                                    setReponerAmount("10");
                                }}
                                onAddToCart={() => { }} // Los vendedores no se compran a sí mismos
                                onEdit={() => startEditing(product)}
                                index={idx}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL REGISTRO DE PRODUCTO (NUEVO) */}
            <AnimatePresence>
                {isRegisterModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0f172a] border border-white/10 p-8 rounded-[40px] w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            <button
                                onClick={() => setIsRegisterModalOpen(false)}
                                className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <Plus className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">Registrar Nuevo Producto</h2>
                                <p className="text-white/50 text-sm mt-2 font-medium">Completa los datos para publicar tu producto</p>
                            </div>

                            <form onSubmit={handleRegisterProduct} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre del Producto</label>
                                    <input
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all font-medium"
                                        placeholder="Ej: Auriculares Wireless Pro"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Precio (CBT)</label>
                                        <input
                                            required
                                            type="number"
                                            value={form.price}
                                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                                            className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white outline-none focus:border-primary/50 transition-all font-medium"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Stock Inicial</label>
                                        <input
                                            required
                                            type="number"
                                            value={form.stock}
                                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                            className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white outline-none focus:border-primary/50 transition-all font-medium"
                                            placeholder="10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">URL de la Imagen</label>
                                    <input
                                        value={form.photo}
                                        onChange={(e) => setForm({ ...form, photo: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all font-medium"
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                    />
                                </div>

                                <div className="pt-4 grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsRegisterModalOpen(false)}
                                        className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        className="h-14 bg-primary text-primary-foreground rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Publicar Producto"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL VIP (DISEÑO PREMIUM SEGÚN CAPTURA) */}
            <AnimatePresence>
                {isVipModalOpen && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0f172a] border border-white/10 p-8 rounded-[40px] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsVipModalOpen(false)}
                                className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                {/* Crown Icon */}
                                <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mb-6 border border-yellow-500/20">
                                    <Crown className="w-10 h-10 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]" />
                                </div>

                                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic">MEMBRESIA VIP</h2>
                                <p className="text-white/50 text-sm mb-8 leading-relaxed">
                                    Elimina las comisiones de plataforma <br />
                                    <span className="text-white font-medium">(10% &rarr; </span>
                                    <span className="text-yellow-400 font-bold text-lg">0%</span>
                                    <span className="text-white font-medium">)</span> hasta el domingo.
                                </p>

                                <div className="w-full space-y-4 mb-8">
                                    {/* Cost Row */}
                                    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                                                <Tag className="w-5 h-5 text-yellow-500" />
                                            </div>
                                            <span className="text-white/70 font-bold">Costo de Membresía</span>
                                        </div>
                                        <span className="text-2xl font-black text-white">500 CBT</span>
                                    </div>

                                    {/* Balance Row */}
                                    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                                <Wallet className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <span className="text-white/70 font-bold">Tu Saldo Actual</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${Number(cbtBalance) < 500 ? 'text-red-500' : 'text-green-500'}`}>
                                                {Number(cbtBalance).toLocaleString('en-US', { minimumFractionDigits: 5 })} CBT
                                            </span>
                                            <Link href="/token-store" className="block text-[10px] text-blue-400 hover:underline font-bold uppercase tracking-wider mt-1">
                                                Comprar tokens &rarr;
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Info Alert */}
                                    <div className="bg-yellow-500/[0.03] border border-yellow-500/10 p-5 rounded-3xl flex items-start gap-4">
                                        <div className="w-10 h-10 min-w-[40px] bg-yellow-500/10 rounded-xl flex items-center justify-center">
                                            <ShieldCheck className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <p className="text-[11px] text-yellow-500/80 leading-relaxed text-left font-medium">
                                            La membresía VIP reduce tu comisión de plataforma a <span className="text-yellow-500 font-bold">0%</span> de forma inmediata.
                                            La validez es semanal, expirando el domingo a medianoche.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => setIsVipModalOpen(false)}
                                        className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={handleBecomeVip}
                                        disabled={isBecomingVip || Number(cbtBalance) < 500}
                                        className={`h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${Number(cbtBalance) >= 500 && !isBecomingVip
                                            ? "bg-gradient-to-r from-yellow-600 to-yellow-400 text-white shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98]"
                                            : "bg-white/10 text-white/20 cursor-not-allowed opacity-50"
                                            }`}
                                    >
                                        {isBecomingVip ? <Loader2 className="w-6 h-6 animate-spin" /> : "Suscribirme Ahora"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL REPONER STOCK */}
            <AnimatePresence>
                {reponerId !== null && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0f172a] border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            <button
                                onClick={() => setReponerId(null)}
                                className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                    <Package className="w-8 h-8 text-blue-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">Reponer Stock</h2>
                                <p className="text-white/50 text-sm mt-2 font-medium">Ingresa la cantidad a añadir al inventario</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cantidad a Añadir</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={reponerAmount}
                                        onChange={(e) => setReponerAmount(e.target.value)}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white outline-none focus:border-blue-500/50 transition-all font-medium text-center text-2xl"
                                        placeholder="10"
                                    />
                                </div>

                                <div className="pt-4 grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setReponerId(null)}
                                        className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleReponer}
                                        disabled={isRefreshing}
                                        className="h-14 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {isRefreshing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar Repo"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL EDITAR PRODUCTO */}
            <AnimatePresence>
                {editingProduct && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0f172a] border border-white/10 p-8 rounded-[40px] w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <Settings2 className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">Editar Producto</h2>
                                <p className="text-white/50 text-sm mt-2 font-medium">Actualiza la información de tu producto</p>
                            </div>

                            <form onSubmit={handleUpdateProduct} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre del Producto</label>
                                    <input
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Precio (CBT)</label>
                                        <input
                                            required
                                            type="number"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                            className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white outline-none focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2 flex flex-col justify-end">
                                        <label className="flex items-center gap-3 cursor-pointer group bg-white/[0.03] border border-white/10 p-4 rounded-2xl hover:bg-white/[0.05] transition-all">
                                            <input
                                                type="checkbox"
                                                checked={editForm.active}
                                                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                                className="w-5 h-5 accent-primary"
                                            />
                                            <span className="text-sm font-bold text-white uppercase tracking-widest">Activo</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">URL de la Imagen</label>
                                    <input
                                        value={editForm.photo}
                                        onChange={(e) => setEditForm({ ...editForm, photo: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>

                                <div className="pt-4 grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingProduct(null)}
                                        className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={isUpdating}
                                        className="h-14 bg-primary text-primary-foreground rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar Cambios"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
