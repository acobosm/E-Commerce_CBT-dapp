"use client";

import { useState, useEffect, Fragment } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, Cardheader, CardTitle, CardDescription } from "@/components/ui/Card";
import { FileText, Search, Loader2, Receipt, AlertCircle, Building2, Eye } from "lucide-react";
import { ethers } from "ethers";

interface CompanyOption {
    ruc: string;
    name: string;
}

interface InvoiceSummary {
    companyRuc: string;
    invoiceId: string;
    buyer: string;
    buyerName?: string;
    total: string;
    timestamp?: number; // Optional, requires fetching block
    txHash: string;
}

export default function InvoicesPage() {
    const { contract, isAdmin, loading: web3Loading } = useWeb3();

    // Filters
    const [selectedCompanyRuc, setSelectedCompanyRuc] = useState("");
    const [searchInvoiceId, setSearchInvoiceId] = useState("");

    // Data
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [allInvoices, setAllInvoices] = useState<InvoiceSummary[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<InvoiceSummary[]>([]);

    // Detail View
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [expandedInvoiceKey, setExpandedInvoiceKey] = useState<string | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    // Initial Loading
    const [isInitialLoading, setIsInitialLoading] = useState(false);

    // 1. Fetch Companies and All Invoices on Load
    useEffect(() => {
        const initData = async () => {
            if (!contract) return;

            try {
                setIsInitialLoading(true);

                // A. Fetch Companies
                const companyFilter = contract.filters.CompanyRegistered();
                const companyEvents = await contract.queryFilter(companyFilter);
                const loadedCompanies: CompanyOption[] = companyEvents.map((event: any) => ({
                    ruc: event.args[0],
                    name: event.args[1]
                }));
                setCompanies(loadedCompanies);

                // B. Fetch All Purchase Events
                const purchaseFilter = contract.filters.PurchaseCompleted();
                const purchaseEvents = await contract.queryFilter(purchaseFilter);

                // C. Resolve Hashes (because CompanyRuc is hashed in logs)
                const rucMap: Record<string, string> = {};
                loadedCompanies.forEach(comp => {
                    const hash = ethers.keccak256(ethers.toUtf8Bytes(comp.ruc));
                    rucMap[hash] = comp.ruc;
                });

                // D. Resolve Buyer Names
                const buyerAddresses = Array.from(new Set(purchaseEvents.map((e: any) => e.args[0])));
                const nameMap: Record<string, string> = {};
                await Promise.all(buyerAddresses.map(async (addr: any) => {
                    try {
                        const profile = await contract.clients(addr);
                        nameMap[addr] = profile.name || "Cliente Sin Perfil";
                    } catch (e) {
                        nameMap[addr] = "Error al Cargar";
                    }
                }));

                const loadedInvoices: InvoiceSummary[] = purchaseEvents.map((event: any) => {
                    const rucHashOrTopic = event.args[1];
                    // Ethers v6 indexed strings are returned as objects with a 'hash' property
                    const targetHash = typeof rucHashOrTopic === 'string' ? rucHashOrTopic : (rucHashOrTopic?.hash || "");
                    const resolvedRuc = rucMap[targetHash] || "Unknown";

                    return {
                        companyRuc: resolvedRuc,
                        invoiceId: event.args[2],
                        buyer: event.args[0],
                        buyerName: nameMap[event.args[0]],
                        total: ethers.formatUnits(event.args[3], 6),
                        txHash: event.transactionHash
                    };
                });

                // Sort by invoiceId desc or block (reverse array)
                setAllInvoices(loadedInvoices.reverse());
                setFilteredInvoices(loadedInvoices.reverse());

            } catch (err) {
                console.error("Error loading initial data:", err);
            } finally {
                setIsInitialLoading(false);
            }
        };

        if (contract) {
            initData();
        }
    }, [contract]);

    // 2. Filter Logic
    useEffect(() => {
        let results = allInvoices;

        if (selectedCompanyRuc) {
            results = results.filter(inv => inv.companyRuc === selectedCompanyRuc);
        }

        if (searchInvoiceId) {
            results = results.filter(inv => inv.invoiceId.toLowerCase().includes(searchInvoiceId.toLowerCase()));
        }

        setFilteredInvoices(results);
    }, [selectedCompanyRuc, searchInvoiceId, allInvoices]);


    // 3. View Detail Action
    const handleViewDetail = async (ruc: string, id: string) => {
        if (!contract) return;

        const key = `${ruc}-${id}`;

        if (expandedInvoiceKey === key) {
            setExpandedInvoiceKey(null);
            setInvoiceData(null);
            return;
        }

        try {
            setLoadingDetail(true);
            setDetailError(null);
            setInvoiceData(null);
            setExpandedInvoiceKey(key);

            const data = await contract.getInvoice(key);

            if (data.timestamp > 0) {
                setInvoiceData(data);
            } else {
                setDetailError("Error de integridad: Factura no encontrada en contrato.");
            }
        } catch (err: any) {
            console.error(err);
            setDetailError("Error al consultar cadena de bloques.");
        } finally {
            setLoadingDetail(false);
        }
    };

    // Helper to get Company Name
    const getCompanyName = (ruc: string) => {
        const comp = companies.find(c => c.ruc === ruc);
        return comp ? comp.name : ruc;
    };


    if (web3Loading) return <div className="p-12"><Loader2 className="animate-spin" /></div>;

    if (!isAdmin) {
        return (
            <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-red-400">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <h2 className="text-xl font-bold">Acceso Denegado</h2>
                    <p>Solo el administrador (Cuenta 0) puede auditar facturas.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Auditoría de Facturas</h1>
                <p className="text-muted-foreground">Consulte documentos electrónicos emitidos.</p>
            </div>

            <Card>
                <Cardheader>
                    <CardTitle>Búsqueda de Documento</CardTitle>
                    <CardDescription>Filtre por empresa emisora o número de documento.</CardDescription>
                </Cardheader>
                <CardContent className="space-y-6">
                    {/* FILTERS */}
                    <div className="flex gap-4 items-end bg-muted/20 p-4 rounded-lg">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">Empresa Emisora</label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    value={selectedCompanyRuc}
                                    onChange={(e) => setSelectedCompanyRuc(e.target.value)}
                                >
                                    <option value="">-- Todas las Empresas --</option>
                                    {companies.map((comp) => (
                                        <option key={comp.ruc} value={comp.ruc}>
                                            {comp.name}
                                        </option>
                                    ))}
                                </select>
                                <Building2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">No. Factura (Opcional)</label>
                            <Input
                                value={searchInvoiceId}
                                onChange={(e) => setSearchInvoiceId(e.target.value)}
                                placeholder="Ej: 001-001..."
                            />
                        </div>
                    </div>

                    {/* RESULTS TABLE */}
                    <div className="border rounded-md overflow-hidden animate-in fade-in">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 text-left font-medium">Empresa</th>
                                    <th className="p-3 text-left font-medium">No. Factura</th>
                                    <th className="p-3 text-left font-medium">Cliente</th>
                                    <th className="p-3 text-right font-medium">Total (CBT)</th>
                                    <th className="p-3 text-center font-medium">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isInitialLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando facturas...
                                        </td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                            No se encontraron facturas con los filtros seleccionados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((inv, idx) => {
                                        const isExpanded = expandedInvoiceKey === `${inv.companyRuc}-${inv.invoiceId}`;
                                        return (
                                            <Fragment key={`${inv.companyRuc}-${inv.invoiceId}`}>
                                                <tr className={`hover:bg-muted/50 transition-colors ${isExpanded ? "bg-primary/10 border-l-4 border-l-primary" : ""}`}>
                                                    <td className="p-3">
                                                        <div className="font-medium text-white">{getCompanyName(inv.companyRuc)}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{inv.companyRuc}</div>
                                                    </td>
                                                    <td className="p-3 font-mono">{inv.invoiceId}</td>
                                                    <td className="p-3">
                                                        <div className="font-medium text-white">{inv.buyerName || "Cliente"}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">
                                                            {inv.buyer.substring(0, 6)}...{inv.buyer.substring(inv.buyer.length - 4)}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-green-400">{inv.total}</td>
                                                    <td className="p-3 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetail(inv.companyRuc, inv.invoiceId)}
                                                            disabled={loadingDetail && !isExpanded}
                                                        >
                                                            {loadingDetail && isExpanded ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Eye className={`h-4 w-4 ${isExpanded ? "text-primary" : "text-blue-400"}`} />}
                                                        </Button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (invoiceData || detailError) && (
                                                    <tr className="bg-black/40 animate-in fade-in slide-in-from-top-2">
                                                        <td colSpan={5} className="p-6">
                                                            {loadingDetail ? (
                                                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                                                    <Loader2 className="h-6 w-6 animate-spin mr-3 text-primary" />
                                                                    Consultando detalles en la Blockchain...
                                                                </div>
                                                            ) : detailError ? (
                                                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md flex items-center gap-2">
                                                                    <AlertCircle className="h-4 w-4" /> {detailError}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-6">
                                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                                                        <div className="flex items-center gap-3">
                                                                            <Receipt className="h-8 w-8 text-primary" />
                                                                            <div>
                                                                                <h4 className="font-bold text-white">Detalle de Factura</h4>
                                                                                <p className="text-xs text-muted-foreground">ID Blockchain: {inv.invoiceId}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-sm text-muted-foreground mb-1">
                                                                                {new Date(Number(invoiceData.timestamp) * 1000).toLocaleString()}
                                                                            </div>
                                                                            <code className="text-[10px] text-blue-400 font-mono break-all">{inv.txHash}</code>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm pt-2">
                                                                        <div className="space-y-3">
                                                                            <div>
                                                                                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">Comprador (Wallet)</span>
                                                                                <span className="font-mono text-white break-all">{invoiceData.customerWallet}</span>
                                                                            </div>
                                                                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                                                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">Emisor (RUC)</span>
                                                                                <span className="text-white font-medium">{getCompanyName(invoiceData.companyRuc)}</span>
                                                                                <div className="text-xs text-muted-foreground font-mono">{invoiceData.companyRuc}</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="bg-black/30 rounded-xl overflow-hidden border border-white/10">
                                                                            <table className="w-full text-xs">
                                                                                <thead className="bg-white/5 border-b border-white/10">
                                                                                    <tr>
                                                                                        <th className="p-2 text-left text-muted-foreground">Descripción</th>
                                                                                        <th className="p-2 text-center text-muted-foreground">Cant.</th>
                                                                                        <th className="p-2 text-right text-muted-foreground">Total</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-white/5">
                                                                                    {invoiceData.details && invoiceData.details.map((item: any, i: number) => (
                                                                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                                            <td className="p-2 text-white">{item.description}</td>
                                                                                            <td className="p-2 text-center">{Number(item.quantity)}</td>
                                                                                            <td className="p-2 text-right font-mono font-bold">${ethers.formatUnits(item.totalItem, 6)}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                            <div className="p-4 bg-primary/10 border-t border-white/10 space-y-1">
                                                                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                                                                    <span>Subtotal 15%:</span>
                                                                                    <span>${ethers.formatUnits(invoiceData.subtotal15, 6)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-[10px] text-muted-foreground pb-2 border-b border-white/5">
                                                                                    <span>IVA (15%):</span>
                                                                                    <span>${ethers.formatUnits(invoiceData.ivaAmount, 6)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between font-bold text-white pt-2 text-sm">
                                                                                    <span>TOTAL</span>
                                                                                    <span className="text-primary">${ethers.formatUnits(invoiceData.totalAmount, 6)} CBT</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
