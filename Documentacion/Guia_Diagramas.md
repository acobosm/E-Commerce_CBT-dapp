# Guía de Arquitectura Visual: E-Commerce DApp

Esta guía contiene los modelos avanzados para documentar tu proyecto como un Arquitecto de Software.

## 1. Diagrama de Base de Datos (ERD - Entity Relationship)
En Blockchain, el "ERD" representa cómo se estructuran los `structs` y `mappings`. Este diagrama es vital para entender la persistencia de datos.

### Código para Eraser (ERD as Code)
```eraser
title ERD
// Tablas de la Blockchain
Company [icon: building] {
  ruc string [pk]
  name     
  wallet address
  establishmentCode string
  nextInvoiceNumber uint256
}

Product [icon: package] {
  id uint256 [pk]
  name string
  price_1 uint256
  stock uint256
  companyRuc string [fk]
  active bool
  iva uint8
}

// Nueva Estructura: CartLib (On-Chain)
Cart [icon: shopping-cart] {
  owner address [pk]
  items CartItem[]
}

Invoice [icon: file-text] {
  invoiceId string [pk]
  companyRuc string [fk]
  customerWallet address
  totalAmount uint256
}

// Relaciones
Company.ruc 1 <> * Product.companyRuc
Company.ruc 1 <> * Invoice.companyRuc
Cart.owner 1 - 1 User
```

---

## 2. Diagrama de Secuencia (El flujo de Pago)
Muestra la interacción temporal entre el Cliente, el Contrato y la Moneda (CBT).

### Código para Eraser (Sequence as Code)
```eraser
// Actores
Comprador [shape: person]
Ecommerce_SC [icon: cpu]
CBToken_SC [icon: dollar]
Vendedor [shape: house]

// Secuencia de Compra
Comprador > Ecommerce_SC: 1. checkout()
Ecommerce_SC > CBToken_SC: 2. transferFrom(Comprador, Vendedor, 90%)
CBToken_SC > Vendedor: 3. Recibe fondos
Ecommerce_SC > CBToken_SC: 4. transferFrom(Comprador, Vault, 10%)
Ecommerce_SC > Comprador: 5. Emite Factura SRI
```

---

## 3. Wireframes (Fase 5: Web Admin)
Esto lo aplicaremos en la siguiente fase. Dibujaremos el esqueleto de:
- Tabla de productos con botón de "Reponer Stock".
- Formulario de "Crear Compañía" (solo para Admin).

---

## 4. Diagrama de Secuencia: Admin Web (Lectura de Eventos)
Este es el mecanismo "Pro" que usamos para listar productos sin gastar gas, leyendo el historial de la Blockchain.

### Código para Eraser (Sequence as Code)
```eraser
// Actores
Admin [shape: person]
WebAdmin_UI [icon: monitor]
Blockchain_Logs [icon: database]
Smart_Contract [icon: cpu]

// Flujo: Carga de Productos
Admin > WebAdmin_UI: 1. Selecciona Empresa (Dropdown)
WebAdmin_UI > Blockchain_Logs: 2. queryFilter(ProductAdded)
Blockchain_Logs > WebAdmin_UI: 3. Retorna Array de Eventos [id, name, ... ]
WebAdmin_UI > Smart_Contract: 4. products(id) [Para validar estado actual]
Smart_Contract > WebAdmin_UI: 5. Retorna { stock, price, active }
WebAdmin_UI > Admin: 6. Muestra Tabla de Inventario
```

---

## 5. Diagrama de Flujo: Script de Automatización (restart-all.sh)

Este diagrama muestra la lógica de decisión del script maestro de despliegue y arranque de toda la plataforma.

