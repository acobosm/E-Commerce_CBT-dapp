# Desarrollo de Infraestructura y CBToken

Esta fase se centra en configurar la estructura del proyecto e implementar la stablecoin principal (CBToken) utilizando Foundry.

## Cambios Propuestos

### Estructura del Proyecto
- [NUEVO] Crear directorios raíz: `stablecoin/`, `sc-ecommerce/`, `web-admin/`, `web-customer/`.
- [NUEVO] Inicializar proyecto Foundry en `stablecoin/sc`.
- [NUEVO] Inicializar proyecto Foundry en `sc-ecommerce`.

### [Componente] CBToken (Stablecoin)
#### [NUEVO] [CBToken.sol](file:///home/ebit/projects/0%20CodeCrypto%20Academy/03%20Ethereum%20Practice/Intro%20a%20Proyectos%20de%20Entrenamiento/Proyectos%20obligatorios/03%20E-Commerce/stablecoin/sc/src/CBToken.sol)
- Heredar de OpenZeppelin `ERC20`.
- Establecer decimales en 6.
- Implementar función `mint` con el modificador `onlyOwner`.
- Agregar eventos de auditoría si es necesario.

#### [NUEVO] [DeployCBToken.s.sol](file:///home/ebit/projects/0%20CodeCrypto%20Academy/03%20Ethereum%20Practice/Intro%20a%20Proyectos%20de%20Entrenamiento/Proyectos%20obligatorios/03%20E-Commerce/stablecoin/sc/script/DeployCBToken.s.sol)
- Script para desplegar `CBToken` en la red local Anvil.
- Mint inicial de 1,000,000 tokens.

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `forge test` en `stablecoin/sc`.
- Las pruebas incluirán:
    - Despliegue exitoso.
    - El propietario puede mintear.
    - No propietarios no pueden mintear.
    - Las transferencias funcionan correctamente.

### Verificación Manual
- Desplegar en un nodo local Anvil.
- Usar `cast call` para verificar balances.
