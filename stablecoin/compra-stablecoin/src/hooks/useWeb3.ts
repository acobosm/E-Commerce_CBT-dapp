"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export const useWeb3 = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [balance, setBalance] = useState<string>("0");
    const [chainId, setChainId] = useState<bigint | null>(null);

    const connectWallet = useCallback(async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await browserProvider.send("eth_requestAccounts", []);
                const network = await browserProvider.getNetwork();

                setAccount(accounts[0]);
                setProvider(browserProvider);
                setChainId(network.chainId);

                // Actualizar balance de tokens (opcional aquí o en componente)
            } catch (error) {
                console.error("Error connecting to MetaMask:", error);
            }
        } else {
            alert("Please install MetaMask");
        }
    }, []);

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
    };

    useEffect(() => {
        if (typeof window.ethereum !== "undefined") {
            window.ethereum.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    setAccount(null);
                }
            });

            window.ethereum.on("chainChanged", (chainIdHex: string) => {
                setChainId(BigInt(chainIdHex));
            });
        }
    }, []);

    return { account, provider, balance, chainId, connectWallet, disconnectWallet };
};
