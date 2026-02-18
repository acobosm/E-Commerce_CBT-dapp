#!/bin/bash

set -e  # Salir si hay algún error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================="
echo "🚀 E-COMMERCE PLATFORM - RESTART ALL"
echo "========================================="
echo ""

# ============================================
# 1. LIMPIEZA DE PROCESOS
# ============================================
echo "🧹 Limpiando procesos anteriores..."
pkill -f anvil || true
pkill -f "next dev" || true
tmux kill-session -t ecommerce 2>/dev/null || true
rm -rf sc-ecommerce/broadcast sc-ecommerce/cache stablecoin/sc/broadcast stablecoin/sc/cache
sleep 2
echo "✅ Procesos y caches limpiados"
echo ""

# ============================================
# 2. INICIO DE ANVIL
# ============================================
echo "⛓️  Iniciando Anvil en tmux..."
# Limpiar log anterior
mkdir -p logs
> logs/anvil.log

# Crear sesión tmux y arrancar anvil en la ventana 0
tmux new-session -d -s ecommerce -n "Blockchain"
tmux send-keys -t ecommerce:0 "anvil --state e-commerce_state.json --state-interval 10 --host 0.0.0.0 2>&1 | tee logs/anvil.log" C-m

# Esperar hasta que Anvil esté listo
echo "⏳ Esperando a que Anvil esté listo..."
until grep -q "Listening on 0.0.0.0:8545" logs/anvil.log 2>/dev/null; do
    sleep 0.5
done
echo "✅ Anvil listo"
echo ""

# ============================================
# 3. DETECCIÓN Y DESPLIEGUE DE CONTRATOS
# ============================================
DEPLOYED_FILE="deployed-addresses.json"

if [ -f "$DEPLOYED_FILE" ]; then
    echo "📦 Contratos existentes detectados, usando direcciones guardadas..."
    CBTOKEN_ADDRESS=$(jq -r '.cbtoken' "$DEPLOYED_FILE")
    ECOMMERCE_ADDRESS=$(jq -r '.ecommerce' "$DEPLOYED_FILE")
    echo "  - CBToken:   $CBTOKEN_ADDRESS"
    echo "  - Ecommerce: $ECOMMERCE_ADDRESS"
else
    echo "🔨 No se encontraron contratos, desplegando desde cero..."
    
    # Desplegar CBToken
    echo "  📝 Desplegando CBToken..."
    cd stablecoin/sc
    forge script script/DeployCBToken.s.sol --rpc-url http://localhost:8545 --broadcast --non-interactive
    
    CBTOKEN_ADDRESS=$(jq -r '.transactions[] | select(.transactionType=="CREATE" and (.contractName=="CBToken" or .contractName=="CBToken")) | .contractAddress' broadcast/DeployCBToken.s.sol/31337/run-latest.json)
    
    if [ -z "$CBTOKEN_ADDRESS" ] || [ "$CBTOKEN_ADDRESS" == "null" ]; then
        echo "❌ Error: No se pudo obtener la dirección de CBToken desde el broadcast"
        exit 1
    fi
    echo "  ✅ CBToken desplegado en: $CBTOKEN_ADDRESS"
    cd ../..
    
    # Desplegar Ecommerce
    echo "  📝 Desplegando Ecommerce..."
    cd sc-ecommerce
    export CBTOKEN_ADDRESS
    forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast --non-interactive
    
    ECOMMERCE_ADDRESS=$(jq -r '.transactions[] | select(.transactionType=="CREATE" and .contractName=="Ecommerce") | .contractAddress' broadcast/DeployEcommerce.s.sol/31337/run-latest.json)
    
    if [ -z "$ECOMMERCE_ADDRESS" ] || [ "$ECOMMERCE_ADDRESS" == "null" ]; then
        echo "❌ Error: No se pudo obtener la dirección de Ecommerce desde el broadcast"
        exit 1
    fi
    echo "  ✅ Ecommerce desplegado en: $ECOMMERCE_ADDRESS"
    cd ..
    
    # Guardar direcciones
    cat > "$DEPLOYED_FILE" <<EOF
{
  "cbtoken": "$CBTOKEN_ADDRESS",
  "ecommerce": "$ECOMMERCE_ADDRESS",
  "timestamp": "$(date -Iseconds)",
  "note": "Direcciones de contratos desplegados. Este archivo se regenera automáticamente si se borra e-commerce_state.json"
}
EOF
    echo "  💾 Direcciones guardadas en $DEPLOYED_FILE"
