// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./libraries/CompanyLib.sol";
import "./libraries/ProductLib.sol";
import "./libraries/ClientLib.sol";
import "./libraries/CartLib.sol";
import "./libraries/InvoiceLib.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title Ecommerce
 * @dev Contrato orquestador para la plataforma de E-Commerce.
 * Gestiona compañías, productos, carritos, pagos y facturación.
 */
contract Ecommerce {
    using CompanyLib for CompanyLib.Company;
    using ProductLib for ProductLib.Product;
    using ClientLib for ClientLib.Client;
    using CartLib for CartLib.Cart;
    using InvoiceLib for InvoiceLib.Invoice;

    address public owner;
    IERC20 public immutable cbtoken;
    address public platformVault; // Cuenta 1 que recibe comisiones

    // Mappings globales
    mapping(string => CompanyLib.Company) public companies;
    mapping(address => string) public walletToRuc;

    mapping(uint256 => ProductLib.Product) public products;
    uint256 public nextProductId = 1;

    mapping(address => ClientLib.Client) public clients;
    mapping(address => CartLib.Cart) private carts;

    // Almacenamiento de facturas (Identificador: RUC_EMPRESA-ID_FACTURA)
    mapping(string => InvoiceLib.Invoice) private invoices;

    // Eventos
    event CompanyRegistered(string ruc, string name, address wallet);
    event ProductAdded(uint256 id, string name, string companyRuc);
    event PurchaseCompleted(
        address indexed buyer,
        string indexed companyRuc,
        string invoiceId,
        uint256 total
    );
    event StockUpdated(uint256 productId, uint256 newStock);
    event VipStatusPaid(string ruc, uint256 until);

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            unicode"Solo el administrador (Cuenta 0) puede realizar esta accion"
        );
        _;
    }

    modifier onlyCompanyMember(string memory ruc) {
        require(
            msg.sender == owner ||
                (keccak256(bytes(walletToRuc[msg.sender])) ==
                    keccak256(bytes(ruc))),
            unicode"No tienes permisos para gestionar esta empresa"
        );
        _;
    }

    constructor(address _cbtoken, address _platformVault) {
        owner = msg.sender;
        cbtoken = IERC20(_cbtoken);
        platformVault = _platformVault;
    }

    // --- Gestion de Clientes ---
    function registerClient(
        string memory _name,
        string memory _idNumber,
        string memory _email,
        string memory _phone,
        string memory _streets
    ) external {
        clients[msg.sender] = ClientLib.Client({
            name: _name,
            idNumber: _idNumber,
            wallet: msg.sender,
            email: _email,
            phone: _phone,
            streets: _streets
        });
    }

    // --- Gestion de Companias ---
    function registerCompany(
        string memory _ruc,
        string memory _name,
        address _wallet,
        string memory _streets,
        string memory _phone,
        string memory _description,
        string memory _email,
        string memory _logoUrl
    ) external onlyOwner {
        require(bytes(companies[_ruc].ruc).length == 0, "RUC ya registrado");

        CompanyLib.Company storage comp = companies[_ruc];
        comp.ruc = _ruc;
        comp.name = _name;
        comp.wallet = _wallet;
        comp.isActive = true;
        comp.streets = _streets;
        comp.phone = _phone;
        comp.description = _description;
        comp.email = _email;
        comp.logoUrl = _logoUrl;
        comp.establishmentCode = "001";
        comp.emissionPointCode = "001";
        comp.nextInvoiceNumber = 1;
        comp.lastResetTimestamp = block.timestamp;

        walletToRuc[_wallet] = _ruc;
        emit CompanyRegistered(_ruc, _name, _wallet);
    }

    // --- Gestion de Catalogo ---
    function addProduct(
        string memory _ruc,
        string memory _name,
        string[4] memory _photos,
        uint256 _price_1,
        uint256 _stock,
        uint8 _iva
    ) external onlyCompanyMember(_ruc) {
        uint256 id = nextProductId++;
        products[id] = ProductLib.Product({
            name: _name,
            photos: _photos,
            price_1: _price_1,
            price_2: (_price_1 * 95) / 100, // 5% desc auto
            price_3: (_price_1 * 85) / 100, // 15% desc auto
            stock: _stock,
            companyRuc: _ruc,
            isActive: true,
            iva: _iva
        });
        emit ProductAdded(id, _name, _ruc);
    }

    function buyStock(uint256 _productId, uint256 _amount) external {
        ProductLib.Product storage product = products[_productId];
        require(product.isActive, "Producto inactivo");
        string memory ruc = product.companyRuc;
        require(
            keccak256(bytes(walletToRuc[msg.sender])) == keccak256(bytes(ruc)),
            unicode"Solo la empresa dueña puede reponer stock"
        );

        product.stock += _amount;
        emit StockUpdated(_productId, product.stock);
    }

    function payVipSubscription(string memory _ruc) external {
        // Costo: 500 CBT (con 6 decimales)
        cbtoken.transferFrom(msg.sender, platformVault, 500 * 10 ** 6);

        // Calcular fin del domingo actual
        uint256 dayOfWeek = (block.timestamp / 1 days + 3) % 7; // 0=Mon, 6=Sun
        uint256 daysUntilSunday = 6 - dayOfWeek;
        uint256 endOfWeek = (block.timestamp / 1 days + daysUntilSunday + 1) *
            1 days -
            1;

        companies[_ruc].vipUntil = endOfWeek;
        emit VipStatusPaid(_ruc, endOfWeek);
    }

    // --- Ciclo de Ventas (Carrito y Checkout) ---
    function addToCart(uint256 _productId, uint256 _quantity) external {
        require(products[_productId].isActive, "Producto no disponible");
        require(products[_productId].stock >= _quantity, "Stock insuficiente");
        require(
            keccak256(bytes(products[_productId].companyRuc)) !=
                keccak256(bytes(walletToRuc[msg.sender])),
            "SRI-ERROR: Autocompra no permitida"
        );

        carts[msg.sender].addItem(_productId, _quantity);
    }

    function getCartItems() external view returns (CartLib.CartItem[] memory) {
        return carts[msg.sender].items;
    }

    function checkout() external {
        CartLib.Cart storage cart = carts[msg.sender];
        require(cart.items.length > 0, "Carrito vacio");
        require(
            bytes(clients[msg.sender].idNumber).length > 0,
            "Debe registrar sus datos como cliente primero"
        );

        // Procesar por empresa (asumimos un checkout por empresa para cumplir SRI de forma simple)
        // En una version real se agruparia y generaria una factura por empresa.
        string memory companyRuc = products[cart.items[0].productId].companyRuc;
        CompanyLib.Company storage company = companies[companyRuc];

        _updateCompanyFeeCycle(companyRuc);
        uint8 commissionPercent = company.getApplicableFee();

        uint256 subtotal0 = 0;
        uint256 subtotal15 = 0;
        uint256 totalIva = 0;
        uint256 totalToPay = 0;

        string memory invId = company.generateInvoiceId();
        string memory fullInvKey = string(
            abi.encodePacked(companyRuc, "-", invId)
        );

        InvoiceLib.Invoice storage invoice = invoices[fullInvKey];
        invoice.invoiceId = invId;
        invoice.companyRuc = companyRuc;
        invoice.customerWallet = msg.sender;
        invoice.timestamp = block.timestamp;
        invoice.txHash = bytes32(
            uint256(uint160(msg.sender)) ^ block.timestamp
        ); // Simulado, se puede mejorar

        for (uint i = 0; i < cart.items.length; i++) {
            uint256 pId = cart.items[i].productId;
            uint256 qty = cart.items[i].quantity;
            ProductLib.Product storage prod = products[pId];

            require(
                keccak256(bytes(prod.companyRuc)) ==
                    keccak256(bytes(companyRuc)),
                "Solo se procesan productos de la misma empresa por factura"
            );
            require(prod.stock >= qty, "Stock insuficiente durante el proceso");

            uint256 unitPrice = prod.getPriceByQuantity(qty);
            uint256 itemTotal = unitPrice * qty;

            if (prod.iva == 15) {
                subtotal15 += itemTotal;
                totalIva += (itemTotal * 15) / 100;
            } else {
                subtotal0 += itemTotal;
            }

            prod.stock -= qty;

            invoice.details.push(
                InvoiceLib.InvoiceItem({
                    productId: pId,
                    description: prod.name,
                    quantity: qty,
                    unitPrice: unitPrice,
                    ivaPercentage: prod.iva,
                    totalItem: itemTotal
                })
            );
        }

        totalToPay = subtotal0 + subtotal15 + totalIva;
        invoice.subtotal0 = subtotal0;
        invoice.subtotal15 = subtotal15;
        invoice.ivaAmount = totalIva;
        invoice.totalAmount = totalToPay;

        // Ejecutar Pago y Split 90/10
        uint256 platformFee = (totalToPay * commissionPercent) / 100;
        uint256 vendorShare = totalToPay - platformFee;

        cbtoken.transferFrom(msg.sender, platformVault, platformFee);
        cbtoken.transferFrom(msg.sender, company.wallet, vendorShare);

        // Actualizar volumen de ventas para la empresa (sin contar IVA)
        company.currentWeekSales += (subtotal0 + subtotal15);
        company.nextInvoiceNumber++;

        cart.clear();
        emit PurchaseCompleted(msg.sender, companyRuc, invId, totalToPay);
    }

    function _updateCompanyFeeCycle(string memory ruc) internal {
        CompanyLib.Company storage comp = companies[ruc];
        uint256 t = block.timestamp + 3 days;
        uint256 lastMonday = t >= 1 weeks ? t - (t % 1 weeks) - 3 days : 0;

        if (comp.lastResetTimestamp < lastMonday) {
            // Evaluamos la semana anterior
            if (comp.currentWeekSales >= 250 * 10 ** 6) {
                comp.lastWeekStatus = 1; // Baja a 7%
            } else {
                comp.lastWeekStatus = 0; // Se queda en 10%
            }
            comp.currentWeekSales = 0;
            comp.lastResetTimestamp = lastMonday;
        }
    }

    function getInvoice(
        string memory key
    ) external view returns (InvoiceLib.Invoice memory) {
        return invoices[key];
    }
}
