"use client";

import { useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

interface CheckoutFormProps {
    amount: number;
    userAddress: string;
    onSuccess: (txHash: string) => void;
}

export default function CheckoutForm({ amount, userAddress, onSuccess }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (error) {
            setMessage(error.message ?? "An unexpected error occurred.");
            setIsLoading(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            setMessage("Payment successful! Minting tokens...");

            try {
                const response = await fetch("/api/mint-tokens", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        paymentIntentId: paymentIntent.id,
                        address: userAddress,
                        amount: amount,
                    }),
                });

                const data = await response.json();
                if (data.success) {
                    onSuccess(data.txHash);
                } else {
                    setMessage("Payment OK, but minting failed: " + data.error);
                }
            } catch (err) {
                setMessage("Error calling minting API");
            }
            setIsLoading(false);
        }
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement id="payment-element" />
            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Procesando...
                    </>
                ) : (
                    `Pagar $${amount} USD`
                )}
            </button>
            {message && <div id="payment-message" className="text-sm text-center text-blue-400 font-medium">{message}</div>}
        </form>
    );
}
