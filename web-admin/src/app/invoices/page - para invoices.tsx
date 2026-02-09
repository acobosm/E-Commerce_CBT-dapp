"use client";

import { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, Cardheader, CardTitle, CardDescription } from "@/components/ui/Card";
import { FileText, Search, Loader2, Receipt, AlertCircle } from "lucide-react";
import { ethers } from "ethers";

export default function InvoicesPage() {
    const { contract, isAdmin, loading: web3Loading } = useWeb3();

    const [ruc, setRuc] = useState("");
    const [invoiceId, setInvoiceId] = useState("");

    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !ruc || !invoiceId) return;

        try {
            setLoading(true);
            setError(null);
            setInvoiceData(null);

            // Key format: RUC-INVOICE_ID
            const key = `${ruc}-${invoiceId}`;
            const data = await contract.getInvoice(key);

            // Check if exists (timestamp > 0)
            if (data.timestamp > 0) {
                setInvoiceData(data);
            } else {
                setError("Factura no encontrada o inválida.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Error al consultar factura.");
        } finally {
            setLoading(false);
        }
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
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Auditoría de Facturas</h1>
                <p className="text-muted-foreground">Consulte documentos electrónicos emitidos.</p>
            </div>

            <Card>
                <Cardheader>
                    <CardTitle>Búsqueda de Documento</CardTitle>
                    <CardDescription>Ingrese el RUC del emisor y el número de factura.</CardDescription>
                </Cardheader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">RUC Emisor</label>
                            <Input
                                value={ruc}
                                onChange={(e) => setRuc(e.target.value)}
                                placeholder="179..."
                            />
                        </div>
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">No. Factura</label>
                            <Input
                                value={invoiceId}
                                onChange={(e) => setInvoiceId(e.target.value)}
                                placeholder="001-001-000000001"
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </form>
                    {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                </CardContent>
            </Card>

            {invoiceData && (
                <Card className="glass-card animate-accordion-down border-l-4 border-l-primary/50">
                    <Cardheader className="border-b border-white/10 bg-black/20 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Receipt className="h-5 w-5" /> Factura No. {invoiceData.invoiceId}
                                </CardTitle>
                                <CardDescription>Emisor: {invoiceData.companyRuc}</CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                    {ethers.formatUnits(invoiceData.totalAmount, 6)} CBT
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(Number(invoiceData.timestamp) * 1000).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </Cardheader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Cliente (Wallet):</span>
                                <span className="font-mono text-xs break-all">{invoiceData.customerWallet}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Hash Transacción:</span>
                                <span className="font-mono text-xs break-all text-blue-400">{invoiceData.txHash}</span>
                            </div>
                        </div>

                        <div className="border rounded-md border-white/10 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="p-2 text-left">Descripción</th>
                                        <th className="p-2 text-center">Cant.</th>
                                        <th className="p-2 text-right">P. Unit</th>
                                        <th className="p-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* Note: invoiceData.details is an array of structs */}
                                    {invoiceData.details && invoiceData.details.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="p-2">{item.description}</td>
                                            <td className="p-2 text-center">{Number(item.quantity)}</td>
                                            <td className="p-2 text-right">{ethers.formatUnits(item.unitPrice, 6)}</td>
                                            <td className="p-2 text-right">{ethers.formatUnits(item.totalItem, 6)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-1 text-sm border-t border-white/10 pt-4 flex flex-col items-end">
                            <div className="flex justify-between w-48">
                                <span className="text-muted-foreground">Subtotal 0%:</span>
                                <span>{ethers.formatUnits(invoiceData.subtotal0, 6)}</span>
                            </div>
                            <div className="flex justify-between w-48">
                                <span className="text-muted-foreground">Subtotal 15%:</span>
                                <span>{ethers.formatUnits(invoiceData.subtotal15, 6)}</span>
                            </div>
                            <div className="flex justify-between w-48">
                                <span className="text-muted-foreground">IVA (15%):</span>
                                <span>{ethers.formatUnits(invoiceData.ivaAmount, 6)}</span>
                            </div>
                            <div className="flex justify-between w-48 font-bold text-lg pt-2 border-t border-white/10 mt-2">
                                <span>Total:</span>
                                <span>{ethers.formatUnits(invoiceData.totalAmount, 6)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
