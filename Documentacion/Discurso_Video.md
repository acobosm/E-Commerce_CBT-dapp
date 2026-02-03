# Guion para el Video Demostrativo - Proyecto E-Commerce Blockchain

**Tiempo estimado:** 8-10 minutos.

---

### 1. Introducción (0:00 - 1:00)
"Hola a todos. Hoy voy a presentarles mi proyecto de E-Commerce basado en Blockchain y Stablecoins. El objetivo principal es crear un ecosistema donde las empresas puedan gestionar sus ventas y los clientes puedan comprar productos de forma descentralizada utilizando una moneda estable propia, el CBToken, anclada al dólar."

### 2. Ecosistema de Stablecoin (1:00 - 2:30)
"Comenzamos con la base económica: el **CBToken**. Es un contrato ERC-20 desarrollado en Solidity con 6 decimales para permitir precisión en centavos. 
Lo más interesante es la **App de Compra de Tokens**. Aquí integramos Stripe, lo que permite a cualquier usuario comprar tokens mediante tarjeta de crédito fiat. Al confirmarse el pago, el backend realiza automáticamente el *minting* de los tokens directamente a la wallet de MetaMask del usuario."

### 3. Smart Contracts de E-Commerce (2:30 - 4:00)
"El motor del e-commerce es el contrato **Ecommerce.sol**. He utilizado una arquitectura basada en librerías para gestionar de forma modular:
- Empresas y registro fiscal.
- Catálogo de productos con gestión de stock e imágenes en IPFS.
- Invoices (facturas) y procesamiento de pagos.
Todo está testeado con Foundry para asegurar que el flujo de compra es seguro y eficiente en gas."

### 4. Panel de Administración (4:00 - 5:30)
"Aquí vemos el **Web Admin**. Una empresa puede registrarse, subir sus productos y monitorear sus ventas en tiempo real. Al registrar un producto, los datos se graban en la blockchain, garantizando transparencia. También podemos ver el historial de facturas y si han sido pagadas por los clientes."

### 5. Experiencia del Cliente y Pasarela (5:30 - 7:30)
"Desde la **Web Customer**, el cliente navega por el catálogo, gestiona su carrito y decide comprar. Al hacer checkout, se genera una factura en la blockchain. 
En este punto, entra en juego nuestra **Pasarela de Pago**. El usuario es redirigido para conectar su wallet, aprobar la transferencia de tokens y ejecutar el pago. Al finalizar, es devuelto a la tienda con su pedido confirmado."

### 6. Funcionalidades Extra y Conclusión (7:30 - 10:00)
"Como valor añadido, he implementado [Mencionar Bonus implementados, ej: Sistema de reseñas o Loyalty NFT]. 
Finalmente, el script `restart-all.sh` permite desplegar todo el entorno local (Anvil y 4 aplicaciones Next.js) con un solo comando. 
Este proyecto demuestra cómo la tecnología Web3 puede integrarse con herramientas tradicionales como Stripe para crear soluciones empresariales potentes y fáciles de usar. ¡Gracias!"
