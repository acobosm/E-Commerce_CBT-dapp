// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CartLib
 * @dev Librería para gestionar la selección de productos de los clientes antes de procesar el pago.
 */
library CartLib {
    struct CartItem {
        uint256 productId;
        uint256 quantity;
    }

    struct Cart {
        CartItem[] items;
    }

    /**
     * @dev Añade un producto al carrito. Si ya existe, incrementa la cantidad.
     */
    function addItem(
        Cart storage cart,
        uint256 productId,
        uint256 quantity
    ) internal {
        for (uint i = 0; i < cart.items.length; i++) {
            if (cart.items[i].productId == productId) {
                cart.items[i].quantity += quantity;
                return;
            }
        }
        cart.items.push(CartItem(productId, quantity));
    }

    /**
     * @dev Vacía el carrito del cliente.
     */
    function clear(Cart storage cart) internal {
        delete cart.items;
    }
}
