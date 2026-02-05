import { NextResponse } from "next/server";
import { ethers } from "ethers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-01-28.clover" as any,
});

const ABI = [
    "function mint(address to, uint256 amount) external",
    "function decimals() public view returns (uint8)"
];

export async function POST(request: Request) {
    try {
        const { paymentIntentId, address, amount } = await request.json();

        // 1. Verificar el pago con Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
            return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
        }

        // 2. Configurar provider y wallet para el minting (Cuenta 0 de Anvil)
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const wallet = new ethers.Wallet(process.env.MINT_PRIVATE_KEY as string, provider);
        const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CBTOKEN_ADDRESS as string,
            ABI,
            wallet
        );

        // 3. Ejecutar mint
        // El monto viene en CBT (unidades enteras), el contrato tiene 6 decimales
        const decimals = 6;
        const amountToMint = ethers.parseUnits(amount.toString(), decimals);

        console.log(`Minting ${amountToMint} CBT to ${address}...`);
        const tx = await contract.mint(address, amountToMint);
        await tx.wait();

        return NextResponse.json({
            success: true,
            txHash: tx.hash
        });

    } catch (error: any) {
        console.error("Minting Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
