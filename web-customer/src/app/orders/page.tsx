"use client";

import { useWeb3 } from "@/hooks/useWeb3";
import { Receipt, FileText, ExternalLink, Calendar, Hash, Download, CheckCircle2, User, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";

export default function OrdersPage() {
    const { account, contract } = useWeb3();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        idNumber: "",
        email: "",
        phone: "",
        streets: ""
    });
    const [isRegistering, setIsRegistering] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrdersAndProfile = async () => {
            if (!contract || !account) {
                setLoading(false);
                return;
            }

            try {
                // 1. Check Profile
                const client = await contract.clients(account);
                setIsRegistered(!!client.idNumber);
                if (client.idNumber) {
                    setFormData({
                        name: client.name,
                        idNumber: client.idNumber,
                        email: client.email,
                        phone: client.phone,
                        streets: client.streets
                    });
                }

                // 2. Fetch Orders (Events)
                // Filter PurchaseCompleted events for this buyer (CompanyRuc is indexed!)
                const filter = contract.filters.PurchaseCompleted(account);
                const events = await contract.queryFilter(filter, 0); // Start from block 0

                // 2.1 Fetch Companies to Resolve Hashes (because CompanyRuc is hashed in logs)
                const companyEvents = await contract.queryFilter(contract.filters.CompanyRegistered(), 0);
                const rucMap: Record<string, string> = {};

                for (const cEvent of companyEvents) {
                    if ('args' in cEvent) {
                        const { ruc } = (cEvent as any).args;
                        const rucHash = ethers.keccak256(ethers.toUtf8Bytes(ruc));
                        rucMap[rucHash] = ruc;
                    }
                }

                const formattedOrders = await Promise.all(events.map(async (event: any) => {
                    const { companyRuc: rucHashOrTopic, invoiceId, total } = event.args;
                    let companyRuc = "Unknown";

                    // Try to resolve the hash
                    // Ethers v6 might return the hash directly or an object
                    const targetHash = typeof rucHashOrTopic === 'string' ? rucHashOrTopic : rucHashOrTopic.hash;

                    if (rucMap[targetHash]) {
                        companyRuc = rucMap[targetHash];
                    } else {
                        // Fallback: If map fails, user might be interacting with legacy contract data?
                        // Or simply try to use the raw value if available (unlikely for indexed string)
                        console.warn("Could not resolve RUC hash:", targetHash);
                        // Attempt to recover if by chance it wasn't hashed (rare)
                    }

                    const block = await event.getBlock();

                    // Fetch full invoice data from mapping using Resolved RUC
                    // If RUC is unknown, we can't build the key, so this will fail or return default
                    if (companyRuc === "Unknown") {
                        // Try hardcoded fallback for development if only 1 company exists
                        // Or try to see if invoiceId gives a hint?
                        console.error("Missing RUC for Invoice:", invoiceId);
                        return null; // Skip invalid order
                    }

                    // 2.2 Fetch Invoice Details & Company Name
                    const invoiceKey = `${companyRuc}-${invoiceId}`;
                    const details = await contract.getInvoice(invoiceKey);

                    // Fetch Company Name from Contract
                    let companyName = "Cargando...";
                    try {
                        const companyData = await contract.companies(companyRuc);
                        if (companyData && companyData.name) {
                            companyName = companyData.name;
                        } else {
                            // Si no devuelve nada, usamos un fallback visual
                            companyName = "Comercio Verificado";
                        }
                    } catch (err) {
                        console.warn("Error fetching company name for RUC:", companyRuc, err);
                    }

                    return {
                        id: invoiceId,
                        companyRuc,
                        companyName, // Added field
                        total: ethers.formatUnits(total, 6),
                        date: new Date(Number(block.timestamp) * 1000).toLocaleDateString(),
                        timestamp: Number(block.timestamp),
                        txHash: event.transactionHash,
                        subtotal0: ethers.formatUnits(details.subtotal0, 6),
                        subtotal15: ethers.formatUnits(details.subtotal15, 6),
                        iva: ethers.formatUnits(details.ivaAmount, 6),
                        items: details.details
                    };
                }));

                setOrders(formattedOrders.filter((o: any) => o !== null).sort((a: any, b: any) => b.timestamp - a.timestamp));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrdersAndProfile();
    }, [account, contract]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract) return;

        try {
            setIsRegistering(true);
            const tx = await contract.registerClient(
                formData.name,
                formData.idNumber,
                formData.email,
                formData.phone,
                formData.streets
            );
            await tx.wait();
            setIsRegistered(true);
            alert("Perfil registrado con éxito. Ya puedes comprar productos.");
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.reason || error.message}`);
        } finally {
            setIsRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="animate-pulse text-xl text-muted-foreground flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin" />
                    Buscando tus facturas en la Blockchain...
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="container mx-auto px-4 py-32 text-center">
                <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                <h1 className="text-3xl font-bold mb-4">Conecta tu Wallet</h1>
                <p className="text-muted-foreground mb-8">Necesitas conectar tu wallet para ver tu historial de pedidos y facturas.</p>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight mb-2">Mis Pedidos</h1>
                                <p className="text-muted-foreground">Gestiona tus compras y descarga tus facturas electrónicas oficiales.</p>
                            </div>
                            <Link href="/products" className="h-10 px-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold flex items-center gap-2">
                                Explorar Productos
                            </Link>
                        </div>

                        {orders.length === 0 ? (
                            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-20 text-center border-dashed relative z-0 mt-8">
                                <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Aún no tienes pedidos</h2>
                                <p className="text-muted-foreground mb-8">Tus facturas aparecerán aquí una vez realices tu primera compra.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {orders.map((order) => (
                                    <div key={order.id} className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-colors group">
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Receipt className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">Factura #{order.id}</h3>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                        <span className="font-bold text-white">{order.companyName}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                        <Calendar className="w-3 h-3" /> {order.date}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* ... (keep total) */}
                                        </div>

                                        <div className="bg-black/20 rounded-xl p-4 mb-6 text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-muted-foreground font-mono text-[10px]">TX HASH</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] text-white/50 truncate max-w-[150px] md:max-w-xs" title={order.txHash}>
                                                        {order.txHash}
                                                    </span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(order.txHash)}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white w-6 h-6 rounded flex items-center justify-center transition-colors text-xs font-bold"
                                                        title="Copiar Hash"
                                                    >
                                                        #
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground font-mono text-[10px]">VENDEDOR (RUC)</span>
                                                <span className="text-white font-mono text-[10px]">{order.companyRuc}</span>
                                            </div>
                                        </div>

                                        {expandedOrderId === order.id && (
                                            <div className="mb-6 bg-white/5 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Detalle de Compra</div>
                                                <div className="space-y-2">
                                                    {order.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                                                            <div>
                                                                <span className="text-white font-medium truncate max-w-[200px] block" title={item.description}>{item.description || `Producto #${item.productId}`}</span>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    <span className="font-bold text-white/70">Cantidad:</span> {Number(item.quantity)} x ${ethers.formatUnits(item.unitPrice, 6)}
                                                                </div>
                                                            </div>
                                                            <div className="font-mono text-white font-bold">
                                                                ${ethers.formatUnits(item.totalItem, 6)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs font-bold">
                                                    <span>IVA Generado</span>
                                                    <span>${order.iva}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 opacity-100 transition-opacity">
                                            <button
                                                onClick={() => alert("Simulación: Descargando PDF del SRI... ✅")}
                                                className="h-10 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" /> PDF SRI
                                            </button>
                                            <button
                                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                {expandedOrderId === order.id ? "Ocultar" : "Ver Detalle"}
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                        }
                    </div >

                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/50 border border-white/10 backdrop-blur-md shadow-xl p-8 rounded-lg h-fit">
                            <div className="flex items-center gap-3 mb-6 font-bold text-lg">
                                <User className="w-5 h-5 text-primary" /> Datos de Facturación
                            </div>

                            <form onSubmit={handleRegister} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Nombre Completo / Razón Social</label>
                                    <input
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm focus:border-primary outline-none transition-all disabled:opacity-50"
                                        placeholder="Ej: Juan Pérez"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={isRegistered || isRegistering}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">ID / Cédula</label>
                                        <input
                                            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm focus:border-primary outline-none transition-all disabled:opacity-50"
                                            placeholder="1234567890"
                                            value={formData.idNumber}
                                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                            disabled={isRegistered || isRegistering}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Celular</label>
                                        <input
                                            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm focus:border-primary outline-none transition-all disabled:opacity-50"
                                            placeholder="09..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            disabled={isRegistered || isRegistering}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Email</label>
                                    <input
                                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm focus:border-primary outline-none transition-all disabled:opacity-50"
                                        type="email"
                                        placeholder="email@ejemplo.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={isRegistered || isRegistering}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Dirección</label>
                                    <textarea
                                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-primary outline-none transition-all min-h-[80px] disabled:opacity-50"
                                        placeholder="Ej: Av. Principal y Calle B"
                                        value={formData.streets}
                                        onChange={(e) => setFormData({ ...formData, streets: e.target.value })}
                                        disabled={isRegistered || isRegistering}
                                        required
                                    />
                                </div>

                                {!isRegistered && (
                                    <button
                                        type="submit"
                                        disabled={isRegistering}
                                        className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-all mt-2 disabled:opacity-50"
                                    >
                                        {isRegistering ? "Registrando..." : "Guardar mis Datos"}
                                    </button>
                                )}

                                {isRegistered && (
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-200 text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Tus datos están verificados.
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    );
}


