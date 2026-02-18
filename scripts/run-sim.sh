#!/bin/bash

# Script maestro para ejecutar la simulación y actualizar la contabilidad

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================="
echo "🎮 E-COMMERCE SIMULATION RUNNER"
echo "========================================="

# 1. Ejecutar el script de Seeding (Foundry)
echo "🚀 Ejecutando Seeding inicial..."
cd sc-ecommerce
forge script script/SeedSimulation.s.sol --rpc-url http://localhost:8545 --broadcast --ffi
cd ..

# 2. Ejecutar el script de Contabilidad (Bash)
echo ""
echo "📊 Generando reporte contable..."
bash scripts/update-accounting.sh

echo ""
echo "✅ Simulación completada."
echo "📝 Reporte disponible en: logs/accounting.csv"
echo "========================================="
