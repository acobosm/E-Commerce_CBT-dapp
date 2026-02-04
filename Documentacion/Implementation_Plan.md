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

## 💳 Parte 2: App de Compra de Stablecoins (Siguiente Paso)

El objetivo es permitir la entrada de capital tradicional (Fiat) al sistema mediante integración con Stripe.

### Frontend & Backend (Next.js)
- [ ] **Stripe Integration**: Configuración de `PaymentIntent` y Stripe Elements.
- [ ] **MetaMask Web3**: Conexión de billetera para recibir los tokens.
- [ ] **Automated Minting**: Backend seguro que ejecuta la función `mint` tras la confirmación del pago en Stripe.

### Verificación Planeada
- Simulación de pagos con tarjetas de prueba.
- Verificación de la recepción automática de tokens en la wallet del cliente.

---

## 🛒 Próximas Fases:
- **Parte 3:** Pasarela de Pago con Tokens.
- **Parte 4:** Smart Contracts de E-Commerce (Lógica de Negocio).
- **Parte 5 & 6:** Paneles Web (Admin y Cliente).
