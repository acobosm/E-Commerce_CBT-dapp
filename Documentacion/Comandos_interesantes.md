# Product 1
cast send 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "addProduct(string,string,string[4],uint256,uint256,uint8)" "1792101601001" "Adaptador NVME SSD USB 3.1" '["/images/Adaptador_NVME_SSD_USB_3.1_01.png","/images/Adaptador_NVME_SSD_USB_3.1_02.png","/images/Adaptador_NVME_SSD_USB_3.1_03.png","/images/Adaptador_NVME_SSD_USB_3.1_04.png"]' 16980000 50 15 --private-key 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356 --rpc-url http://localhost:8545

# Product 2
cast send 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "addProduct(string,string,string[4],uint256,uint256,uint8)" "1792101601001" "Disco SSD 1TB Crucial PCIe Gen4" '["/images/Disco_SSD_1TB_Crucial_PCIe_Gen4_01.png","/images/Disco_SSD_1TB_Crucial_PCIe_Gen4_02.png","/images/Disco_SSD_1TB_Crucial_PCIe_Gen4_03.png","/images/Disco_SSD_1TB_Crucial_PCIe_Gen4_04.png"]' 164940000 10 15 --private-key 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356 --rpc-url http://localhost:8545

# Product 3
cast send 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "addProduct(string,string,string[4],uint256,uint256,uint8)" "1792101601001" "Monitor Sceptre 27pulg" '["/images/Monitor_sceptre_27pulg_01.png","/images/Monitor_sceptre_27pulg_02.png","/images/Monitor_sceptre_27pulg_03.png","/images/Monitor_sceptre_27pulg_04.png"]' 94970000 10 15 --private-key 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356 --rpc-url http://localhost:8545

# Verifying Alpha Corp manager address
cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "companies(string)(string,string,address,string,string,string,string,string,uint256,uint256,uint256,uint256,bool,bool,bool,bool)" "1792101601001" --rpc-url http://localhost:8545

# Identifying the manager address from the 'half-baked' run
cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "companies(string)(string,string,address,string,string,string,string,string,uint256,uint256,uint256,uint256,bool,bool,bool,bool)" "1792101601001" --rpc-url http://localhost:8545

# Adding Alpha Corp products as Admin
# Product 1 - Alpha Corp (Admin as sender)
cast send 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "addProduct(string,string,string[4],uint256,uint256,uint8)" "1792101601001" "Adaptador NVME SSD USB 3.1" '["/images/Adaptador_NVME_SSD_USB_3.1_01.png","/images/Adaptador_NVME_SSD_USB_3.1_02.png","/images/Adaptador_NVME_SSD_USB_3.1_03.png","/images/Adaptador_NVME_SSD_USB_3.1_04.png"]' 16980000 50 15 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

# Product 2 - Alpha Corp
cast send 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "addProduct(string,string,string[4],uint256,uint256,uint8)" "1792101601001" "Disco SSD 1TB Crucial PCIe Gen4" '["/images/Disco_SSD_1TB_Crucial_PCIe_Gen4_01.png","/images/Disco_SSD_1TB_Crucial_PCIe_Gen4_02.png","/images/Disco_SSD_1TB_Crucial_PCIe_Gen4_03.png","/images/Disco_SSD_1TB_Crucial_PCIe_Gen4_04.png"]' 164940000 10 15 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

# Product 3 - Alpha Corp
cast send 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "addProduct(string,string,string[4],uint256,uint256,uint8)" "1792101601001" "Monitor Sceptre 27pulg" '["/images/Monitor_sceptre_27pulg_01.png","/images/Monitor_sceptre_27pulg_02.png","/images/Monitor_sceptre_27pulg_03.png","/images/Monitor_sceptre_27pulg_04.png"]' 94970000 10 15 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

# Locating image file
find . -name "*FLYBIRD*"

# Comparing file system names with JSON paths
ls -R web-customer/public/images/ | grep " .png"

