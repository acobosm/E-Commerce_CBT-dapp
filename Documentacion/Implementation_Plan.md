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

## 🛒 Próximas Fases:
- **Parte 4:** Smart Contracts de E-Commerce (Lógica de Negocio) (Siguiente Paso).
- **Parte 5 & 6:** Paneles Web (Admin y Cliente).
