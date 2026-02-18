🔄 Procedimiento de Fresh Start con Persistencia

1. Detener Todo:
bash
# Matar Anvil
pkill -f anvil
# Matar Next.js apps (si están corriendo)
pkill -f "next dev"

2. Iniciar Anvil con Persistencia:
bash
anvil --state e-commerce_state.json --state-interval 10 --host 0.0.0.0
--state: Archivo donde se guarda el estado
--state-interval 10: Guarda cada 10 segundos
--host 0.0.0.0: Permite acceso desde la red local (tu celular)

3. Desplegar Contratos (solo si es primera vez o fresh start):
Si el archivo e-commerce_state.json NO existe o quieres empezar de cero:

Ejecutar los 2 comandos de despliegue en orden
Actualizar los 3 .env.local
Si el archivo SÍ existe (ya tienes estado guardado):

¡No hacer nada! Los contratos ya están en la blockchain persistida

4. Levantar Apps Web:
bash
# Terminal 1
cd stablecoin/compra-stablecoin && npm run dev
# Terminal 2
cd stablecoin/pasarela-de-pago && npm run dev
# Terminal 3
cd web-admin && npm run dev

📋 Resumen de Despliegues y Orden
Contratos a Desplegar (en orden):

1. CBToken (stablecoin/sc)
Comando:

cd stablecoin/sc
forge script script/DeployCBToken.s.sol --rpc-url http://localhost:8545 --broadcast

Output importante: Dirección del contrato
(== Return ==
0: contract CBToken 0x5FbDB2315678afecb367f032d93F642f64180aa3)

Mint inicial: 1,000,000 CBT a la Cuenta 0

Ecommerce (sc-ecommerce)
Requisito: Necesita la dirección de CBToken
Comando:

cd sc-ecommerce
export CBTOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3  # Usar dirección real
forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast

Output importante: Dirección del contrato Ecommerce
(== Return ==
0: contract Ecommerce 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0)

# Archivos .env.local a Actualizar :

Después de cada despliegue, actualizar:

1. stablecoin/compra-stablecoin/.env.local

env
NEXT_PUBLIC_CBTOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3  # CBToken
NEXT_PUBLIC_RPC_URL=http://localhost:8545
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

2. stablecoin/pasarela-de-pago/.env.local

env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB...  # CBToken
NEXT_PUBLIC_RPC_URL=http://localhost:8545

3. web-admin/.env.local

env
NEXT_PUBLIC_ECOMMERCE_ADDRESS=0xe7f1...  # Ecommerce
NEXT_PUBLIC_RPC_URL=http://localhost:8545




🔄 Procedimiento de Fresh Start con Persistencia - Nueva forma de Despliegue

ebit@DESKTOP-QKHOJLB:~/projects/0 CodeCrypto Academy/03 Ethereum Practice/Intro a Proyectos de Entrenamiento/Proyectos obligatorios/03 E-Commerce$ ./scripts/stop-all.sh
🛑 Deteniendo todos los servicios de E-Commerce...
  ⏹️  Deteniendo Anvil...
  ⏹️  Deteniendo aplicaciones Next.js...
  ⏹️  Cerrando sesión tmux...
✅ Todos los servicios detenidos correctamente
ebit@DESKTOP-QKHOJLB:~/projects/0 CodeCrypto Academy/03 Ethereum Practice/Intro a Proyectos de Entrenamiento/Proyectos obligatorios/03 E-Commerce$ ./scripts/restart-all.sh
=========================================
🚀 E-COMMERCE PLATFORM - RESTART ALL
=========================================

🧹 Limpiando procesos anteriores...
✅ Procesos limpiados

⛓️  Iniciando Anvil con persistencia...
⏳ Esperando a que Anvil esté listo...
✅ Anvil listo (PID: 395643)

📦 Contratos existentes detectados, usando direcciones guardadas...
  - CBToken:   0x5FbDB2315678afecb367f032d93F642f64180aa3
  - Ecommerce: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

🔧 Actualizando archivos .env.local...
  ✅ compra-stablecoin/.env.local actualizado
  ⚠️  pasarela-de-pago/.env.local no encontrado o sin variable NEXT_PUBLIC_CONTRACT_ADDRESS
  ✅ web-admin/.env.local actualizado
  ✅ web-customer/.env.local actualizado

🔄 Sincronizando ABIs para el frontend...
  ✅ Ecommerce.json sincronizado
  ✅ CBToken.json sincronizado

🖥️  Iniciando aplicaciones web en tmux...
✅ Aplicaciones iniciadas en tmux

=========================================
✅ PLATAFORMA E-COMMERCE INICIADA
=========================================

📦 Contratos Desplegados:
  - CBToken:   0x5FbDB2315678afecb367f032d93F642f64180aa3
  - Ecommerce: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

🌐 Aplicaciones Web:
  - Compra Stablecoin: http://localhost:6001
  - Pasarela de Pago:  http://localhost:6002
  - Panel Admin:       http://localhost:3000

📊 Blockchain:
  - Anvil RPC: http://localhost:8545
  - Estado guardado en: e-commerce_state.json

🖥️  Terminal:
  - Sesión tmux: 'ecommerce'
  - Ver logs: tmux attach -t ecommerce
  - Cambiar entre Ventanas:
    - Ver Blockchain (Ventana 0): Ctrl+B, luego 0
    - Ver Web Apps (Ventana 1):   Ctrl+B, luego 1
  - Configuración Doble Monitor (Vistas Independientes):
    - Monitor 1: tmux attach -t ecommerce
    - Monitor 2: tmux new-session -t ecommerce -s monitor2
  - Salir de tmux (sin cerrar procesos): Ctrl+B, luego D

📝 Logs disponibles en: logs/
=========================================
---

