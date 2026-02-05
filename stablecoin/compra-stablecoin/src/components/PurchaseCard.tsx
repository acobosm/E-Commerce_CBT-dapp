"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useWeb3 } from "@/hooks/useWeb3";
import CheckoutForm from "./CheckoutForm";
import { Wallet, CreditCard, CheckCircle2, AlertCircle, LogOut, Briefcase } from "lucide-react";
import { ethers } from "ethers";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CBTOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const CBTOKEN_ADDRESS = process.env.NEXT_PUBLIC_CBTOKEN_ADDRESS!;
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase() || "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const MERCHANT_ADDRESS = process.env.NEXT_PUBLIC_MERCHANT_ADDRESS?.toLowerCase() || "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

export default function PurchaseCard() {
    const { account, provider, connectWallet, disconnectWallet } = useWeb3();
    const [balance, setBalance] = useState<string>("0");
    const [amount, setAmount] = useState<number>(100);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [successTx, setSuccessTx] = useState<string | null>(null);

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

    const fetchPaymentIntent = async () => {
        try {
            const res = await fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const data = await res.json();
            setClientSecret(data.clientSecret);
        } catch (err) {
            console.error("Error fetching payment intent");
        }
    };

    if (successTx) {
        return (
            <div className="glass p-8 rounded-2xl text-center max-w-lg w-full animate-in fade-in zoom-in duration-500">
                <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">¡Compra Exitosa!</h2>
                <p className="text-gray-400 mb-6">
                    Tus CBTokens han sido minteados y enviados a tu wallet.
                </p>
                <div className="bg-slate-900 p-3 rounded-lg text-xs font-mono break-all mb-6 border border-slate-800">
                    TX: {successTx}
                </div>
                <button
                    onClick={() => {
                        setSuccessTx(null);
                        setClientSecret("");
                        fetchBalance();
                    }}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
                >
                    Nueva Compra
                </button>
            </div>
        );
    }

    return (
        <div className="glass p-8 rounded-2xl max-w-lg w-full shadow-2xl relative overflow-hidden">
            {/* Decoración superior */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/20 rounded-xl">
                        <CreditCard className="text-blue-400 h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Comprar CBTokens</h1>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">CBT Stablecoin App</p>
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

            {!account ? (
                <div className="space-y-6">
                    <button
                        onClick={connectWallet}
                        className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-900/20"
                    >
                        <Wallet className="h-5 w-5" />
                        Conectar MetaMask
                    </button>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                        <p className="text-sm text-gray-400">Pagarás 1 USD por cada CBToken</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <label className="block text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Cantidad a comprar</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="bg-transparent text-4xl font-black outline-none w-full text-white"
                                placeholder="0"
                                disabled={!!clientSecret}
                            />
                            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                <span className="text-xl font-bold text-blue-400">CBT</span>
                            </div>
                        </div>
                    </div>

                    {account.toLowerCase() === ADMIN_ADDRESS || account.toLowerCase() === MERCHANT_ADDRESS ? (
                        <div className="bg-amber-950/20 border border-amber-500/30 p-5 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-200 uppercase tracking-tight">Acceso Restringido</p>
                                <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                                    Las cuentas de **{account.toLowerCase() === ADMIN_ADDRESS ? "Tesorería" : "Comercio"}** no pueden comprar tokens.
                                    Por favor, usa una cuenta de cliente (Cuentas 2 a 6) para esta operación.
                                </p>
                            </div>
                        </div>
                    ) : !clientSecret ? (
                        <button
                            onClick={fetchPaymentIntent}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                        >
                            <CreditCard className="h-5 w-5" />
                            Continuar al Pago
                        </button>
                    ) : (
                        <div className="pt-4 border-t border-slate-800 animate-in slide-in-from-top duration-300">
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                                <CheckoutForm
                                    amount={amount}
                                    userAddress={account}
                                    onSuccess={(hash) => {
                                        setSuccessTx(hash);
                                    }}
                                />
                            </Elements>
                            <button
                                onClick={() => setClientSecret("")}
                                className="w-full mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase font-bold tracking-widest"
                            >
                                ← Cambiar cantidad
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 flex items-start gap-2 p-3 bg-blue-900/20 rounded-lg text-[10px] text-blue-300/80 italic">
                <AlertCircle className="h-4 w-4 shrink-0 opacity-60" />
                <p>Asegúrate de estar conectado a la red local (Anvil) en tu MetaMask para recibir los tokens.</p>
            </div>
        </div>
    );
}
