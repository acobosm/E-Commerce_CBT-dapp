"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import EcommerceABI from "@/abis/Ecommerce.json";

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_ADDRESS || "";
const ADMIN_ADDRESS = (process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "").toLowerCase();
const COMMERCE_ADDRESS = (process.env.NEXT_PUBLIC_COMMERCE_ADDRESS || "").toLowerCase();

export function useWeb3() {
    const [account, setAccount] = useState<string | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sellerRuc, setSellerRuc] = useState<string | null>(null);

    const isAdmin = account?.toLowerCase() === ADMIN_ADDRESS;
    const isCommerce = account?.toLowerCase() === COMMERCE_ADDRESS;
    const isSeller = !!sellerRuc || isCommerce;

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            setError("MetaMask no instalado");
            return;
        }

        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const userAddress = accounts[0];

            setAccount(userAddress);

            if (ECOMMERCE_ADDRESS) {
                const ecommerceContract = new ethers.Contract(
                    ECOMMERCE_ADDRESS,
                    EcommerceABI.abi,
                    signer
                );
                setContract(ecommerceContract);

                // Fetch RUC for seller detection
                try {
                    const ruc = await ecommerceContract.walletToRuc(userAddress);
                    if (ruc && ruc !== "") {
                        setSellerRuc(ruc);
                    }
                } catch (e) {
                    console.error("Error fetching RUC", e);
                }
            } else {
                setError("Dirección del contrato no configurada");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error conectando billetera");
        } finally {
            setLoading(false);
        }
    }, []);

    const disconnectWallet = () => {
        setAccount(null);
        setContract(null);
        setSellerRuc(null);
    };

    useEffect(() => {
        const checkConnection = async () => {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    connectWallet();
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        checkConnection();

        if (window.ethereum) {
            const handleAccounts = (accounts: string[]) => {
                if (accounts.length > 0) {
                    window.location.reload();
                } else {
                    disconnectWallet();
                }
            };
            window.ethereum.on("accountsChanged", handleAccounts as any);
            window.ethereum.on("chainChanged", () => window.location.reload());
        }
    }, [connectWallet]);

    return {
        account,
        contract,
        loading,
        error,
        connectWallet,
        disconnectWallet,
        isAdmin,
        isCommerce,
        isSeller,
        sellerRuc
    };
}
