// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProductLib
 * @dev Librería para gestionar el catálogo de productos y la selección automática de precios por volumen.
 */
library ProductLib {
    struct Product {
        string name;
        string[4] photos; // Array fijo de hasta 4 URLs o CIDs de IPFS
        uint256 price_1; // Precio Unitario base
        uint256 price_2; // Precio Mayorista (10-24 u)
        uint256 price_3; // Precio Distribuidor (25+ u)
        uint256 stock;
        string companyRuc;
        bool isActive;
        uint8 iva; // Porcentaje de impuesto: 0 o 15
    }

    /**
     * @dev Retorna el precio unitario correcto basado en la cantidad solicitada.
     */
    function getPriceByQuantity(
        Product storage product,
        uint256 quantity
    ) internal view returns (uint256) {
        if (quantity >= 25) {
            return product.price_3;
        } else if (quantity >= 10) {
            return product.price_2;
        } else {
            return product.price_1;
        }
    }

    /**
     * @dev Verifica si hay stock suficiente para una compra.
     */
    function hasSufficientStock(
        Product storage product,
        uint256 quantity
    ) internal view returns (bool) {
        return product.stock >= quantity;
    }
}
