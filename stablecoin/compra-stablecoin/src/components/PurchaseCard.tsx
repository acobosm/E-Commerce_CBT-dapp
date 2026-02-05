"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useWeb3 } from "@/hooks/useWeb3";
import CheckoutForm from "./CheckoutForm";
import { Wallet, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PurchaseCard() {
    const { account, connectWallet } = useWeb3();
    const [amount, setAmount] = useState<number>(100);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [successTx, setSuccessTx] = useState<string | null>(null);

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
            <div className="glass p-8 rounded-2xl text-center max-w-md w-full animate-in fade-in zoom-in duration-500">
                <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">¡Compra Exitosa!</h2>
                <p className="text-gray-400 mb-6">
                    Tus CBTokens han sido minteados y enviados a tu wallet.
                </p>
                <div className="bg-slate-900 p-3 rounded-lg text-xs font-mono break-all mb-6 border border-slate-800">
                    TX: {successTx}
                </div>
                <button
                    onClick={() => setSuccessTx(null)}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
                >
                    Nueva Compra
                </button>
            </div>
        );
    }

    return (
        <div className="glass p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                    <CreditCard className="text-blue-400 h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Comprar CBTokens</h1>
                    <p className="text-sm text-gray-400">1 CBT = 1 USD</p>
                </div>
            </div>

            {!account ? (
                <button
                    onClick={connectWallet}
                    className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-900/20"
                >
                    <Wallet className="h-5 w-5" />
                    Conectar MetaMask
                </button>
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Cantidad a comprar</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="bg-transparent text-3xl font-bold outline-none w-full"
                                placeholder="0"
                                disabled={!!clientSecret}
                            />
                            <span className="text-xl font-semibold text-blue-400">CBT</span>
                        </div>
                    </div>

                    {!clientSecret ? (
                        <button
                            onClick={fetchPaymentIntent}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
                        >
                            Continuar al Pago
                        </button>
                    ) : (
                        <div className="pt-4 border-t border-slate-800 animate-in slide-in-from-top duration-300">
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                                <CheckoutForm
                                    amount={amount}
                                    userAddress={account}
                                    onSuccess={(hash) => setSuccessTx(hash)}
                                />
                            </Elements>
                            <button
                                onClick={() => setClientSecret("")}
                                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                ← Cambiar cantidad
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 flex items-start gap-2 p-3 bg-blue-900/20 rounded-lg text-xs text-blue-300/80">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>Asegúrate de estar conectado a la red local (Anvil) en tu MetaMask.</p>
            </div>
        </div>
    );
}
