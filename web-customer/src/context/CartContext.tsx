"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';

interface CartItem {
    id: number;
    name: string;
    price: string;
    quantity: number;
    iva?: number;
    companyRuc: string;
    companyName: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    cartSubtotal: number;
    cartIVA: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { account } = useWeb3();
    const [cart, setCart] = useState<CartItem[]>([]);

    // Cargar carrito desde localStorage al iniciar o cambiar de cuenta
    useEffect(() => {
        if (!account) {
            setCart([]);
            return;
        }
        const savedCart = localStorage.getItem(`codecrypto-cart-${account.toLowerCase()}`);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error loading cart", e);
                setCart([]);
            }
        } else {
            setCart([]);
        }
    }, [account]);

    // Guardar carrito en localStorage cuando cambie
    useEffect(() => {
        if (account) {
            localStorage.setItem(`codecrypto-cart-${account.toLowerCase()}`, JSON.stringify(cart));
        }
    }, [cart, account]);

    const addToCart = (product: any) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, {
                ...product,
                quantity: 1,
                iva: product.iva ?? 0,
                companyRuc: product.companyRuc || "",
                companyName: product.companyName || "Vendedor"
            }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        setCart(prevCart => prevCart.map(item =>
            item.id === productId ? { ...item, quantity } : item
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    // Calculate subtotal and tax
    // Contract Logic: if iva==15, price + 15%. Else price.
    // Frontend logic must replicate this.
    // Subtotal = sum(price * qty)
    // IVA = sum(price * qty * 0.15) IF iva==15.

    const cartSubtotal = cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);

    const cartIVA = cart.reduce((total, item) => {
        if (item.iva === 15) {
            return total + (parseFloat(item.price) * item.quantity * 0.15);
        }
        return total;
    }, 0);

    const cartTotal = cartSubtotal + cartIVA;

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, cartSubtotal, cartIVA }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
