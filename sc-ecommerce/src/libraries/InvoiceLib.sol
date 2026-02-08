// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InvoiceLib
 * @dev Librería para gestionar la estructura de facturas finales, incluyendo desglose de impuestos e ítems.
 */
library InvoiceLib {
    struct InvoiceItem {
        uint256 productId;
        string description;
        uint256 quantity;
        uint256 unitPrice;
        uint8 ivaPercentage; // 0 o 15
        uint256 totalItem; // quantity * unitPrice
    }

    struct Invoice {
        string invoiceId; // Formato: establishment-point-sequence (ej: 001-001-000000001)
        string companyRuc;
        address customerWallet;
        uint256 timestamp;
        bytes32 txHash; // Hash de la transacción (Actúa como Clave de Acceso SRI)
        uint256 subtotal0; // Base imponible IVA 0%
        uint256 subtotal15; // Base imponible IVA 15%
        uint256 ivaAmount; // Total IVA calculado (subtotal15 * 0.15)
        uint256 totalAmount; // Suma total final (subtotal0 + subtotal15 + ivaAmount)
        InvoiceItem[] details;
    }

    /**
     * @dev Crea una línea de detalle para la factura.
     */
    function createItem(
        uint256 productId,
        string memory description,
        uint256 quantity,
        uint256 unitPrice,
        uint8 ivaPercentage
    ) internal pure returns (InvoiceItem memory) {
        return
            InvoiceItem({
                productId: productId,
                description: description,
                quantity: quantity,
                unitPrice: unitPrice,
                ivaPercentage: ivaPercentage,
                totalItem: quantity * unitPrice
            });
    }
}