### Código para Eraser (Flowchart Coloreado)
```eraser
// Flowchart: restart-all.sh Automation Script
title Automation Flow
Start [shape: oval, icon: play, color: green]
Stop_Processes [icon: x-circle, label: "Detener Procesos\n(Anvil, Next.js, tmux)", color: red]
Start_Anvil [icon: database, label: "Iniciar Anvil\n(con persistencia)", color: blue]
Wait_Anvil [icon: clock, label: "Esperar\n'Anvil Listening'", color: yellow]
Check_Deployed [shape: diamond, label: "¿Existe\ndeployed-addresses.json?", color: purple]

// Casilleros de Decisión Estilo Clásico
SI [label: "SI (Existe)", color: white]
NO [label: "NO (Nuevo)", color: white]

Read_Addresses [icon: file-text, label: "Cargar Direcciones\nExistentes", color: cyan]
Deploy_Full [icon: cpu, label: "Desplegar Contratos\n(Forge Script)", color: orange]
Save_Addresses [icon: save, label: "Guardar Direcciones\nen JSON", color: cyan]

Update_Env [icon: settings, label: "Actualizar .env.local\ny Sincronizar ABIs", color: blue]
Check_Seed [shape: diamond, label: "¿Flag --seed\ndetectado?", color: purple]

// Referencia al sub-proceso [1]
Run_Simulation [icon: play-circle, label: "Ejecutar Simulación\n(run-sim.sh) ❶", color: orange]

Start_Tmux [icon: terminal, label: "Iniciar tmux\n(4 paneles 2x2)", color: blue]
Show_Summary [icon: check-circle, label: "Mostrar Resumen\n(Direcciones + URLs)", color: green]
End [shape: oval, icon: check, color: green]

// Flujo de Control
Start > Stop_Processes > Start_Anvil > Wait_Anvil > Check_Deployed

Check_Deployed > SI
Check_Deployed > NO

SI > Read_Addresses > Update_Env
NO > Deploy_Full > Save_Addresses > Update_Env

// Nueva Lógica de Simulación
Update_Env > Check_Seed
Check_Seed > Run_Simulation: Sí
Check_Seed > Start_Tmux: No
Run_Simulation > Start_Tmux

Start_Tmux > Show_Summary > End
```

> [!TIP]
> ### 🎨 Guía de Colores (Ayuda Memoria)
> Para mantener la consistencia en tus diagramas, usa este estándar:
> - 🟢 **Verde (`green`)**: Puntos de inicio y fin exitosos.
> - 🔴 **Rojo (`red`)**: Acciones de limpieza o detención (procesos que se interrumpen).
> - 🔵 **Azul (`blue`)**: Configuración de entorno y arranque de servicios o apps.
> - 🟡 **Amarillo (`yellow`)**: Esperas activas o verificaciones temporales de sistema.
> - 🟣 **Morado (`purple`)**: Decisiones lógicas o bifurcaciones de flujo (Diamantes).
> - 🟠 **Naranja (`orange`)**: Despliegue de contratos o interacciones profundas con Blockchain.
> - 💠 **Cyan (`cyan`)**: Operaciones de archivo (I/O) como lectura/escritura de JSON/Config.

**Puntos Clave del Flujo:**
- 🔄 **Detección Inteligente:** El script verifica si los contratos ya están desplegados antes de ejecutar `forge script`.
- ⏱️ **Espera Activa:** No usa `sleep` fijo, sino que detecta cuándo Anvil está listo leyendo el log.
- 💾 **Persistencia:** Guarda las direcciones en JSON para evitar redespliegues innecesarios.
- 🛠️ **Automatización Completa:** Actualiza `.env.local` de las 3 apps sin intervención manual.

---

## 6. Cómo subir esto a GitHub (Tips de Arquitecto)

Tienes dos niveles para hacer esto:

### Nivel Profesional (El Código)
1.  Crea una carpeta llamada `Documentacion/diagramas/`.
2.  Crea archivos con extensión `.txt` o `.eraser` (ej: `flujo-pagos.eraser`).
3.  Pega allí el código que te he dado. 
    - **Por qué:** Si mañana cambias el código de Solidity, vienes a este archivo, cambias el nombre del campo, y vuelves a generar la imagen en 2 segundos.

### Nivel Visual (La Imagen)
GitHub no puede "dibujar" el código de Eraser directamente (aunque sí puede dibujar uno llamado **Mermaid**). 
1.  En Eraser, usa **Export -> Raycast/Image**.
2.  Guarda la imagen en `Documentacion/imagenes/`.
3.  En tu `README.md` o `Evidencias_Informe.md`, inserta la imagen así:
    `![Diagrama de Roles](./imagenes/roles.png)`

