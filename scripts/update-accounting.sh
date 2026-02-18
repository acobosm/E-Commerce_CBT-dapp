#!/bin/bash

# Script para actualizar el reporte contable CSV leyendo la blockchain
# Formato CSV: Block;Timestamp;TxHash;IssuerRUC;Buyer;TotalCBT;PlatformFee;VendorNet

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs"
CSV_FILE="$LOGS_DIR/accounting.csv"
DEPLOYED_FILE="$PROJECT_ROOT/deployed-addresses.json"

mkdir -p "$LOGS_DIR"

if [ ! -f "$DEPLOYED_FILE" ]; then
    echo "❌ Error: no se encuentra deployed-addresses.json"
    exit 1
fi

ECOMMERCE_ADDR=$(jq -r '.ecommerce' "$DEPLOYED_FILE")
CBTOKEN_ADDR=$(jq -r '.cbtoken' "$DEPLOYED_FILE")

# Header si el archivo no existe
if [ ! -f "$CSV_FILE" ]; then
    echo "Block;Timestamp;TxHash;IssuerRUC;Buyer;TotalCBT;PlatformFee;VendorNet" > "$CSV_FILE"
    FROM_BLOCK=0
else
    # Determinar último bloque procesado (buscando el separador ;)
    LAST_BLOCK=$(tail -n 1 "$CSV_FILE" | cut -d';' -f1)
    if [[ "$LAST_BLOCK" =~ ^[0-9]+$ ]]; then
        FROM_BLOCK=$((LAST_BLOCK + 1))
    else
        FROM_BLOCK=0
    fi
fi

echo "🔍 Buscando nuevas transacciones desde el bloque $FROM_BLOCK..."

EVENT_SIGNATURE="PurchaseCompleted(address,string,string,uint256)"
TOPIC0=$(cast keccak "$EVENT_SIGNATURE")

LOGS=$(cast logs --from-block $FROM_BLOCK --to-block latest --address "$ECOMMERCE_ADDR" "$TOPIC0" --json)

if [ "$LOGS" == "[]" ] || [ -z "$LOGS" ]; then
    echo "✅ No hay nuevas transacciones para procesar."
    exit 0
fi

