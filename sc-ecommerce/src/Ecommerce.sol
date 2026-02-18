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

    function updateCompanyWallet(
        string memory _ruc,
        address _newWallet
    ) external onlyOwner {
        require(bytes(companies[_ruc].ruc).length > 0, "Empresa no registrada");
        address oldWallet = companies[_ruc].wallet;

        // Limpiar mapeo antiguo si existía
        if (oldWallet != address(0)) {
            delete walletToRuc[oldWallet];
        }

        companies[_ruc].wallet = _newWallet;
        walletToRuc[_newWallet] = _ruc;

        emit CompanyRegistered(_ruc, companies[_ruc].name, _newWallet);
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

    /**
     * @dev Permite al Administrador o a la empresa dueña actualizar metadatos del producto.
     * No permite actualizar el stock (usar buyStock para eso).
     */
    function updateProduct(
        uint256 _id,
        string memory _name,
        string[4] memory _photos,
        uint256 _price_1,
        uint8 _iva,
        bool _isActive
    ) external {
        ProductLib.Product storage prod = products[_id];
        require(prod.price_1 > 0, "Producto no existe");

        bool isCompanyOwner = keccak256(bytes(walletToRuc[msg.sender])) ==
            keccak256(bytes(prod.companyRuc));
        bool isAdmin = msg.sender == owner;

        require(isAdmin || isCompanyOwner, "No tienes permisos para editar");

        prod.name = _name;
        prod.price_1 = _price_1;
        prod.price_2 = (_price_1 * 95) / 100;
        prod.price_3 = (_price_1 * 85) / 100;
        prod.iva = _iva;
        prod.isActive = _isActive;

        // Solo la empresa dueña puede cambiar las fotos
        if (isCompanyOwner) {
            prod.photos = _photos;
        }
    }

    function getProductPhotos(
        uint256 _id
    ) external view returns (string[4] memory) {
        return products[_id].photos;
    }

    function buyStock(uint256 _productId, uint256 _amount) external {
        ProductLib.Product storage product = products[_productId];
        require(product.isActive, "Producto inactivo");
        string memory ruc = product.companyRuc;
        require(
            msg.sender == owner ||
                msg.sender == platformVault ||
                keccak256(bytes(walletToRuc[msg.sender])) ==
                keccak256(bytes(ruc)),
            unicode"No tienes permisos para reponer stock"
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

    function removeFromCart(uint256 _productId, uint256 _quantity) external {
        carts[msg.sender].removeItem(_productId, _quantity);
    }

    function clearCart() external {
        carts[msg.sender].clear();
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

        string memory companyRuc = products[cart.items[0].productId].companyRuc;
        CompanyLib.Company storage company = companies[companyRuc];

        _updateCompanyFeeCycle(companyRuc);
        uint8 commissionPercent = company.getApplicableFee();

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
        );

        uint256[3] memory totals = _processItems(cart, invoice, companyRuc);

        uint256 totalToPay = totals[0] + totals[1] + totals[2]; // sub0 + sub15 + tIva
        invoice.subtotal0 = totals[0];
        invoice.subtotal15 = totals[1];
        invoice.ivaAmount = totals[2];
        invoice.totalAmount = totalToPay;

        uint256 platformFee = (totalToPay * commissionPercent) / 100;
        uint256 vendorShare = totalToPay - platformFee;

        cbtoken.transferFrom(msg.sender, platformVault, platformFee);
        cbtoken.transferFrom(msg.sender, company.wallet, vendorShare);

        company.currentWeekSales += (totals[0] + totals[1]);
        company.nextInvoiceNumber++;

        cart.clear();
        emit PurchaseCompleted(msg.sender, companyRuc, invId, totalToPay);
    }

    function _processItems(
        CartLib.Cart storage cart,
        InvoiceLib.Invoice storage invoice,
        string memory companyRuc
    ) internal returns (uint256[3] memory totals) {
        for (uint i = 0; i < cart.items.length; i++) {
            ProductLib.Product storage prod = products[cart.items[i].productId];

            require(
                keccak256(bytes(prod.companyRuc)) ==
                    keccak256(bytes(companyRuc)),
                "RUC mismatch"
            );
            require(prod.stock >= cart.items[i].quantity, "Stock insuficiente");

            uint256 unitPrice = prod.getPriceByQuantity(cart.items[i].quantity);
            uint256 itemTotal = unitPrice * cart.items[i].quantity;

            if (prod.iva == 15) {
                totals[1] += itemTotal; // subtotal15
                totals[2] += (itemTotal * 15) / 100; // totalIva
            } else {
                totals[0] += itemTotal; // subtotal0
            }

            prod.stock -= cart.items[i].quantity;

            invoice.details.push(
                InvoiceLib.InvoiceItem({
                    productId: cart.items[i].productId,
                    description: prod.name,
                    quantity: cart.items[i].quantity,
                    unitPrice: unitPrice,
                    ivaPercentage: prod.iva,
                    totalItem: itemTotal
                })
            );
        }
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