# Renaming files to remove tailing spaces
# Rename files in web-customer
cd web-customer/public/images/
for f in *" .png"; do mv "$f" "${f// .png/.png}"; done

# Check if they exist in web-admin and rename there too
cd ../../../web-admin/public/images/ 2>/dev/null && for f in *" .png"; do mv "$f" "${f// .png/.png}"; done || echo "No web-admin images"

# Verifying Alpha Corp manager address
cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "companies(string)(string,string,address,string,string,string,string,string,uint256,uint256,uint256,uint256,bool,bool,bool,bool)" "1792101601001" --rpc-url http://localhost:8545

# Verifying photos of product with ID 7 (Banco de Pesas)
# Ejemplo para ver las fotos del producto con ID 7 (Banco de Pesas)
cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "getProductPhotos(uint256)(string[4])" 7 --rpc-url http://localhost:8545

# Verifying deployed addresses
cat deployed-addresses.json

# in order to find some issue in the first transaction on block 25 (0xee0c81a526b4fae21266e144f61c18329e7aafdd9f47d78b033aa89cde5fc3a0)
cast receipt 0xee0c81a526b4fae21266e144f61c18329e7aafdd9f47d78b033aa89cde5fc3a0 --json

# Extracting the address from the first transaction on block 25??? - no se que hace el comando
cast receipt 0xee0c81a526b4fae21266e144f61c18329e7aafdd9f47d78b033aa89cde5fc3a0 --json | jq -r ".logs[] | select(.topics[0] == \"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef\" and .topics[2] != \"00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8\") | .topics[2]" | head -n 1 | cut -c 27-
(aparente resultado 70997970c51812dc3a010c7d01b50e0d17dc79c8)

# Testing RUC extraction logic with a debug script: (variuos lines)
    # Get the address of Account 7 (Alpha Corp)
    pk7=0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
    addr7=$(cast wallet address $pk7)
    echo "Alpha Corp Address: $addr7"

    # Call walletToRuc
    ecommerce=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
    raw_ruc=$(cast call "$ecommerce" "walletToRuc(address)" "$addr7")
    echo "Raw RUC (Hex): $raw_ruc"

    # Test my previous fix
    ruc_ascii=$(echo "$raw_ruc" | cast --to-ascii)
    echo "ASCII (with control chars): $ruc_ascii"
    echo -n "$ruc_ascii" | hexdump -C

    clean_ruc=$(echo "$ruc_ascii" | tr -d '\000-^I\013-\037' )
    echo "Clean RUC: '$clean_ruc'"
    echo -n "$clean_ruc" | hexdump -C

# Checked command status
bash -c '
pk7=0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
addr7=$(cast wallet address $pk7)
echo "Alpha Corp Address: $addr7"

ecommerce=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
raw_ruc=$(cast call "$ecommerce" "walletToRuc(address)" "$addr7")
echo "Raw RUC (Hex): $raw_ruc"

ruc_ascii=$(echo "$raw_ruc" | cast --to-ascii)
echo -n "$ruc_ascii" | hexdump -C

clean_ruc=$(echo "$ruc_ascii" | tr -d "\000-^I\013-\037")
echo "Clean RUC: \"$clean_ruc\""
echo -n "$clean_ruc" | hexdump -C
'

# another checked command status
bash -c '
# Simulated cast --to-ascii output for RUC 1792101601001
# [32 nulls][31 nulls + \r][1792101601001][padding]
input=$(printf "\000%.0s" {1..32}; printf "\000%.0s" {1..31}; printf "\r1792101601001"; printf "\000%.0s" {1..19})

echo "Input length: ${#input}"
clean=$(echo -n "$input" | tr -d "\000-\037")
echo "Cleaned: \"$clean\""
echo "Cleaned length: ${#clean}"
'