fi
echo ""

# ============================================
# 4. ACTUALIZACIÓN DE .env.local
# ============================================
echo "🔧 Actualizando archivos .env.local..."

# Compra Stablecoin
if grep -q "^NEXT_PUBLIC_CBTOKEN_ADDRESS=" stablecoin/compra-stablecoin/.env.local 2>/dev/null; then
    sed -i "s|^NEXT_PUBLIC_CBTOKEN_ADDRESS=.*|NEXT_PUBLIC_CBTOKEN_ADDRESS=$CBTOKEN_ADDRESS|" stablecoin/compra-stablecoin/.env.local
    echo "  ✅ compra-stablecoin/.env.local actualizado"
else
    echo "  ⚠️  compra-stablecoin/.env.local no encontrado o sin variable NEXT_PUBLIC_CBTOKEN_ADDRESS"
fi

# Pasarela de Pago
if grep -q "^NEXT_PUBLIC_CONTRACT_ADDRESS=" stablecoin/pasarela-de-pago/.env.local 2>/dev/null; then
    sed -i "s|^NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=$CBTOKEN_ADDRESS|" stablecoin/pasarela-de-pago/.env.local
    echo "  ✅ pasarela-de-pago/.env.local actualizado"
else
    echo "  ⚠️  pasarela-de-pago/.env.local no encontrado o sin variable NEXT_PUBLIC_CONTRACT_ADDRESS"
fi

# Web Admin
if grep -q "^NEXT_PUBLIC_ECOMMERCE_ADDRESS=" web-admin/.env.local 2>/dev/null; then
    sed -i "s|^NEXT_PUBLIC_ECOMMERCE_ADDRESS=.*|NEXT_PUBLIC_ECOMMERCE_ADDRESS=$ECOMMERCE_ADDRESS|" web-admin/.env.local
    echo "  ✅ web-admin/.env.local actualizado"
else
    echo "  ⚠️  web-admin/.env.local no encontrado o sin variable NEXT_PUBLIC_ECOMMERCE_ADDRESS"
fi

# Web Customer
if grep -q "^NEXT_PUBLIC_ECOMMERCE_ADDRESS=" web-customer/.env.local 2>/dev/null; then
    sed -i "s|^NEXT_PUBLIC_ECOMMERCE_ADDRESS=.*|NEXT_PUBLIC_ECOMMERCE_ADDRESS=$ECOMMERCE_ADDRESS|" web-customer/.env.local
    sed -i "s|^NEXT_PUBLIC_CBTOKEN_ADDRESS=.*|NEXT_PUBLIC_CBTOKEN_ADDRESS=$CBTOKEN_ADDRESS|" web-customer/.env.local
    echo "  ✅ web-customer/.env.local actualizado"
else
    echo "  ⚠️  web-customer/.env.local no encontrado o sin variables de contrato"
fi
echo ""

# ============================================
# 5. SINCRONIZACIÓN DE ABIs
# ============================================
echo "🔄 Sincronizando ABIs para el frontend..."

# Ecommerce ABI
if [ -f "sc-ecommerce/out/Ecommerce.sol/Ecommerce.json" ]; then
    cp "sc-ecommerce/out/Ecommerce.sol/Ecommerce.json" "web-admin/src/abis/Ecommerce.json"
    cp "sc-ecommerce/out/Ecommerce.sol/Ecommerce.json" "web-customer/src/abis/Ecommerce.json"
    echo "  ✅ Ecommerce.json sincronizado"
else
    echo "  ⚠️  Archivo sc-ecommerce/out/Ecommerce.sol/Ecommerce.json no encontrado"
fi

