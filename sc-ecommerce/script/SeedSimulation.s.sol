// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/StdJson.sol";
import "../src/Ecommerce.sol";

interface ICBToken {
    function mint(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SeedSimulation is Script {
    using stdJson for string;

    struct Config {
        address cbtoken;
        address ecommerce;
    }

    struct SeedProduct {
        uint256 iva;
        string name;
        string[] photos;
        uint256 price;
        uint256 stock;
    }

    struct SeedCompany {
        string _comment;
        string description;
        string email;
        string name;
        string phone;
        SeedProduct[] products;
        string ruc;
        string streets;
        uint256 wallet_index;
    }

    struct SeedClient {
        string email;
        string idNumber;
        uint256 initial_cbt;
        string name;
        string phone;
        string street;
        uint256 wallet_index;
    }

    struct SeedPurchase {
        string _note;
        uint256 client_index;
        string company_ruc;
        uint256 product_index;
        uint256 quantity;
    }

    Config config;
    string seedData;
    SeedClient[] clients;
    SeedCompany[] companies;

    // Anvil default private keys (first 10)
    uint256[] privateKeys = [
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80,
        0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d,
        0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a,
        0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6,
        0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a,
        0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba,
        0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e,
        0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356,
        0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97,
        0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
    ];

    function run() external {
        // 1. Cargar direcciones de contratos
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/../deployed-addresses.json");
        string memory json = vm.readFile(path);
        config.cbtoken = json.readAddress(".cbtoken");
        config.ecommerce = json.readAddress(".ecommerce");

        // 2. Cargar datos de semilla
        string memory seedPath = string.concat(root, "/script/seed-data.json");
        seedData = vm.readFile(seedPath);

        Ecommerce ecommerce = Ecommerce(config.ecommerce);
        ICBToken cbtoken = ICBToken(config.cbtoken);

        // 2.5 Parsear datos
        bytes memory clientsJson = seedData.parseRaw(".clients");
        clients = abi.decode(clientsJson, (SeedClient[]));

        bytes memory companiesJson = seedData.parseRaw(".companies");
        companies = abi.decode(companiesJson, (SeedCompany[]));

        // 3. Registrar Clientes y Fondear
        _setupClients(cbtoken);

        // 4. Registrar Compañías y Productos
        _setupCompanies(ecommerce);

        // 4.5 Construir mapa de productos real (Blockchain State)
        _buildProductMap(ecommerce);

        // 5. Realizar Compras
        _executePurchases(ecommerce, cbtoken);

        console.log("-----------------------------------------");
        console.log("SEQUEO COMPLETADO EXITOSAMENTE");
        console.log("-----------------------------------------");
    }

    function _setupClients(ICBToken cbtoken) internal {
        Ecommerce ecommerce = Ecommerce(config.ecommerce);

        for (uint i = 0; i < clients.length; i++) {
            uint256 pk = privateKeys[clients[i].wallet_index];
            address wallet = vm.addr(pk);
            vm.deal(wallet, 10 ether);

            // Registrar si no existe
            (string memory name, , , , , ) = ecommerce.clients(wallet);
            if (bytes(name).length == 0) {
                vm.startBroadcast(pk);
                ecommerce.registerClient(
                    clients[i].name,
                    clients[i].idNumber,
                    clients[i].email,
                    clients[i].phone,
                    clients[i].street
                );
                vm.stopBroadcast();
                console.log("Cliente registrado:", clients[i].name);
            }

            // Fondear CBT (Top-up Logic)
            uint256 currentBalance = cbtoken.balanceOf(wallet);
            uint256 targetBalance = clients[i].initial_cbt * 10 ** 6;

            if (currentBalance < targetBalance) {
                vm.startBroadcast(privateKeys[0]); // Account 0 (Admin)
                cbtoken.mint(wallet, targetBalance - currentBalance);
                vm.stopBroadcast();
                console.log(
                    "Fondos completados (top-up) para:",
                    clients[i].name
                );
            }
        }
    }

    function _setupCompanies(Ecommerce ecommerce) internal {
        for (uint i = 0; i < companies.length; i++) {
            uint256 pk = privateKeys[companies[i].wallet_index];
            address wallet = vm.addr(pk);
            vm.deal(wallet, 10 ether);

            // Registrar si no existe
            (
                ,
                string memory ruc,
                address currentWallet,
                ,
                ,
                ,
                ,
                ,
                ,
                ,
                ,
                ,
                ,
                ,
                ,

            ) = ecommerce.companies(companies[i].ruc);
            if (bytes(ruc).length == 0) {
                vm.startBroadcast(privateKeys[0]); // Solo Admin puede registrar
                ecommerce.registerCompany(
                    companies[i].ruc,
                    companies[i].name,
                    wallet,
                    companies[i].streets,
                    companies[i].phone,
                    companies[i].description,
                    companies[i].email,
                    "https://logo.url/test.png"
                );
                vm.stopBroadcast();
                console.log(unicode"Compañía registrada:", companies[i].name);

                // Agregar productos solo cuando la compañía es registrada por primera vez
                for (uint j = 0; j < companies[i].products.length; j++) {
                    SeedProduct memory p = companies[i].products[j];
                    string[4] memory photos;
                    for (uint k = 0; k < 4; k++)
                        photos[k] = k < p.photos.length ? p.photos[k] : "";

                    vm.startBroadcast(pk);
                    ecommerce.addProduct(
                        companies[i].ruc,
                        p.name,
                        photos,
                        p.price * 10 ** 4,
                        p.stock,
                        uint8(p.iva)
                    );
                    vm.stopBroadcast();
                    console.log("  Producto agregado:", p.name);
                }
            } else {
                // Si ya existe, verificar si la billetera coincide
                if (currentWallet != wallet) {
                    console.log(
                        unicode"⚠️  Desfase de billetera detectado para:",
                        companies[i].name
                    );
                    console.log("   Actual:", currentWallet);
                    console.log("   Esperada:", wallet);

                    vm.startBroadcast(privateKeys[0]); // Solo Admin puede actualizar
                    ecommerce.updateCompanyWallet(companies[i].ruc, wallet);
                    vm.stopBroadcast();

                    console.log(unicode"   ✅ Billetera sincronizada.");
                } else {
                    console.log(
                        unicode"Compañía ya existe, saltando registro y productos:",
                        companies[i].name
                    );
                }
            }
        }
    }

    function _executePurchases(Ecommerce ecommerce, ICBToken cbtoken) internal {
        bytes memory purchasesJson = seedData.parseRaw(".purchases");
        SeedPurchase[] memory purchases = abi.decode(
            purchasesJson,
            (SeedPurchase[])
        );

        for (uint i = 0; i < purchases.length; i++) {
            uint256 clientPk = privateKeys[purchases[i].client_index];
            address clientWallet = vm.addr(clientPk);

            // Encontrar el Product ID
            // Como los IDs son secuenciales, esto es un poco difícil si no sabemos el ID exacto.
            // Para la simulación, asumiremos IDs correlativos basados en el orden de inserción.
            // O mejor, buscamos en el contrato (pero no hay búsqueda por nombre).
            // Usaremos una aproximación: ID = i + 1 (ajustado al total de productos previos)
            // Una mejor forma es que el script lleve la cuenta de IDs generados.

            uint256 productId = _findProductIdByRucAndIndex(
                purchases[i].company_ruc,
                purchases[i].product_index
            );

            vm.startBroadcast(clientPk);

            // Approve
            cbtoken.approve(address(ecommerce), 1_000_000 * 10 ** 6);

            // Add to cart
            ecommerce.addToCart(productId, purchases[i].quantity);

            // Debug balance before checkout
            uint256 balBefore = cbtoken.balanceOf(clientWallet);

            // Checkout
            ecommerce.checkout();

            uint256 balAfter = cbtoken.balanceOf(clientWallet);
            vm.stopBroadcast();

            console.log(
                string.concat(
                    "Compra OK - Cliente: ",
                    clients[purchases[i].client_index - 2].name
                )
            );
            console.log(
                "  Producto ID:",
                productId,
                " Cantidad:",
                purchases[i].quantity
            );
            console.log("  Saldo Anterior:", balBefore);
            console.log("  Gasto Total:", balBefore - balAfter);
            console.log("  Saldo Restante:", balAfter);
        }
    }

    // --- Mejoras de Robustez ---
    mapping(string => uint256[]) private _companyProductIds;

    function _buildProductMap(Ecommerce ecommerce) internal {
        uint256 maxId = ecommerce.nextProductId();
        for (uint256 id = 1; id < maxId; id++) {
            (
                , // name
                , // price_1
                , // price_2
                , // price_3
                , // stock
                string memory ruc,
                , // isActive

            ) = ecommerce.products(id); // iva (uint8)
            _companyProductIds[ruc].push(id);
        }
    }

    function _findProductIdByRucAndIndex(
        string memory ruc,
        uint256 index
    ) internal view returns (uint256) {
        uint256[] memory ids = _companyProductIds[ruc];
        if (index < ids.length) {
            return ids[index];
        }
        return 1; // Fallback
    }
}
