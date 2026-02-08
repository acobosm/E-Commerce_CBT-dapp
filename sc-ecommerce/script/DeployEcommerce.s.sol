// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Ecommerce.sol";

/**
 * @title DeployEcommerce
 * @dev Script para desplegar el contrato orquestador de E-Commerce.
 */
contract DeployEcommerce is Script {
    function run() external returns (Ecommerce) {
        // Configuracion de direcciones para Anvil
        // Account 0 (Admin/Treasury)
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );

        // Account 1 (Platform Vault / Merchant Commission)
        address platformVault = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

        // Dirección del CBToken (Debe ser la que obtuviste al desplegar CBToken)
        // Por defecto intentamos leerla de una variable de entorno o usamos un placeholder fijo de Anvil
        address cbTokenAddress = vm.envOr("CBTOKEN_ADDRESS", address(0));

        if (cbTokenAddress == address(0)) {
            console.log(
                "WARNING: CBTOKEN_ADDRESS no detectada. Usando direccion por defecto de Anvil (si aplica)."
            );
            // Nota: En un entorno real, aqui pondrias la direccion real tras el primer despliegue.
        }

        vm.startBroadcast(deployerPrivateKey);

        Ecommerce ecommerce = new Ecommerce(cbTokenAddress, platformVault);

        vm.stopBroadcast();

        console.log("Ecommerce deployed at:", address(ecommerce));
        console.log("Platform Vault (Account 1):", platformVault);
        console.log("CBToken used:", cbTokenAddress);

        return ecommerce;
    }
}
