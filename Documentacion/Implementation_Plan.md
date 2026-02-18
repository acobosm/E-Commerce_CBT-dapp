# Plan de Implementación Maestro: E-Commerce Blockchain

Este documento detalla la hoja de ruta técnica y el progreso histórico del proyecto. Se actualiza de forma acumulativa para servir como base para el informe final de ingeniería.

---

## 🏗️ Fase 0: Infraestructura y Estructura Base (Completado)

Esta fase inicial se centró en establecer los cimientos del ecosistema multiproyecto.

### Scaffolding del Proyecto
- [x] **Directorios Raíz**: Creación de `stablecoin/`, `sc-ecommerce/`, `web-admin/` y `web-customer/`.
- [x] **Foundry Setup**: Inicialización de entornos de desarrollo de Smart Contracts en `stablecoin/sc` y `sc-ecommerce`.
- [x] **Dependencias**: Instalación manual de `forge-std` y OpenZeppelin vía npm para superar restricciones de red.

---

## 🪙 Parte 1: CBToken - Stablecoin ERC20 (Completado)

Implementación del motor económico del proyecto: el CBToken (CBT), anclado al dólar (1:1).

### Smart Contract: CBToken.sol
- [x] **Herencia**: Extensión de `ERC20` y `Ownable` de OpenZeppelin.
- [x] **Precisión**: Configuración fija de 6 decimales para representar centavos.
- [x] **Gobernanza**: Función `mint` protegida para el control de la oferta monetaria.

### Calidad y Pruebas
- [x] **Tests Automatizados**: Implementación de `CBToken.t.sol` con 100% de éxito en:
  - Inicialización de metadatos.
  - Seguridad en la función de minteo.
  - Lógica de transferencias estándar.
- [x] **Script de Despliegue**: Creación de `DeployCBToken.s.sol` optimizado para la red local Anvil.

> [!NOTE]
> **Punto de Control Técnico:** El contrato ha sido verificado en Anvil con un balance inicial de 1,000,000 CBT para el propietario.

---

## 💳 Parte 2: App de Compra de Stablecoins (Completado)

El objetivo era permitir la entrada de capital tradicional (Fiat) al sistema mediante integración con Stripe.

### Frontend & Backend (Next.js)
- [x] **Stripe Integration**: Configuración de `PaymentIntent` y Stripe Elements.
- [x] **MetaMask Web3**: Conexión de billetera para recibir los tokens.
- [x] **Automated Minting**: Backend seguro que ejecuta la función `mint` tras la confirmación del pago en Stripe.
- [x] **UI Responsiva**: Layout adaptable que garantiza legibilidad en todas las resoluciones.

### Verificación Final
- [x] Validación de variables de entorno configuradas con llaves de prueba de Stripe.
- [x] Build de Next.js generado exitosamente.
- [x] Confirmación de minteo exitoso verificado vía `cast call` (Saldos actualizados correctamente).
- [x] Validación visual de la interfaz corregida.


---

## 🛡️ Parte 3: Pasarela de Pago con Tokens (Completado)

El objetivo era crear una aplicación independiente que sirva como procesador de pagos para el e-commerce, permitiendo transacciones directas con CBTokens.

### Funcionalidades Core
- [x] **Next.js Scaffolding**: Inicialización del proyecto en `stablecoin/pasarela-de-pago`.
- [x] **Web3 Integration**: Conexión con MetaMask y detección de red Anvil.
- [x] **Payment Workflow**: 
  - Consultar balance de CBT del usuario.
  - Ejecutar transacciones de pago (transferencias) hacia la wallet del comercio.
  - Gestión de estados (Pendiente, Exitoso, Fallido).
- [x] **Redirección e Interfaz**: UI consistente con el portal de compra y redirección inteligente tras confirmación.

### Verificación Exitosa
- [x] Build exitoso de Next.js generado sin errores.
- [x] Validación de la lógica de transferencia hacia la `MERCHANT_ADDRESS`.
- [x] Consistencia visual mantenida (Header, Footer y diseño Mesh).

