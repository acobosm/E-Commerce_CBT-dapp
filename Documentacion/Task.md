# Tarea: Proyecto E-Commerce Blockchain con Stablecoins

- [x] **Infraestructura y Estructura Base** [/]
    - [x] Crear estructura de directorios `[stablecoin, sc-ecommerce, web-admin, web-customer]`
    - [x] Inicializar Foundry en `stablecoin/sc`
    - [x] Inicializar Foundry en `sc-ecommerce`
    - [x] **Punto de Control:** Subir a rama `feature/infra-setup` y pausar para revisión.

- [x] **Parte 1: CBToken (Stablecoin)** [x]
    - [x] Implementar `CBToken.sol` (ERC20, 6 decimales, Minteable)
    - [x] Escribir tests para `CBToken.sol`
    - [x] Crear script de despliegue `DeployCBToken.s.sol`
    - [x] Verificar despliegue en Anvil
    - [x] **Punto de Control:** Subir a rama `feature/cbtoken-sc` y pausar para revisión.

- [x] **Parte 2: App de Compra de Stablecoins** [x]
    - [x] Inicializar app Next.js en `stablecoin/compra-stablecoin`
    - [x] Configurar integración con Stripe (Backend/Elements)
    - [x] Implementar conexión con MetaMask
    - [x] Implementar API de Minting y Frontend
    - [x] **Punto de Control:** Subir a rama `feature/stablecoin-purchase` y pausar para revisión.

- [x] **Parte 3: Pasarela de Pago** [x]
    - [x] Inicializar app Next.js en `stablecoin/pasarela-de-pago`
    - [x] Implementar lógica de pago con tokens
    - [x] Lógica de redirección tras el pago
    - [x] **Fase 3.1:** Refinamiento de Usabilidad (Balance, Desconexión, Enlace de Compra)
    - [x] **Punto de Control:** Subir a rama `feature/payment-gateway` y pausar para revisión.

- [x] **Parte 4: Smart Contracts de E-Commerce** [x]
    - [x] Implementar Librerías (Company, Product, Cart, Invoice, Client)
    - [x] Implementar contrato principal `Ecommerce.sol`
    - [x] Tests exhaustivos del flujo de E-commerce
    - [x] Script de despliegue para Ecommerce
    - [x] **Punto de Control:** Subir a rama `feature/ecommerce-sc` e informe de evidencias.

- [ ] **Parte 5: Panel de Administración Web** [ ]
    - [ ] Inicializar app Next.js en `web-admin`
    - [ ] Registro de empresas y gestión de productos
    - [ ] Visualización y filtrado de facturas
    - [ ] **Punto de Control:** Subir a rama `feature/web-admin` y pausar para revisión.

- [ ] **Parte 6: Tienda Web para Clientes** [ ]
    - [ ] Inicializar app Next.js en `web-customer`
    - [ ] Catálogo de productos y gestión del carrito
    - [ ] Flujo de checkout e historial de facturas
    - [ ] **Punto de Control:** Subir a rama `feature/web-customer` y pausar para revisión.

- [ ] **Parte 7: Integración y Funciones Opcionales** [ ]
    - [ ] Crear script `restart-all.sh`
    - [ ] Implementar soporte multi-moneda (Bonus)
    - [ ] Implementar sistema de reseñas (Bonus)
    - [ ] Implementar recompensas Loyalty/NFT (Bonus)
    - [ ] **Punto de Control:** Subir a rama `feature/integration-bonus` y pausar para revisión.

- [ ] **Parte 8: Revisión Final y Documentación** [ ]
    - [ ] Pruebas finales de extremo a extremo
    - [ ] Escribir README y guía de usuario
    - [ ] **Punto de Control:** Merge a `main` y entrega final.

- [ ] **Parte 9: Preparación de Video Demostrativo** [ ]
    - [ ] Guion del Video (`Documentacion/Discurso_Video.md`)
    - [ ] Grabación y revisión del flujo