# Función para formatear CBT (6 decimales) a decimal humano con COMA
format_cbt() {
    local num=$1
    local padded=$(printf "%07d" "$num")
    local len=${#padded}
    # Usamos COMA para que Excel en español no lo confunda con miles
    echo "${padded:0:len-6},${padded:len-6}"
}

# Procesar cada log
echo "$LOGS" | jq -c '.[]' | while read -r log; do
    BLOCK=$(echo "$log" | jq -r '.blockNumber' | xargs printf "%d")
    TX_HASH=$(echo "$log" | jq -r '.transactionHash')
    
    TX_RECEIPT=$(cast receipt "$TX_HASH" --json)
    
    # Direcciones en minúsculas para comparaciones JQ
    CBTOKEN_ADDR_LC=$(echo "$CBTOKEN_ADDR" | tr '[:upper:]' '[:lower:]')
    VAULT_ADDR_RAW=$(cast call "$ECOMMERCE_ADDR" "platformVault()")
    VAULT_ADDR="0x$(echo "$VAULT_ADDR_RAW" | cut -c 27-)"
    VAULT_ADDR_LC=$(echo "$VAULT_ADDR" | tr '[:upper:]' '[:lower:]')
    BUYER_ADDR=$(echo "$log" | jq -r '.topics[1]' | cut -c 27- | tr '[:upper:]' '[:lower:]')
    
    DATA=$(echo "$log" | jq -r '.data')
    TOTAL_HEX="0x$(echo "$DATA" | cut -c 67-130)"
    TOTAL=$(printf "%d" "$TOTAL_HEX" 2>/dev/null || echo 0)
    
    INV_LEN_HEX="0x$(echo "$DATA" | cut -c 131-194)"
    INV_LEN=$(printf "%d" "$INV_LEN_HEX" 2>/dev/null || echo 0)
    
    if [ "$INV_LEN" -gt 0 ]; then
        INV_ID_HEX="0x$(echo "$DATA" | cut -c 195-$((195 + INV_LEN * 2 - 1)))"
        INV_ID=$(echo "$INV_ID_HEX" | cast --to-ascii | tr -d '\000-\037' | xargs)
    else
        INV_ID="unknown"
    fi

    TRANSFER_TOPIC="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    VAULT_PADDED="0x000000000000000000000000$(echo "$VAULT_ADDR_LC" | sed 's/0x//')"
    BUYER_PADDED="0x000000000000000000000000$(echo "$BUYER_ADDR" | sed 's/0x//')"

    TRANSFERS=$(echo "$TX_RECEIPT" | jq -c ".logs[] | select(.address == \"$CBTOKEN_ADDR_LC\" and .topics[0] == \"$TRANSFER_TOPIC\" and .topics[1] == \"$BUYER_PADDED\")")
    
    PLATFORM_FEE_HEX=$(echo "$TRANSFERS" | jq -r "select(.topics[2] == \"$VAULT_PADDED\") | .data" | head -n 1)
    if [ -z "$PLATFORM_FEE_HEX" ] || [ "$PLATFORM_FEE_HEX" == "null" ] || [ "$PLATFORM_FEE_HEX" == "0x" ]; then
        PLATFORM_FEE=0
    else
        PLATFORM_FEE=$(printf "%d" "$PLATFORM_FEE_HEX" 2>/dev/null || echo 0)
    fi

    VENDOR_WALLET_TOPIC=$(echo "$TRANSFERS" | jq -r "select(.topics[2] != \"$VAULT_PADDED\") | .topics[2]" | head -n 1)
    if [ -z "$VENDOR_WALLET_TOPIC" ] || [ "$VENDOR_WALLET_TOPIC" == "null" ]; then
        COUNT=$(echo "$TRANSFERS" | jq -r "select(.topics[2] == \"$VAULT_PADDED\") | .topics[2]" | wc -l)
        if [ "$COUNT" -gt 1 ]; then
            VENDOR_WALLET="$VAULT_ADDR"
        else
            VENDOR_WALLET_TOPIC=$(echo "$TRANSFERS" | jq -r ".topics[2]" | head -n 1)
            VENDOR_WALLET="0x$(echo "$VENDOR_WALLET_TOPIC" | cut -c 27-)"
        fi
    else
        VENDOR_WALLET="0x$(echo "$VENDOR_WALLET_TOPIC" | cut -c 27-)"
    fi

    RUC_RAW=$(cast call "$ECOMMERCE_ADDR" "walletToRuc(address)" "$VENDOR_WALLET")
    RUC=$(echo "$RUC_RAW" | cast --to-ascii | tr -dc '[:print:]' | xargs)
    
    VENDOR_NET=0
    if [ -n "$RUC" ] && [ "$INV_ID" != "unknown" ]; then
        INV_KEY="$RUC-$INV_ID"
        INV_DATA=$(cast call "$ECOMMERCE_ADDR" "getInvoice(string)" "$INV_KEY" 2>/dev/null)
        
        if [ -n "$INV_DATA" ] && [ "$INV_DATA" != "0x" ]; then
            SUB0_HEX="0x$(echo "$INV_DATA" | cut -c 387-450)"
            SUB15_HEX="0x$(echo "$INV_DATA" | cut -c 451-514)"
            SUB0=$(printf "%d" "$SUB0_HEX" 2>/dev/null || echo 0)
            SUB15=$(printf "%d" "$SUB15_HEX" 2>/dev/null || echo 0)
            VENDOR_NET=$((SUB0 + SUB15))
        fi
    fi

    TIMESTAMP=$(cast block "$BLOCK" --field timestamp)
    DATE_STR=$(date -d "@$TIMESTAMP" "+%Y-%m-%d %H:%M:%S")
    
    F_TOTAL=$(format_cbt $TOTAL)
    F_FEE=$(format_cbt $PLATFORM_FEE)
    F_NET=$(format_cbt $VENDOR_NET)
    
    # Salida con separador ; y comillas para evitar auto-formato de Excel
    echo "$BLOCK;$DATE_STR;$TX_HASH;\"$RUC\";\"0x$BUYER_ADDR\";$F_TOTAL;$F_FEE;$F_NET" >> "$CSV_FILE"
    echo "  ➕ Registrada TX: $TX_HASH ($RUC)"
done

echo "✅ Reporte actualizado: $CSV_FILE"