### Fase 3.1: Refinamiento de Usabilidad
- [x] **Transparencia de Wallet**: Etiquetas explícitas para dirección y saldo.
- [x] **UX de Error**: Inclusión del saldo actual en el mensaje de error de fondos insuficientes.
- [x] **Acciones Dinámicas**: Botón de desconexión y enlace a portal de compra (:6001).
- [x] **Ajuste de Layout**: Tarjeta ensanchada para mejor legibilidad.

---

## 🏪 Parte 4: Smart Contracts de E-Commerce (Completado)

Implementación de la lógica de negocio completa del marketplace descentralizado con cumplimiento normativo ecuatoriano (SRI).

### Arquitectura Modular
- [x] **Librerías Especializadas**: 
  - `CompanyLib.sol`: Gestión de empresas y comisiones dinámicas.
  - `ProductLib.sol`: Catálogo y precios por volumen.
  - `InvoiceLib.sol`: Generación de facturas con formato SRI.
  - `ClientLib.sol`: Datos de facturación del comprador.
  - `CartLib.sol`: Gestión de carrito on-chain.

### Contrato Principal: Ecommerce.sol
- [x] **Orquestación de Pagos**: Split automático 90% vendedor / 10% plataforma.
- [x] **Cumplimiento SRI**: Facturación secuencial por empresa (formato `001-001-000000001`).
- [x] **Cálculo de IVA**: Segregación de productos con IVA 0% y 15%.
- [x] **Control de Acceso**: Roles diferenciados (Admin, Vendedor, Cliente).

### Calidad y Pruebas
- [x] **Tests Exhaustivos** (`Ecommerce.t.sol`):
  - `testRegisterCompany`: Registro exitoso de RUC y datos de empresa.
  - `testAddProductPermissions`: Validación de roles (Admin vs Vendedor).
  - `testStockSafety`: Protección contra compras superiores al inventario disponible.
  - `testFullPurchaseAndSplit`: Venta completa con cálculo de IVA y reparto automático de fondos.
  - `testUpdateProductPermissions`: **(Nuevo)** Validación de permisos diferenciados para edición (Admin vs Propietario).
  - `testUpdateCompanyWallet`: **(Nuevo)** Lógica de sincronización de billetera para corregir desfasas en la red Anvil.
- [x] **Gestión de Carrito y Errores** (`CartTest.t.sol`): **(Nuevo)**
  - Implementación de tests específicos para `removeFromCart` y `clearCart` tras la corrección del bloqueo por "carrito mixto".
  - Verificación de eliminación parcial y total de ítems.
- [x] **Refactorización por Límite de Stack**: Reestructuración de la función `checkout` en sub-funciones internas para resolver el error "Stack too deep" tras la adición de nueva lógica.
- [x] **Getter Especializado**: Implementación de `getProductPhotos` para permitir la auditoría de metadatos de imágenes desde el frontend y tests.

### Script de Despliegue
- [x] **DeployEcommerce.s.sol**: Script parametrizado que recibe la dirección de CBToken como variable de entorno.

---

## 🔐 Parte 5: Panel de Administración Web (Completado)

Desarrollo del backend administrativo con seguridad por roles (RBAC on-chain) y UX avanzada basada en eventos de blockchain.

### Componentes Clave Desarrollados

#### 1. Seguridad por Roles
- [x] **Verificación On-Chain**: El panel verifica en tiempo real si la wallet conectada es el `owner()` del contrato.
- [x] **Barreras Visuales**: Pantalla roja de "Acceso Denegado" para usuarios no autorizados.
- [x] **Indicador Dinámico de Rol**: Badge que muestra "Administrador" (AD) o "Usuario" (US) según permisos.

#### 2. Gestión de Empresas
- [x] **Registro de RUCs**: Formulario para dar de alta nuevas empresas en el sistema.
- [x] **Consulta de Estado**: Visualización de empresas registradas.

