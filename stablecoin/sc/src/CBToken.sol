// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CBToken
 * @dev Stablecoin ERC20 anclada al USD (1 CBT = 1 USD).
 * Posee 6 decimales para representar centavos.
 */
contract CBToken is ERC20, Ownable {
    event TokensMinted(address indexed to, uint256 amount);

    constructor(address initialOwner) ERC20("Crypto Business Token", "CBT") Ownable(initialOwner) {
        // Mint inicial opcional se puede manejar desde el script de despliegue
    }

    /**
     * @dev Devuelve el número de decimales (6).
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev Función para crear nuevos tokens. Solo el propietario puede ejecutarla.
     * @param to Dirección que recibirá los tokens.
     * @param amount Cantidad de tokens a mintear (en unidades de 6 decimales).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
}