# CBToken ABI
if [ -f "stablecoin/sc/out/CBToken.sol/CBToken.json" ]; then
    cp "stablecoin/sc/out/CBToken.sol/CBToken.json" "web-admin/src/abis/CBToken.json"
    cp "stablecoin/sc/out/CBToken.sol/CBToken.json" "web-customer/src/abis/CBToken.json"
    echo "  ✅ CBToken.json sincronizado"
else
    echo "  ⚠️  Archivo stablecoin/sc/out/CBToken.sol/CBToken.json no encontrado"
fi
echo ""

# ============================================
# 6. LEVANTAR APLICACIONES WEB EN TMUX
# ============================================
echo "🖥️  Iniciando aplicaciones web en tmux..."

# Crear sesión tmux
# Ventana 1: WEB APPS (Layout 2x2 con las 4 apps)
tmux new-window -t ecommerce:1 -n "Web Apps"

# Dividir Ventana 1 en 4 cuadrantes
tmux split-window -h -t ecommerce:1
tmux split-window -v -t ecommerce:1.1
tmux select-pane -t ecommerce:1.0
tmux split-window -v -t ecommerce:1.0

# Asignar comandos a cada panel en Ventana 1
tmux send-keys -t ecommerce:1.0 "cd '$PROJECT_ROOT/stablecoin/compra-stablecoin' && npm run dev 2>&1 | tee '$PROJECT_ROOT/logs/compra-stablecoin.log'" C-m
tmux send-keys -t ecommerce:1.1 "cd '$PROJECT_ROOT/stablecoin/pasarela-de-pago' && npm run dev 2>&1 | tee '$PROJECT_ROOT/logs/pasarela-de-pago.log'" C-m
tmux send-keys -t ecommerce:1.2 "cd '$PROJECT_ROOT/web-admin' && npm run dev 2>&1 | tee '$PROJECT_ROOT/logs/web-admin.log'" C-m
tmux send-keys -t ecommerce:1.3 "cd '$PROJECT_ROOT/web-customer' && npm run dev 2>&1 | tee '$PROJECT_ROOT/logs/web-customer.log'" C-m

echo "✅ Aplicaciones iniciadas en tmux"
echo ""

# ============================================
# 6. OPCIONAL: SEQUEO DE DATOS
# ============================================
if [[ "$*" == *"--seed"* ]]; then
    echo "🎮 Opción --seed detectada, ejecutando simulación..."
    bash scripts/run-sim.sh
fi

# ============================================
# 7. RESUMEN FINAL
# ============================================
echo "========================================="
echo "✅ PLATAFORMA E-COMMERCE INICIADA"
echo "========================================="
echo ""
echo "📦 Contratos Desplegados:"
echo "  - CBToken:   $CBTOKEN_ADDRESS"
echo "  - Ecommerce: $ECOMMERCE_ADDRESS"
echo ""
echo "🌐 Aplicaciones Web:"
echo "  - Compra Stablecoin: http://localhost:6001"
echo "  - Pasarela de Pago:  http://localhost:6002"
echo "  - Panel Admin:       http://localhost:3000"
echo "  - Tienda Cliente:    http://localhost:6003"
echo ""
echo "📊 Blockchain:"
echo "  - Anvil RPC: http://localhost:8545"
echo "  - Estado guardado en: e-commerce_state.json"
echo ""
echo "🚀 Simulación:"
echo "  - Script de recarga: scripts/run-sim.sh"
echo "  - Reporte Contable:  logs/accounting.csv"
echo ""
echo "🖥️  Terminal (TMUX):"
echo "  - Ver todos los logs: tmux attach -t ecommerce"
echo "  - Salir de visualización: Ctrl+B, luego D"
echo ""
echo "📺 TIP: Configuración Doble Monitor (Independiente):"
echo "  1. Monitor 1: tmux attach -t ecommerce"
echo "     (Cambia a Anvil con: Ctrl+B, luego 0)"
echo "  2. Monitor 2: tmux new-session -t ecommerce -s monitor2"
echo "     (Cambia a Web Apps con: Ctrl+B, luego 1)"
echo ""
echo "📝 Logs disponibles en: logs/"
echo "========================================="
echo ""
