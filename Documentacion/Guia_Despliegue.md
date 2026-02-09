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