## 🛠️ Comandos Misceláneos de Verificación (Opcional)

Estos comandos de la suite `foundry` sirven para auditar rápidamente el estado de tu blockchain local `Anvil`.

### 1. Consultar el último número de bloque:
Sirve para confirmar que la cadena está avanzando o que se ha recuperado correctamente el estado después de un reinicio.
```bash
cast block-number --rpc-url http://localhost:8545
```

### 2. Ver detalles del último bloque:
Muestra información detallada como el Hash, Timestamp y transacciones del bloque más reciente.
```bash
cast block latest --rpc-url http://localhost:8545
```

Los siguientes comandos sirven para corregir posibles problemas de visualizacion en tmux

### 1. Duplicate session: monitor2
Para intentar matar la sesión que se haya quedado corriendo por detrás
```bash
tmux kill-session -t monitor2
```

Para matar todas las sesiones de tmux
```bash
tmux kill-server



---

## 🎮 Sistema de Simulación y Contabilidad (Fase 7)

Se ha implementado un sistema para rellenar la plataforma con datos de prueba realistas y generar reportes contables automáticos.

### 1. Reinicio con Carga Automática
Para limpiar Anvil y cargar empresas, productos y clientes de una sola vez:
```bash
./scripts/restart-all.sh --seed
```

### 2. Recarga de Simulación (Sin Reinicio)
Si ya tienes Anvil corriendo y solo quieres cargar los datos del archivo `seed-data.json`:
```bash
./scripts/run-sim.sh
```

### 3. Actualizar Reporte Contable
Para sincronizar el archivo CSV con las nuevas transacciones realizadas (manuales o por script):
```bash
./scripts/update-accounting.sh
```

### 4. Archivos Clave del Sistema:
- **Plantilla:** `sc-ecommerce/script/seed-data.json` (Edita esto para cambiar nombres o productos).
- **Reporte:** `logs/accounting.csv` (CSV contable con ventas y comisiones).
- **Script Foundry:** `sc-ecommerce/script/SeedSimulation.s.sol`.

### 5. Ejemplo de corrida del script de recarga de datos:

```bash
ebit@DESKTOP-QKHOJLB:~/projects/0 CodeCrypto Academy/03 Ethereum Practice/Intro a Proyectos de Entrenamiento/Proyectos obligatorios/03 E-Commerce$ bash scripts/run-sim.sh
=========================================
🎮 E-COMMERCE SIMULATION RUNNER
=========================================
🚀 Ejecutando Seeding inicial...
[⠊] Compiling...
[⠢] Compiling 22 files with Solc 0.8.33
[⠰] Solc 0.8.33 finished in 5.16s
Compiler run successful with warnings:
Warning (2519): This declaration shadows an existing declaration.
   --> script/SeedSimulation.s.sol:273:9:
    |
273 |         SeedCompany[] memory companies = abi.decode(
    |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Note: The shadowed declaration is here:
  --> script/SeedSimulation.s.sol:63:5:
   |
63 |     SeedCompany[] companies;
   |     ^^^^^^^^^^^^^^^^^^^^^^^

Script ran successfully.

== Logs ==
  Compañía ya existe, saltando registro y productos: Alpha Corp
  Compañía registrada: Muse Box
    Producto agregado: Bajo 5 cuerdas Ibanez
    Producto agregado: Bateria Electronica ALESIS Nitro Pro
    Producto agregado: Teclado KORG EK50
  -----------------------------------------
  SEQUEO COMPLETADO EXITOSAMENTE
  -----------------------------------------

## Setting up 1 EVM.

==========================

Chain 31337

Estimated gas price: 1.594468233 gwei

Estimated total gas used for script: 2466052

Estimated amount required: 0.003932041574926116 ETH

==========================

##### anvil-hardhat
✅  [Success] Hash: 0x47cc6b7fef652d132a5b09df66ed68a4d6a1cf96461b035b1bd4f680a4a7913f
Block: 4
Paid: 0.000258962214631244 ETH (370004 gas * 0.699890311 gwei)


##### anvil-hardhat
✅  [Success] Hash: 0xdee32874c3421407082b38598653a98be16b07c992cf5652b5ea97ed9cc547f0
Block: 5
Paid: 0.000287085282708658 ETH (467138 gas * 0.614562041 gwei)


##### anvil-hardhat
✅  [Success] Hash: 0x9f0553d2eef79a279c92ddbabc4385cf29016f07aec4028b425fb1ccd82330d3
Block: 6
Paid: 0.000277007265873236 ETH (512849 gas * 0.540134164 gwei)


##### anvil-hardhat
✅  [Success] Hash: 0xced49679fb7bf8b845922cfba333285ebaeea77cb0d334451f8db05aac79217d
Block: 7
Paid: 0.000179399417010696 ETH (377742 gas * 0.474925788 gwei)

✅ Sequence #1 on anvil-hardhat | Total Paid: 0.001002454180223834 ETH (1727733 gas * avg 0.582378076 gwei)


==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /home/ebit/projects/0 CodeCrypto Academy/03 Ethereum Practice/Intro a Proyectos de Entrenamiento/Proyectos obligatorios/03 E-Commerce/sc-ecommerce/broadcast/SeedSimulation.s.sol/31337/run-latest.json

Sensitive values saved to: /home/ebit/projects/0 CodeCrypto Academy/03 Ethereum Practice/Intro a Proyectos de Entrenamiento/Proyectos obligatorios/03 E-Commerce/sc-ecommerce/cache/SeedSimulation.s.sol/31337/run-latest.json


📊 Generando reporte contable...
🔍 Buscando nuevas transacciones desde el bloque 0...
✅ No hay nuevas transacciones para procesar.

✅ Simulación completada.
📝 Reporte disponible en: logs/accounting.csv
=========================================
```

