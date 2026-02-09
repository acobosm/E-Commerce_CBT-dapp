"use client";

import { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, Cardheader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Building2, Search, PlusCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { ethers } from "ethers";

export default function CompaniesPage() {
    const { contract, isAdmin, loading: web3Loading } = useWeb3();

    // Register Form State
    const [formData, setFormData] = useState({
        ruc: "",
        name: "",
        wallet: "",
        streets: "",
        phone: "",
        description: "",
        email: "",
        logoUrl: ""
    });
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

    // Search State
    const [searchRuc, setSearchRuc] = useState("");
    const [searchResult, setSearchResult] = useState<any>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !isAdmin) return;

        try {
            setRegisterLoading(true);
            setRegisterSuccess(null);

            const tx = await contract.registerCompany(
                formData.ruc,
                formData.name,
                formData.wallet,
                formData.streets,
                formData.phone,
                formData.description,
                formData.email,
                formData.logoUrl
            );

            await tx.wait();
            setRegisterSuccess(`Compañía ${formData.name} registrada exitosamente.`);
            setFormData({
                ruc: "", name: "", wallet: "", streets: "", phone: "", description: "", email: "", logoUrl: ""
            });
        } catch (err: any) {
            console.error(err);
            alert("Error al registrar: " + (err.reason || err.message));
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!contract || !searchRuc) return;

        try {
            setSearchLoading(true);
            setSearchResult(null);
            setSearchError(null);

            // Call companies mapping
            // Mapping returns a struct. Ethers returns a Result object (array-like).
            // Struct: ruc, name, wallet, isActive, ...
            const companyData = await contract.companies(searchRuc);

            // Check if valid (ruc should not be empty)
            if (!companyData || !companyData[0]) {
                setSearchError("Empresa no encontrada.");
                return;
            }

            // Format data
            // Note: The struct order depends on Solidity definition.
            // 0: ruc, 1: name, 2: wallet, 3: isActive, ...
            // Better to log it first to be sure or use object destructuring with named keys if ABI supports it (Ethers v6 usually does).

            setSearchResult({
                ruc: companyData.ruc || companyData[0],
                name: companyData.name || companyData[1],
                wallet: companyData.wallet || companyData[2],
                isActive: companyData.isActive || companyData[3],
                // ... other fields
            });

        } catch (err: any) {
            console.error(err);
            setSearchError("Error buscando empresa.");
        } finally {
            setSearchLoading(false);
        }
    };

    if (web3Loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!isAdmin) {
        return (
            <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-red-400">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <h2 className="text-xl font-bold">Acceso Denegado</h2>
                    <p>Solo el administrador (Cuenta 0) puede gestionar compañías.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Compañías</h1>
                <p className="text-muted-foreground">Registre nuevas empresas o consulte el estado de las existentes.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* REGISTER FORM */}
                <Card>
                    <Cardheader>
                        <CardTitle className="flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-primary" /> Nuevo Registro
                        </CardTitle>
                        <CardDescription>Dar de alta un RUC en la Blockchain.</CardDescription>
                    </Cardheader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">RUC</label>
                                    <Input
                                        placeholder="17900..."
                                        value={formData.ruc}
                                        onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre Comercial</label>
                                    <Input
                                        placeholder="Empresa S.A."
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Wallet (Dueño)</label>
                                <Input
                                    placeholder="0x..."
                                    value={formData.wallet}
                                    onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="contacto@empresa.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Teléfono</label>
                                    <Input
                                        placeholder="099..."
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dirección</label>
                                <Input
                                    placeholder="Av. Amazonas y..."
                                    value={formData.streets}
                                    onChange={(e) => setFormData({ ...formData, streets: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descripción</label>
                                <Input
                                    placeholder="Venta de..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={registerLoading}>
                                {registerLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                                    </>
                                ) : (
                                    "Registrar en Blockchain"
                                )}
                            </Button>

                            {registerSuccess && (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2 text-green-500 text-sm">
                                    <CheckCircle2 className="h-4 w-4" /> {registerSuccess}
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* SEARCH & DETAILS */}
                <div className="space-y-6">
                    <Card>
                        <Cardheader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5 text-primary" /> Consultar Empresa
                            </CardTitle>
                            <CardDescription>Verificar estado y datos por RUC.</CardDescription>
                        </Cardheader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ingrese RUC..."
                                    value={searchRuc}
                                    onChange={(e) => setSearchRuc(e.target.value)}
                                />
                                <Button onClick={handleSearch} disabled={searchLoading} variant="secondary">
                                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                                </Button>
                            </div>
                            {searchError && (
                                <p className="text-sm text-red-400 mt-2">{searchError}</p>
                            )}
                        </CardContent>
                    </Card>

                    {searchResult && (
                        <Card className="glass-card animate-accordion-down">
                            <Cardheader>
                                <CardTitle>{searchResult.name}</CardTitle>
                                <CardDescription className="font-mono">{searchResult.ruc}</CardDescription>
                            </Cardheader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-muted-foreground">Wallet:</span>
                                    <span className="font-mono text-xs">{searchResult.wallet}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-muted-foreground">Estado:</span>
                                    <span className={searchResult.isActive ? "text-green-500 font-bold" : "text-red-500"}>
                                        {searchResult.isActive ? "ACTIVO" : "INACTIVO"}
                                    </span>
                                </div>
                                {/* TODO: Add more fields if needed */}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
