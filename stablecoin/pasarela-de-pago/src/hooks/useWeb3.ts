"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export const useWeb3 = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [chainId, setChainId] = useState<bigint | null>(null);

    const initProvider = useCallback(async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await browserProvider.send("eth_accounts", []);
                const network = await browserProvider.getNetwork();

                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setProvider(browserProvider);
                    setChainId(network.chainId);
                }
                return browserProvider;
            } catch (error) {
                console.error("Error initializing provider:", error);
            }
        }
        return null;
    }, []);

    const connectWallet = useCallback(async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await browserProvider.send("eth_requestAccounts", []);
                const network = await browserProvider.getNetwork();

                setAccount(accounts[0]);
                setProvider(browserProvider);
                setChainId(network.chainId);
            } catch (error) {
                console.error("Error connecting to MetaMask:", error);
            }
        } else {
            alert("Por favor instala MetaMask");
        }
    }, []);

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
    };

    useEffect(() => {
        initProvider(); // Intentar detectar conexión existente al montar

        if (typeof window.ethereum !== "undefined") {
            window.ethereum.on("accountsChanged", async (accounts: any) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    const browserProvider = new ethers.BrowserProvider(window.ethereum as any);
                    setProvider(browserProvider);
                } else {
                    setAccount(null);
                    setProvider(null);
                }
            });

            window.ethereum.on("chainChanged", (chainIdHex: any) => {
                setChainId(BigInt(chainIdHex));
                const browserProvider = new ethers.BrowserProvider(window.ethereum as any);
                setProvider(browserProvider);
            });
        }
    }, [initProvider]);

    return { account, provider, chainId, connectWallet, disconnectWallet };
};
