"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, Cardheader, CardTitle } from "@/components/ui/Card";
import { Building2, Package, FileText, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Panel de Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido al sistema de administración del Marketplace Descentralizado.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/companies" className="block group">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <Cardheader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Compañías Registradas
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Cardheader>
            <CardContent>
              <div className="text-2xl font-bold">Gestión</div>
              <p className="text-xs text-muted-foreground">
                Administrar RUCs y accesos
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/products" className="block group">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <Cardheader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inventario Global
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Cardheader>
            <CardContent>
              <div className="text-2xl font-bold">Monitor</div>
              <p className="text-xs text-muted-foreground">
                Verificar stock y precios
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/invoices" className="block group">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <Cardheader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Facturación SRI
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Cardheader>
            <CardContent>
              <div className="text-2xl font-bold">Reportes</div>
              <p className="text-xs text-muted-foreground">
                Auditoría de transacciones
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <Cardheader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </Cardheader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border">
              <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Registrar Nueva Empresa</h3>
                <p className="text-sm text-muted-foreground">
                  Dar de alta un nuevo RUC en la blockchain.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/companies">
                  Comenzar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border">
              <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Verificar Productos</h3>
                <p className="text-sm text-muted-foreground">
                  Consultar detalles y stock de un item.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/products">
                  Consultar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <Cardheader>
            <CardTitle>Estado del Sistema</CardTitle>
          </Cardheader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Red Blockchain</span>
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Anvil Local
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contrato Ecommerce</span>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_ECOMMERCE_ADDRESS?.substring(0, 10)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado Admin</span>
                <span className="text-sm font-medium text-green-400">
                  Activo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
