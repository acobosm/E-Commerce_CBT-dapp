# Evidencias para el Informe Técnico - Fases Iniciales

Este documento recopila las salidas de consola y verificaciones más importantes para documentar el progreso del proyecto.

---

## 1. Infraestructura y Estructura Base

### Estructura de Directorios
Es fundamental mostrar que el proyecto sigue la arquitectura solicitada.
**Comando:** `ls -R` o `tree` (si está instalado).
**Resultado esperado:**
```text
.
├── Documentacion
│   ├── Discurso_Video.md
│   ├── Evidencias_Informe.md
│   ├── Implementation_Plan.md
│   └── Task.md
├── sc-ecommerce
│   ├── foundry.toml
│   ├── script
│   ├── src
│   └── test
├── stablecoin
│   ├── compra-stablecoin
│   ├── pasarela-de-pago
│   └── sc
│       ├── foundry.toml
│       ├── package.json
│       ├── script
│       ├── src
│       └── test
└── web-admin
└── web-customer
```

---

## 2. Parte 1: CBToken (Stablecoin)

### Compilación Exitosa
Demuestra que el código de Solidity es válido y las dependencias están bien configuradas.
**Comando:** `cd stablecoin/sc && forge build`
**Resultado:**
```text
[⠊] Compiling...
[⠒] Compiling 8 files with Solc 0.8.33
[⠢] Solc 0.8.33 finished in 36.56ms
Compiler run successful!
```

### Pruebas Unitarias (Tests)
Esta es la captura más importante para la validez técnica.
**Comando:** `forge test -vv`
**Resultado:**
```text
Ran 4 tests for test/CBToken.t.sol:CBTokenTest
[PASS] testRevert_MintByNonOwner() (gas: 14466)
[PASS] test_InitialSetup() (gas: 25372)
[PASS] test_MintByOwner() (gas: 68472)
[PASS] test_Transfer() (gas: 95356)
Suite result: ok. 4 passed; 0 failed; 0 skipped; finished in 7.15ms (5.12ms CPU time)
```

### Despliegue en Red Local (Anvil)
Captura del momento en que el contrato se hace real en la blockchain.
**Comando sugerido (Usuario):** `forge script script/DeployCBToken.s.sol --rpc-url http://localhost:8545 --broadcast`
**Evidencia a capturar:** El log que muestra `CBToken deployed at: 0x...` y los hashes de las transacciones.

### Verificación de Balance (Cast)
Prueba final de que el mint inicial funcionó.
**Comando sugerido (Usuario):** `cast call <ADDR_TOKEN> "balanceOf(address)" <ADDR_OWNER>`
**Resultado esperado (Hex):** `0x00...e8d4a51000`

> [!NOTE]
> Para convertir el resultado hexadecimal a decimal automáticamente y facilitar tu informe, puedes usar:
> `cast --to-dec 0xe8d4a51000`
> Resultado: `1000000000000` (representa 1,000,000 CBT con 6 decimales).

---

> [!TIP]
> **Para tu informe:** Te recomiendo tomar capturas de pantalla de tu propia terminal cuando ejecutes el despliegue en Anvil, ya que eso mostrará las direcciones reales que se generen en tu máquina.
