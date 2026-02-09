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
sleep 2
echo "✅ Procesos limpiados"
echo ""

# ============================================
# 2. INICIO DE ANVIL
# ============================================
echo "⛓️  Iniciando Anvil con persistencia..."
anvil --state e-commerce_state.json --state-interval 10 --host 0.0.0.0 > logs/anvil.log 2>&1 &
ANVIL_PID=$!

# Esperar hasta que Anvil esté listo
echo "⏳ Esperando a que Anvil esté listo..."
until grep -q "Listening on 0.0.0.0:8545" logs/anvil.log 2>/dev/null; do
    sleep 0.5
done
echo "✅ Anvil listo (PID: $ANVIL_PID)"
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
    CBTOKEN_OUTPUT=$(forge script script/DeployCBToken.s.sol --rpc-url http://localhost:8545 --broadcast 2>&1)
    CBTOKEN_ADDRESS=$(echo "$CBTOKEN_OUTPUT" | grep -oP '0: contract CBToken \K0x[a-fA-F0-9]{40}')
    
    if [ -z "$CBTOKEN_ADDRESS" ]; then
        echo "❌ Error: No se pudo obtener la dirección de CBToken"
        exit 1
    fi
    echo "  ✅ CBToken desplegado en: $CBTOKEN_ADDRESS"
    cd ../..
    
    # Desplegar Ecommerce
    echo "  📝 Desplegando Ecommerce..."
    cd sc-ecommerce
    export CBTOKEN_ADDRESS
    ECOMMERCE_OUTPUT=$(forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast 2>&1)
    ECOMMERCE_ADDRESS=$(echo "$ECOMMERCE_OUTPUT" | grep -oP '0: contract Ecommerce \K0x[a-fA-F0-9]{40}')
    
    if [ -z "$ECOMMERCE_ADDRESS" ]; then
        echo "❌ Error: No se pudo obtener la dirección de Ecommerce"
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
echo ""

# ============================================
# 5. LEVANTAR APLICACIONES WEB EN TMUX
# ============================================
echo "🖥️  Iniciando aplicaciones web en tmux..."

# Crear sesión tmux con 4 paneles (2x2)
tmux new-session -d -s ecommerce -n "E-Commerce"

# Dividir en 4 cuadrantes
tmux split-window -h -t ecommerce:0
tmux split-window -v -t ecommerce:0.1
tmux select-pane -t ecommerce:0.0
tmux split-window -v -t ecommerce:0.0

# Asignar comandos a cada panel
tmux send-keys -t ecommerce:0.0 "cd '$PROJECT_ROOT' && tail -f logs/anvil.log" C-m
tmux send-keys -t ecommerce:0.1 "cd '$PROJECT_ROOT/stablecoin/compra-stablecoin' && npm run dev 2>&1 | tee '$PROJECT_ROOT/logs/compra-stablecoin.log'" C-m
tmux send-keys -t ecommerce:0.2 "cd '$PROJECT_ROOT/stablecoin/pasarela-de-pago' && npm run dev 2>&1 | tee '$PROJECT_ROOT/logs/pasarela-de-pago.log'" C-m
tmux send-keys -t ecommerce:0.3 "cd '$PROJECT_ROOT/web-admin' && npm run dev 2>&1 | tee '$PROJECT_ROOT/logs/web-admin.log'" C-m

echo "✅ Aplicaciones iniciadas en tmux"
echo ""

# ============================================
# 6. RESUMEN FINAL
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
echo ""
echo "📊 Blockchain:"
echo "  - Anvil RPC: http://localhost:8545"
echo "  - Estado guardado en: e-commerce_state.json"
echo ""
echo "🖥️  Terminal:"
echo "  - Sesión tmux: 'ecommerce'"
echo "  - Ver logs: tmux attach -t ecommerce"
echo "  - Salir de tmux: Ctrl+B, luego D"
echo ""
echo "📝 Logs disponibles en: logs/"
echo "========================================="
echo ""
echo "🎯 Para ver las terminales, ejecuta:"
echo "   tmux attach -t ecommerce"
echo ""
