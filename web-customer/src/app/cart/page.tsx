"use client";

import { useCart } from "@/context/CartContext";
import { useWeb3 } from "@/hooks/useWeb3";
import { Trash2, ShoppingBag, ArrowRight, Wallet, CheckCircle2, AlertCircle, Loader2, Plus, Minus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CBTokenABI from "@/abis/CBToken.json";

declare global {
    interface Window {
        ethereum: any;
    }
}

const CBTOKEN_ADDRESS = process.env.NEXT_PUBLIC_CBTOKEN_ADDRESS || "";

export default function CartPage() {
    const { cart, removeFromCart, cartTotal, clearCart, updateQuantity, cartSubtotal, cartIVA } = useCart();
    const { account, connectWallet, contract, isAdmin, isCommerce } = useWeb3();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [loadingClient, setLoadingClient] = useState(true);
    const [txStatus, setTxStatus] = useState<string | null>(null);
    const [cbtBalance, setCbtBalance] = useState<string>("0.00");
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [regData, setRegData] = useState({
        name: "",
        idNumber: "",
        email: "",
        phone: "",
        streets: ""
    });

    // 1. Fetch Balance & Auto-Refresh
    useEffect(() => {
        const fetchBalance = async () => {
            if (account && typeof window !== "undefined" && window.ethereum) {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const tokenContract = new ethers.Contract(CBTOKEN_ADDRESS, CBTokenABI.abi, provider);
                    const balance = await tokenContract.balanceOf(account);
                    setCbtBalance(ethers.formatUnits(balance, 6));
                } catch (error) {
                    console.error("Error fetching balance:", error);
                }
            }
        };
        fetchBalance();

        const onFocus = () => fetchBalance();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [account]);

    // 2. Check Client Registration
    useEffect(() => {
        const checkClient = async () => {
            if (!contract || !account) {
                setLoadingClient(false);
                return;
            }
            try {
                const client = await contract.clients(account);
                setIsRegistered(!!client.idNumber);
            } catch (error) {
                console.error("Error checking client status:", error);
            } finally {
                setLoadingClient(false);
            }
        };
        checkClient();
    }, [contract, account]);


    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !account) return;
        try {
            setIsProcessing(true);
            setTxStatus("Registrando perfil en blockchain...");
            const tx = await contract.registerClient(
                regData.name,
                regData.idNumber,
                regData.email,
                regData.phone,
                regData.streets
            );
            await tx.wait();
            setIsRegistered(true);
            setIsRegisterModalOpen(false);
            setTxStatus("¡Perfil registrado con éxito!");
            setTimeout(() => setTxStatus(null), 3000);
        } catch (error: any) {
            console.error(error);
            alert(`Error de registro: ${error.reason || error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCheckout = async () => {
        if (!account) {
            connectWallet();
            return;
        }

        if (!contract) return;

        // GROUP ITEMS BY SELLER
        const groups: Record<string, typeof cart> = {};
        cart.forEach(item => {
            const ruc = item.companyRuc;
            if (!groups[ruc]) groups[ruc] = [];
            groups[ruc].push(item);
        });

        const sellerRucs = Object.keys(groups);
        const totalGroups = sellerRucs.length;

        try {
            setIsProcessing(true);

            // 1. APPROVE TOKENS
            setTxStatus("Solicitando aprobación de tokens...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const tokenContract = new ethers.Contract(CBTOKEN_ADDRESS, CBTokenABI.abi, signer);

            const totalInCBT = ethers.parseUnits(cartTotal.toFixed(6), 6);
            const allowance = await tokenContract.allowance(account, await contract.getAddress());

            if (allowance < totalInCBT) {
                const approveTx = await tokenContract.approve(await contract.getAddress(), totalInCBT);
                setTxStatus("Esperando confirmación de aprobación...");
                await approveTx.wait();
            }

            // 2. SYNC CART TO BLOCKCHAIN
            setTxStatus("Sincronizando carrito con Blockchain...");

            // Loop simple para añadir items uno por uno
            for (const item of cart) {
                try {
                    const txAdd = await contract.addToCart(item.id, item.quantity);
                    await txAdd.wait();
                } catch (err: any) {
                    console.error("Error adding item:", item.name, err);
                    throw new Error(`Error al añadir ${item.name}: ${err.reason || err.message || "Posible conflicto de vendedores"}`);
                }
            }

            // 3. CHECKOUT
            setTxStatus("Confirmando compra en Blockchain...");
            const txCheckout = await contract.checkout();
            await txCheckout.wait();

            setTxStatus("¡Compra realizada con éxito!");
            clearCart();

            setTimeout(() => {
                window.location.href = "/orders";
            }, 2000);

        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.reason || error.message || "Ocurrió un error en la transacción"}`);
            setTxStatus(null);
        } finally {
            setIsProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <main className="min-h-screen pt-48 pb-24 flex items-center justify-center text-center">
                <div className="container mx-auto px-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 mb-6">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 text-white">Tu carrito está vacío</h1>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Parece que aún no has añadido nada. Explora nuestro catálogo y encuentra productos increíbles.
                    </p>
                    <Link href="/products" className="inline-flex h-12 px-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all">
                        Explorar Productos
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-mesh p-8">
            <div className="container mx-auto px-4 max-w-6xl">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <h1 className="text-4xl font-bold text-white">Carrito de Compras</h1>
                    {isAdmin && (
                        <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-red-400 font-bold text-sm uppercase tracking-wider">Modo Administrador (Solo Lectura)</span>
                        </div>
                    )}
                    {isCommerce && (
                        <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <span className="text-blue-400 font-bold text-sm uppercase tracking-wider">Modo Reabastecimiento</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* SECCIÓN 1: PRODUCTOS */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-slate-900/50 border border-white/10 backdrop-blur-md shadow-xl p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-white">Mi Selección</h2>
                                <button
                                    onClick={clearCart}
                                    className="text-sm text-red-500 hover:text-red-400 font-bold"
                                >
                                    Vaciar Carrito
                                </button>
                            </div>

                            <div className="space-y-4">
                                {cart.map((item, index) => (
                                    <div
                                        key={`cart-item-${item.id}-${index}`}
                                        className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors p-4 rounded flex flex-col md:flex-row gap-4 items-center"
                                    >
                                        <div className="h-16 w-16 bg-slate-700/50 rounded flex items-center justify-center text-2xl shrink-0">
                                            📦
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-white truncate max-w-[150px] sm:max-w-xs" title={item.name}>{item.name}</h3>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                <span className="text-slate-400 text-xs font-bold uppercase">Precio Unitario:</span>
                                                <span className="text-primary font-mono text-sm font-bold">{parseFloat(item.price).toFixed(2)} CBT</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded"
                                                disabled={isProcessing}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center text-white font-bold text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded"
                                                disabled={isProcessing}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="text-right min-w-[100px]">
                                            <p className="text-xs text-slate-400 mb-1">SUBTOTAL</p>
                                            <p className="text-sm font-bold text-white">{(item.quantity * parseFloat(item.price)).toFixed(2)} CBT</p>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-3 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                            disabled={isProcessing}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: RESUMEN */}
                    <div className="w-full lg:w-96 space-y-6">
                        <div className="bg-slate-900/50 border border-white/10 backdrop-blur-md shadow-xl p-6 rounded-lg">
                            <h2 className="text-xl font-bold text-white mb-6 uppercase">Resumen de Cuenta</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-400 text-sm">
                                    <span>Subtotal</span>
                                    <span className="text-white font-bold">{cartSubtotal.toFixed(2)} CBT</span>
                                </div>
                                <div className="flex justify-between text-slate-400 text-sm">
                                    <span>IVA (15%)</span>
                                    <span className={`font-bold ${cartIVA > 0 ? "text-red-400" : "text-white"}`}>{cartIVA.toFixed(2)} CBT</span>
                                </div>
                                <div className="flex justify-between text-slate-400 text-sm">
                                    <span>Costos de Envío</span>
                                    <span className="text-green-400 font-bold">Gratis</span>
                                </div>
                                <div className="flex justify-between text-slate-400 text-sm">
                                    <span>Saldo CBT</span>
                                    <div className="text-right">
                                        <span className={parseFloat(cbtBalance) < cartTotal ? "text-red-400 font-bold block" : "text-white font-bold block"}>
                                            {parseFloat(cbtBalance).toFixed(2)} CBT
                                        </span>
                                    </div>
                                </div>
                                <div className="h-px bg-slate-800 my-4"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-white font-bold text-lg">TOTAL</span>
                                    <span className="text-2xl font-black text-white">{cartTotal.toFixed(2)} CBT</span>
                                </div>
                            </div>

                            {!account ? (
                                <button
                                    onClick={connectWallet}
                                    className="w-full py-4 bg-white text-black font-bold rounded shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Wallet className="w-5 h-5" /> CONECTAR WALLET
                                </button>
                            ) : isAdmin ? (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-center">
                                    <p className="text-red-400 font-bold text-sm mb-2">CUENTA ADMINISTRATIVA</p>
                                    <p className="text-slate-400 text-xs">Las compras están deshabilitadas para el administrador para evitar mezcla de fondos de tesorería.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {!isRegistered && !loadingClient && (
                                        <div className="bg-amber-900/30 border border-amber-500/50 p-4 rounded mb-4">
                                            <div className="flex gap-2 items-start mb-2">
                                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                                <p className="text-amber-200 text-sm">Perfil incompleto para facturación.</p>
                                            </div>
                                            <button
                                                onClick={() => setIsRegisterModalOpen(true)}
                                                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-sm shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                                            >
                                                Completar Perfil
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing || (!isRegistered && !loadingClient) || parseFloat(cbtBalance) < cartTotal}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] transition-all"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                {isCommerce ? "CONFIRMAR REABASTECIMIENTO" : "PAGAR AHORA"}
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    <a
                                        href="http://localhost:6001"
                                        target="_blank"
                                        className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-center font-bold rounded text-sm"
                                    >
                                        {isCommerce ? "RECARGAR SALDO COMERCIAL" : "RECARGAR SALDO"}
                                    </a>
                                </div>
                            )}

                            {txStatus && (
                                <div className="mt-4 p-3 bg-blue-900/30 text-blue-200 text-sm font-mono rounded flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> {txStatus}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL REGISTRO SIMPLIFICADO */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-lg p-8 rounded-lg border border-slate-700">
                        <h2 className="text-2xl font-bold text-white mb-6">Registro de Perfil</h2>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-1">Nombre Completo</label>
                                <input required type="text" value={regData.name} onChange={(e) => setRegData({ ...regData, name: e.target.value })} className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-1">Cédula / RUC</label>
                                <input required type="text" value={regData.idNumber} onChange={(e) => setRegData({ ...regData, idNumber: e.target.value })} className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-1">Email</label>
                                <input required type="email" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-1">Teléfono</label>
                                    <input required type="text" value={regData.phone} onChange={(e) => setRegData({ ...regData, phone: e.target.value })} className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-1">Dirección</label>
                                    <input required type="text" value={regData.streets} onChange={(e) => setRegData({ ...regData, streets: e.target.value })} className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white" />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold">CANCELAR</button>
                                <button type="submit" disabled={isProcessing} className="flex-1 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">
                                    {isProcessing ? "GUARDANDO..." : "GUARDAR"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
