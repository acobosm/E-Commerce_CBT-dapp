#!/bin/bash

echo "🛑 Deteniendo todos los servicios de E-Commerce..."

# Detener Anvil
echo "  ⏹️  Deteniendo Anvil..."
pkill -f anvil || true

# Detener aplicaciones Next.js
echo "  ⏹️  Deteniendo aplicaciones Next.js..."
pkill -f "next dev" || true

# Detener sesión tmux si existe
echo "  ⏹️  Cerrando sesión tmux..."
tmux kill-session -t ecommerce 2>/dev/null || true

sleep 1

# Verificar que todo se detuvo
REMAINING=$(ps aux | grep -E "anvil|next dev" | grep -v grep | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    echo "✅ Todos los servicios detenidos correctamente"
else
    echo "⚠️  Advertencia: Algunos procesos aún están corriendo"
    echo "   Ejecuta: ps aux | grep -E 'anvil|next dev'"
fi
