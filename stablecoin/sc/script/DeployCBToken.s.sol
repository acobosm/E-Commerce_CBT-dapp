// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CBToken.sol";

contract DeployCBToken is Script {
    function run() external returns (CBToken) {
        // En Anvil, el deployer suele ser la primera cuenta
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        CBToken token = new CBToken(deployerAddress);

        // Mint inicial de 1,000,000 tokens (con 6 decimales)
        token.mint(deployerAddress, 1_000_000 * 10 ** 6);

        vm.stopBroadcast();

        console.log("CBToken deployed at:", address(token));
        console.log("Owner balance:", token.balanceOf(deployerAddress));

        return token;
    }
}