# Refining RUC extraction logic and fixing the tr range issue
echo -n -e "\x00\x00\x0d1792101601001\x00" | tr -d '\000-\037'

# Improving VENDOR_WALLET detection to handle Marketplace case
echo -n -e "\x00\x00\x0d1792101601001\x00" | tr -d '\000- \013-\037'

# Investigating log data for transacction on Block 25
cast receipt 0xee0c81a526b4fae21266e144f61c18329e7aafdd9f47d78b033aa89cde5fc3a0 --json | jq '.logs[] | {address, topics, data}'

# Eliminando y actualizando
rm logs/accounting.csv && bash scripts/update-accounting.sh && cat logs/accounting.csv

# For Fixing topic padding in update-accouting.sh
cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "getInvoice(string)" "1792101601001-001-001-000000001"

# Checking contract state for Sung's wallet registration
cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "walletToRuc(address)" 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955

cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "walletToRuc(address)" 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f && cast --to-ascii 0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000d3137393231303136303230303100000000000000000000000000000000000000

cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "companies(string)" "1792101601001"

cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "companies(string)" "1792101601001" | cut -c 131-194

cast wallet address --private-key 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356

cast wallet address --private-key 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e

cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "walletToRuc(address)" 0x28c7964cde252957ea267018c7ef5d3750422da8 && cast --to-ascii 0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000d3137393231303136303130303100000000000000000000000000000000000000

cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "companies(string)" "1792101602001" | cut -c 131-194

cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "walletToRuc(address)" 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955

cd sc-ecommerce && forge script script/SeedSimulation.s.sol --rpc-url http://localhost:8545 --broadcast --ffi | grep -A 10 "Registrar Compañías"

cast keccak "1792101602001"

cast code 0x28c7964Cde252957ea267018C7EF5D3750422da8

cast call 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0 "companies(string)" "1792101604001" | cut -c 131-194

# Verify 0% fee transaction and balance
cast call 0x4ed7c70f96b99c776995fb64377f0d4ab3b0e1c1 "companies(string)(string,string,address,bool,string,string,string,string,string,string,string,uint256,uint256,uint256,uint256,uint8)" "1792101603001" --rpc-url http://localhost:8545

cast call 0xc6e7df5e7b4f2a278906862b61205850344d4e7d "balanceOf(address)(uint256)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url http://localhost:8545

cast logs --address 0xc6e7df5e7b4f2a278906862b61205850344d4e7d "Transfer(address,address,uint256)" --rpc-url http://localhost:8545 | grep "00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8" -B 1 -A 2 | tail -n 20

# Verifying Samantha's 500CBT payment and cheching Bob/Carol's commission amounts in recent transactions

cast receipt 0x2efccd2c35136579bd46eb74ba8d206f28240081f5b3a5edb8de8d3ce4a4a165 --rpc-url http://localhost:8545

cast tx 0x2efccd2c35136579bd46eb74ba8d206f28240081f5b3a5edb8de8d3ce4a4a165 --rpc-url http://localhost:8545

# Decoding logs for transaction 0x2efc and checking Bob/Carol's commission amounts in recent 0x42d2 and 0x83ca transactions

cast tx 0x2efccd2c35136579bd46eb74ba8d206f28240081f5b3a5edb8de8d3ce4a4a165 --rpc-url http://localhost:8545 --json | jq '.logs'

cast receipt 0x2efccd2c35136579bd46eb74ba8d206f28240081f5b3a5edb8de8d3ce4a4a165 --rpc-url http://localhost:8545 --json | jq '.logs'

cast receipt 0x42d22bb9d2fb55b85daf74c15a10bbdfcc371fd0bc35f67e535170323aacd19e --rpc-url http://localhost:8545 --json | jq '.logs' && cast receipt 0x83caf2d005f46b6f3b4ddd5e20c30179ac175f9eb27985a0576aff977796f178 --rpc-url http://localhost:8545 --json | jq '.logs'

