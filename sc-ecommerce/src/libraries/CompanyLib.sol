// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CompanyLib
 * @dev Librería para gestionar la información y lógica de negocio de las empresas (Sellers).
 * Cumple con los requisitos del SRI de Ecuador y el sistema de comisiones dinámicas.
 */
library CompanyLib {
    struct Company {
        string name;
        string ruc;
        address wallet;
        bool isActive;
        string streets;
        string phone;
        string description;
        string email;
        string logoUrl;
        string establishmentCode;
        string emissionPointCode;
        uint256 nextInvoiceNumber;
        // Lógica de Ventas y Comisiones (Lunes a Domingo)
        uint256 currentWeekSales; // Ventas acumuladas en la semana actual (en unidades de CBT)
        uint256 lastResetTimestamp; // Timestamp del último lunes 00:00 UTC procesado
        uint256 vipUntil; // Timestamp hasta el cual la empresa tiene comisión 0%
        uint8 lastWeekStatus; // 0: Normal (10%), 1: Volumen (7%)
    }

    /**
     * @dev Calcula la comisión aplicable según el estado actual de la empresa.
     * @param company Referencia a la empresa en storage.
     * @return Porcentaje de comisión (0, 7 o 10).
     */
    function getApplicableFee(
        Company storage company
    ) internal view returns (uint8) {
        if (block.timestamp < company.vipUntil) {
            return 0;
        }
        if (company.lastWeekStatus == 1) {
            return 7;
        }
        return 10;
    }

    /**
     * @dev Genera el siguiente ID de factura formateado según el SRI (establecimiento-punto-secuencial).
     * @param company Referencia a la empresa.
     * @return string ID formateado (ej: 001-001-000000001).
     */
    function generateInvoiceId(
        Company storage company
    ) internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    company.establishmentCode,
                    "-",
                    company.emissionPointCode,
                    "-",
                    _toStringPadded(company.nextInvoiceNumber, 9)
                )
            );
    }

    /**
     * @dev Función auxiliar para rellenar con ceros a la izquierda.
     */
    function _toStringPadded(
        uint256 value,
        uint256 length
    ) private pure returns (string memory) {
        bytes memory buffer = new bytes(length);
        for (uint256 i = length; i > 0; i--) {
            buffer[i - 1] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
