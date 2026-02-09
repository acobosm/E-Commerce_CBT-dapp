"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import EcommerceABI from "../abis/Ecommerce.json";

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_ADDRESS || "";

export function useWeb3() {
    const [account, setAccount] = useState<string | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

                // Verificar si es Admin (Owner)
                try {
                    const owner = await ecommerceContract.owner();
                    if (owner.toLowerCase() === userAddress.toLowerCase()) {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                        setError("Acceso denegado: No eres el administrador");
                    }
                } catch (err) {
                    console.error("Error verificando owner:", err);
                    setError("Error verificando permisos de administrador");
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

    useEffect(() => {
        // Check if already connected
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
            window.ethereum.on("accountsChanged", () => {
                window.location.reload();
            });
        }
    }, [connectWallet]);

    return { account, contract, isAdmin, loading, error, connectWallet };
}
