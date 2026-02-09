"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, Cardheader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Package, Plus, Loader2, CheckCircle2, Building2, AlertCircle } from "lucide-react";
import { ethers } from "ethers";

interface CompanyOption {
    ruc: string;
    name: string;
}

interface ProductItem {
    id: number;
    name: string;
    price: string;
    stock: number;
    isActive: boolean;
}

export default function ProductsPage() {
    const { contract, isAdmin, loading: web3Loading } = useWeb3();

    // Company Selection State
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [selectedCompanyRuc, setSelectedCompanyRuc] = useState("");
    const [isCompaniesLoading, setIsCompaniesLoading] = useState(false);

    // Product List State
    const [companyProducts, setCompanyProducts] = useState<ProductItem[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Product Form State
    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        stock: "",
        iva: "15" // Default 15%
    });

    const [submitLoading, setSubmitLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    // Load companies from events
    useEffect(() => {
        const fetchCompanies = async () => {
            if (!contract) return;
            try {
                setIsCompaniesLoading(true);
                const filter = contract.filters.CompanyRegistered();
                const events = await contract.queryFilter(filter);

                const loadedCompanies: CompanyOption[] = events.map((event: any) => {
                    return {
                        ruc: event.args[0],
                        name: event.args[1]
                    };
                });

                setCompanies(loadedCompanies);
            } catch (err) {
                console.error("Error fetching companies from events:", err);
            } finally {
                setIsCompaniesLoading(false);
            }
        };

        fetchCompanies();
    }, [contract]);

    // Fetch Products when a Company is selected
    useEffect(() => {
        const fetchProductsByRuc = async () => {
            if (!contract || !selectedCompanyRuc) {
                setCompanyProducts([]);
                return;
            }

            try {
                setIsLoadingProducts(true);
                setCompanyProducts([]);

                // 1. Get all ProductAdded events
                // Event signature: event ProductAdded(uint256 id, string name, string companyRuc);
                const filter = contract.filters.ProductAdded();
                const events = await contract.queryFilter(filter);

                // 2. Filter locally by RUC (OR use indexed filter if topic available, local is safer for unindexed strings)
                const relevantEvents = events.filter((e: any) => e.args[2] === selectedCompanyRuc);

                // 3. Fetch current details for each product (to get price/stock/active status)
                const productsData: ProductItem[] = [];

                for (const ev of relevantEvents) {
                    const pId = ev.args[0];
                    // Call contract.products(id)
                    const pData = await contract.products(pId);

                    if (pData.companyRuc === selectedCompanyRuc) { // Double check
                        productsData.push({
                            id: Number(pId),
                            name: pData.name,
                            price: ethers.formatUnits(pData.price_1, 6), // Assume 6 decimals
                            stock: Number(pData.stock),
                            isActive: pData.isActive
                        });
                    }
                }

                setCompanyProducts(productsData);

            } catch (err) {
                console.error("Error fetching products:", err);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchProductsByRuc();
    }, [contract, selectedCompanyRuc, success]); // Re-fetch on success (new product added)


    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !isAdmin || !selectedCompanyRuc) return;

        try {
            setSubmitLoading(true);
            setSuccess(null);

            const priceInUnits = ethers.parseUnits(productForm.price, 6);
            const photos = ["", "", "", ""];

            const tx = await contract.addProduct(
                selectedCompanyRuc,
                productForm.name,
                photos,
                priceInUnits,
                parseInt(productForm.stock),
                parseInt(productForm.iva)
            );

            await tx.wait();
            setSuccess("Producto agregado exitosamente al catálogo.");
            setProductForm({ name: "", price: "", stock: "", iva: "15" });

        } catch (err: any) {
            console.error(err);
            alert("Error al crear producto: " + (err.reason || err.message));
        } finally {
            setSubmitLoading(false);
        }
    };

    if (web3Loading) return <div className="p-12"><Loader2 className="animate-spin" /></div>;

    if (!isAdmin) {
        return (
            <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-red-400">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <h2 className="text-xl font-bold">Acceso Denegado</h2>
                    <p>Solo el administrador (Cuenta 0) puede gestionar productos.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
                <p className="text-muted-foreground">Administración del catálogo global.</p>
            </div>

            <Card>
                <Cardheader>
                    <CardTitle>1. Seleccionar Empresa</CardTitle>
                    <CardDescription>Elija la empresa propietaria del producto.</CardDescription>
                </Cardheader>
                <CardContent>
                    {isCompaniesLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando lista de empresas...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Empresa Registrada</label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    value={selectedCompanyRuc}
                                    onChange={(e) => setSelectedCompanyRuc(e.target.value)}
                                >
                                    <option value="">-- Seleccione una empresa --</option>
                                    {companies.map((comp) => (
                                        <option key={comp.ruc} value={comp.ruc}>
                                            {comp.name} (RUC: {comp.ruc})
                                        </option>
                                    ))}
                                </select>
                                <Building2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                            {companies.length === 0 && (
                                <p className="text-xs text-yellow-500 mt-1">
                                    No se encontraron empresas registradas en el historial.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
                {selectedCompanyRuc && (
                    <div className="px-6 pb-6 text-green-500 flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="h-4 w-4" /> Empresa seleccionada: <strong>{companies.find(c => c.ruc === selectedCompanyRuc)?.name}</strong>
                    </div>
                )}
            </Card>

            {selectedCompanyRuc && (
                <div className="grid gap-8 animate-accordion-down">
                    {/* FORMULARIO */}
                    <Card>
                        <Cardheader>
                            <CardTitle>2. Detalles del Producto</CardTitle>
                        </Cardheader>
                        <CardContent>
                            <form onSubmit={handleAddProduct} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre del Producto</label>
                                    <Input
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        required
                                        placeholder="Ej: Laptop Gamer"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Precio (CBT)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                            required
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Stock Inicial</label>
                                        <Input
                                            type="number"
                                            value={productForm.stock}
                                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                            required
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">IVA (%)</label>
                                        <div className="relative">
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                                value={productForm.iva}
                                                onChange={(e) => setProductForm({ ...productForm, iva: e.target.value })}
                                            >
                                                <option value="15" className="bg-background">15% (Estándar)</option>
                                                <option value="0" className="bg-background">0% (Exento)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full mt-4" disabled={submitLoading}>
                                    {submitLoading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Agregar al Catálogo
                                </Button>

                                {success && (
                                    <div className="mt-4 p-3 bg-green-500/10 text-green-500 rounded flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" /> {success}
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* LISTA DE INVENTARIO */}
                    <Card>
                        <Cardheader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" /> Inventario Actual
                            </CardTitle>
                            <CardDescription>Productos registrados bajo este RUC.</CardDescription>
                        </Cardheader>
                        <CardContent>
                            {isLoadingProducts ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Cargando inventario...
                                </div>
                            ) : companyProducts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    No hay productos registrados para esta empresa.
                                </div>
                            ) : (
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="p-3 text-left font-medium">ID</th>
                                                <th className="p-3 text-left font-medium">Producto</th>
                                                <th className="p-3 text-right font-medium">Precio (CBT)</th>
                                                <th className="p-3 text-center font-medium">Stock</th>
                                                <th className="p-3 text-center font-medium">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {companyProducts.map((prod) => (
                                                <tr key={prod.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="p-3 font-mono text-xs">{prod.id}</td>
                                                    <td className="p-3 font-medium">{prod.name}</td>
                                                    <td className="p-3 text-right">{prod.price}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={prod.stock < 10 ? "text-red-500 font-bold" : "text-green-500"}>
                                                            {prod.stock}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${prod.isActive
                                                                ? "bg-green-500/10 text-green-500"
                                                                : "bg-red-500/10 text-red-500"
                                                            }`}>
                                                            {prod.isActive ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
