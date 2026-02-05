"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/hooks/useWeb3";
import { Wallet, Briefcase, ShoppingCart, CheckCircle2, AlertCircle, Loader2, LogOut } from "lucide-react";

const CBTOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
];

const CBTOKEN_ADDRESS = process.env.NEXT_PUBLIC_CBTOKEN_ADDRESS!;
const MERCHANT_ADDRESS = process.env.NEXT_PUBLIC_MERCHANT_ADDRESS?.toLowerCase() || "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase() || "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

export default function PaymentProcessor() {
    const { account, provider, chainId, connectWallet, disconnectWallet } = useWeb3();
    const [balance, setBalance] = useState<string>("0");
    const [amountToPay, setAmountToPay] = useState<number>(50); // Simulación de una orden de 50 CBT
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [txHash, setTxHash] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const fetchBalance = useCallback(async () => {
        if (!account || !provider) return;
        try {
            const contract = new ethers.Contract(CBTOKEN_ADDRESS, CBTOKEN_ABI, provider);
            const bal = await contract.balanceOf(account);
            setBalance(ethers.formatUnits(bal, 6));
        } catch (err) {
            console.error("Error fetching balance:", err);
        }
    }, [account, provider]);

    useEffect(() => {
        fetchBalance();
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [fetchBalance]);

    const handlePayment = async () => {
        if (!account || !provider) return;

        setStatus("loading");
        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CBTOKEN_ADDRESS, CBTOKEN_ABI, signer);

            // Convertir a unidades de 6 decimales
            const amountInUnits = ethers.parseUnits(amountToPay.toString(), 6);

            const tx = await contract.transfer(MERCHANT_ADDRESS, amountInUnits);
            const receipt = await tx.wait();

            setTxHash(receipt.hash);
            setStatus("success");
            fetchBalance();
        } catch (err: any) {
            console.error("Payment error:", err);
            let msg = err.reason || err.message || "Error al procesar el pago";

            // Detectar cancelación del usuario y personalizar el mensaje
            if (msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("user rejected")) {
                msg = `${msg} - Transacción Cancelada por el Usuario`;
            }

            setErrorMessage(msg);
            setStatus("error");
        }
    };

    if (status === "success" && txHash) {
        return (
            <div className="glass p-8 rounded-2xl text-center max-w-lg w-full animate-in fade-in zoom-in duration-500">
                <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">¡Pago Confirmado!</h2>
                <p className="text-gray-400 mb-6">
                    Tu transacción ha sido procesada correctamente en la blockchain.
                </p>
                <div className="bg-slate-900 p-3 rounded-lg text-xs font-mono break-all mb-6 border border-slate-800">
                    TX: {txHash}
                </div>
                <button
                    onClick={() => setStatus("idle")}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="glass p-8 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative">
            {/* Decoración superior */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                        <Briefcase className="text-indigo-400 h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Procesador de Pago</h1>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">CBT Gateway</p>
                    </div>
                </div>
                {account && (
                    <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1">
                        {/* Fila Billetera con Etiqueta de Rol */}
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                                {account.toLowerCase() === ADMIN_ADDRESS && (
                                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-black rounded border border-purple-500/30 uppercase tracking-tighter">Tesorería</span>
                                )}
                                {account.toLowerCase() === MERCHANT_ADDRESS && (
                                    <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[8px] font-black rounded border border-orange-500/30 uppercase tracking-tighter">Comercio</span>
                                )}
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Billetera Conectada:</span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono leading-none">{account.slice(0, 6)}...{account.slice(-4)}</p>
                        </div>
                        {/* Fila Saldo */}
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Saldo:</span>
                            <p className="text-sm font-bold text-blue-400 leading-none">{Number(balance).toLocaleString()} CBT</p>
                        </div>

                        {/* Botón Desconexión con Icono */}
                        <button
                            onClick={disconnectWallet}
                            className="mt-2 sm:mt-1 flex items-center sm:justify-end gap-2 group transition-all"
                        >
                            <span className="text-[9px] text-red-500/70 group-hover:text-red-300 uppercase font-bold tracking-tighter">
                                Desconectar Billetera
                            </span>
                            <div className="p-1.5 bg-red-500/10 group-hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all shadow-sm order-first sm:order-last">
                                <LogOut className="h-3 w-3 text-red-400 group-hover:text-red-300" />
                            </div>
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/60 mb-8">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Resumen del Pedido</span>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Orden #2405</span>
                        <span className="text-white font-medium">Equipamiento Tech</span>
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t border-slate-800/50">
                        <span className="text-gray-400">Total a pagar</span>
                        <div className="text-right">
                            <span className="text-2xl font-black text-white">{amountToPay}</span>
                            <span className="ml-1.5 text-blue-400 font-bold">CBT</span>
                        </div>
                    </div>
                </div>
            </div>

            {!account ? (
                <button
                    onClick={connectWallet}
                    className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] shadow-lg shadow-blue-900/20"
                >
                    <Wallet className="h-5 w-5" />
                    Conectar Billetera
                </button>
            ) : (
                <div className="space-y-4">
                    {account.toLowerCase() === ADMIN_ADDRESS || account.toLowerCase() === MERCHANT_ADDRESS ? (
                        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <AlertCircle className="h-6 w-6 text-amber-400 shrink-0" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-amber-200 font-bold uppercase tracking-tight">Acceso Restringido</p>
                                <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                                    Esta cuenta posee el rol de **{account.toLowerCase() === ADMIN_ADDRESS ? "Tesorería" : "Comercio"}**.
                                    {account.toLowerCase() === MERCHANT_ADDRESS
                                        ? " No puedes comprarte productos a ti mismo."
                                        : " La Tesorería no está autorizada para realizar compras comerciales."}
                                    Por favor, usa una cuenta de cliente (Cuentas 2 a 6).
                                </p>
                            </div>
                        </div>
                    ) : Number(balance) < amountToPay ? (
                        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-4">
                            <AlertCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-200 font-bold">Saldo insuficiente</p>
                                <p className="text-xs text-red-400/80 mt-1">
                                    Tienes <span className="font-bold">{Number(balance).toLocaleString()} CBT</span>.
                                    Necesitas al menos <span className="font-bold">{amountToPay} CBT</span> para completar este pago.
                                </p>
                                <a
                                    href="http://localhost:6001"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition-all border border-slate-700 uppercase tracking-wide"
                                >
                                    Comprar CBTokens
                                </a>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handlePayment}
                            disabled={status === "loading"}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
                        >
                            {status === "loading" ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Procesando Pago...
                                </>
                            ) : (
                                "Pagar con CBTokens"
                            )}
                        </button>
                    )}
                </div>
            )}

            {status === "error" && (
                <div className="mt-4 p-3 bg-red-900/20 rounded-lg text-xs text-red-400 border border-red-500/20">
                    {errorMessage}
                </div>
            )}

            <div className="mt-8 flex items-start gap-2 p-3 bg-slate-800/30 rounded-lg text-[10px] text-gray-500 italic">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <p>Al confirmar, se transferirán {amountToPay} CBT de tu billetera al comercio. Esta acción es irreversible.</p>
            </div>
        </div>
    );
}