> [!TIP]
> **El Secreto del Senior:** Un buen repositorio de GitHub tiene una carpeta `/docs` con archivos de texto que generan los diagramas. Esto se llama **"Living Documentation"** (Documentación Viva).

## 7. Diagrama de Secuencia: Smart Cart Sync (Optimización de Gas)

Este diagrama explica la lógica inteligente implementada en el Frontend para evitar duplicar ítems y ahorrar gas, sincronizando solo la diferencia (delta) entre el carrito local y el de la blockchain.

### Código para Eraser (Sequence as Code)
```eraser
title Smart Cart Sync Full Checkout Flow
// Sequence: Full Checkout Flow (3 Transactions)
User [shape: person]
Frontend [icon: monitor]
CBToken_SC [icon: dollar]
Ecommerce_SC [icon: cpu]

// 1. APPROVE (ERC20 Safety)
User > Frontend: 1. Click "Pagar Ahora"
Frontend > CBToken_SC: 2. approve(Ecommerce, TotalAmount)
CBToken_SC > Frontend: 3. Transaction Confirmed (Tx 1/3)

// 2. SMART SYNC (Cart Logic)
Frontend > Ecommerce_SC: 4. getCartItems() [Read-Only]
Ecommerce_SC > Frontend: 5. Return Current On-Chain Cart
Frontend > Frontend: 6. Calculate Delta (Local - OnChain)
Frontend > Ecommerce_SC: 7. addToCart(ItemID, Delta)
Ecommerce_SC > Frontend: 8. Transaction Confirmed (Tx 2/3)

// 3. CHECKOUT (Finalization)
Frontend > Ecommerce_SC: 9. checkout()
Ecommerce_SC > CBToken_SC: 10. transferFrom(User, Seller)
Ecommerce_SC > Frontend: 11. Purchase Completed (Tx 3/3)
Frontend > User: 12. Show Success Modal
``` 

---

## 8. Diagrama de Flujo: ❶ Simulación y Contabilidad (Arquitectura Final)

Este diagrama detalla la lógica interna del proceso de carga de datos y el reporte contable automático.

### Código para Eraser (Flowchart Pro)
```eraser
// Flowchart: Simulation and Accounting System
title ❶ Simulation & Accounting Flow
Seed_JSON [icon: file-json, label: "❶ seed-data.json\n(Plantilla)", color: cyan]
Foundry_Script [icon: cpu, label: "SeedSimulation.s.sol\n(Logic)", color: orange]
Check_Company [shape: diamond, label: "¿RUC ya\nexiste?", color: purple]
Register_Comp [icon: building, label: "Reg. Empresa\n(Admin Role)", color: blue]
Skip_Reg [icon: skip-forward, label: "Saltar Registro", color: yellow]
Add_Products [icon: package, label: "Añadir Catalogo", color: blue]
Fund_Clients [icon: dollar-sign, label: "Fondear Clientes\n(Mint CBT)", color: blue]
Execute_Sales [icon: shopping-cart, label: "Ciclo de Venta\n(Auto-Checkout)", color: green]
Blockchain_Events [icon: database, label: "Blockchain Logs\n(Events)", color: gray]
Bash_Updater [icon: terminal, label: "update-accounting.sh", color: cyan]
Accounting_CSV [icon: file-spreadsheet, label: "accounting.csv\n(Logs Folder)", color: green]

// Flujo de Datos
Seed_JSON > Foundry_Script
Foundry_Script > Check_Company

// Lógica de protección
Check_Company > Register_Comp: No
Check_Company > Skip_Reg: Sí

Register_Comp > Add_Products
Skip_Reg > Add_Products

Add_Products > Fund_Clients
Fund_Clients > Execute_Sales
Execute_Sales > Blockchain_Events

// Proceso de Reporte
Blockchain_Events > Bash_Updater
Bash_Updater > Accounting_CSV
```

### Componentes de la Documentación Viva:
1.  **JSON de Semilla:** Estructura desacoplada de la lógica del contrato.
2.  **Solidity Seeding:** Automatización de orquestación (Approve + Cart + Checkout).
3.  **Bash Accounting:** Extracción de datos "Off-chain" para reportes administrativos.