#### 3. Gestión de Productos
- [x] **Dropdown Dinámico**: Lectura de eventos `CompanyRegistered` para poblar selector de empresas.
- [x] **Formulario de Creación**: Alta de productos con validación de campos.
- [x] **Inventario en Tiempo Real**: Tabla que reconstruye el stock leyendo eventos `ProductAdded` históricos y consultando el estado actual con `contract.products(id)`.

#### 4. Auditoría de Facturas
- [x] **Visualizador de Facturas**: Módulo preparado para consultar documentos por clave compuesta (RUC + Secuencial).

#### 5. UI Premium
- [x] **Diseño**: Glassmorphism + Dark Mode.
- [x] **Navegación**: Sidebar con indicadores de sección activa.
- [x] **Responsividad**: Layout adaptable a móviles y escritorio.

### Diagrama de Arquitectura
- [x] **Diagrama de Secuencia**: Flujo de lectura de eventos para reconstruir inventario sin gastar gas.

---

- [x] UI consistente con el diseño premium de las apps existentes.
- [x] **Panel Vendedor**: Gestión de productos propios y visualización de ventas.
- [x] **Membresía VIP**: Sistema de suscripción para eliminar comisiones (10% -> 0%).

### Fase 6.1: Refinamiento de Membresía VIP
- [x] **Lógica de Tiempo**: Implementación de visualización explícita de expiración.
    - **Huso Horario**: El contrato calcula el domingo a las 23:59:59 UTC.
    - **Conversión Local**: El frontend traduce esto automáticamente a las 18:59:59 ECT (Ecuador Time), garantizando claridad absoluta para el usuario.
- [x] **Verificación On-Chain**: Comprobación exitosa de transferencia de 500 CBT y cobro de comisión 0% en ventas reales.

---

## ⚙️ Parte 7: Integración y Automatización (Parcialmente Completado)

**Estado:** Scripts de automatización implementados. Funciones opcionales pendientes.

### Completado ✅

#### Scripts de Automatización
- [x] **`restart-all.sh`**: Script maestro de despliegue y arranque.
  - [x] Soporte para flag `--seed` para carga automática de datos.
- [x] **`stop-all.sh`**: Script de detención limpia.

#### Sistema de Simulación y Contabilidad (Nuevo)
- [x] **Motor de Seeding**: Implementación de `SeedSimulation.s.sol` para poblado dinámico de datos.
- [x] **Configuración en JSON**: Creación de `seed-data.json` para desacoplar datos de la lógica.
- [x] **Reporte Contable**: Implementación de `update-accounting.sh` que genera reportes CSV basados en eventos on-chain, permitiendo auditoría de comisiones del SRI.

#### Prerequisitos
- [x] **Instalación de `jq`**: Herramienta para parseo de JSON.
```bash
  sudo apt-get update && sudo apt-get install -y jq
  ```

#### Persistencia de Estado
- [x] **`e-commerce_state.json`**: Configuración de Anvil para guardar el estado completo de la blockchain local.
- [x] **`deployed-addresses.json`**: Caché de direcciones de contratos desplegados para evitar redespliegues innecesarios.

#### Gestión de Logs
- [x] **Carpeta `logs/`**: Centralización de logs de todos los servicios.
- [x] **`.gitignore`**: Actualizado para excluir logs y estado de Anvil.

### Pendiente ⏳
- [ ] Implementar soporte multi-moneda (Bonus).
- [ ] Implementar sistema de reseñas de productos (Bonus).
- [ ] Implementar recompensas Loyalty/NFT (Bonus).

---

## 📝 Próximas Fases

1. **Parte 7 (Bonus):** Implementación de funciones opcionales (Reseñas, Multi-moneda o Loyalty).
2. **Parte 8:** Revisión final E2E y documentación de entrega.
3. **Parte 9:** Preparación y grabación del video demostrativo.
