// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ClientLib
 * @dev Librería para gestionar la información de los clientes (compradores) para la facturación.
 */
library ClientLib {
    struct Client {
        string name; // Razón Social / Nombre
        string idNumber; // Cédula o RUC
        address wallet; // Billetera del cliente (ID único)
        string email;
        string phone;
        string streets; // Dirección física
    }
}
