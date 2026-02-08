// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint8 public decimals = 6;

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract EcommerceTest is Test {
    Ecommerce public ecommerce;
    MockERC20 public token;

    address admin = address(0xF39);
    address vault = address(0x709); // Account 1
    address vendor = address(0x123); // Cuenta 7
    address buyer = address(0x456);

    function setUp() public {
        vm.startPrank(admin);
        token = new MockERC20();
        ecommerce = new Ecommerce(address(token), vault);
        vm.stopPrank();
    }

    function testRegisterCompany() public {
        vm.prank(admin);
        ecommerce.registerCompany(
            "1723456789001",
            "Tech Solutions",
            vendor,
            "Av. Shyris",
            "0999999999",
            "Venta de laptops",
            "info@tech.com",
            "logo.png"
        );

        (
            string memory name,
            string memory ruc,
            address wallet,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = ecommerce.companies("1723456789001");
        assertEq(ruc, "1723456789001");
        assertEq(name, "Tech Solutions");
        assertEq(wallet, vendor);
    }

    function testAddProductPermissions() public {
        testRegisterCompany();

        string[4] memory photos = ["p1", "p2", "p3", "p4"];

        // Admin (Cuenta 0) puede crear para cualquier empresa
        vm.prank(admin);
        ecommerce.addProduct(
            "1723456789001",
            "Laptop Pro",
            photos,
            1000 * 10 ** 6,
            50,
            15
        );

        // Vendedor puede crear para su propia empresa
        vm.prank(vendor);
        ecommerce.addProduct(
            "1723456789001",
            "Mouse",
            photos,
            20 * 10 ** 6,
            100,
            0
        );

        // Otro usuario NO puede crear para esa empresa
        vm.expectRevert();
        vm.prank(buyer);
        ecommerce.addProduct("1723456789001", "Hacker Tool", photos, 0, 1, 0);
    }

    function testStockSafety() public {
        testAddProductPermissions();

        // El producto 1 tiene stock 50. Intentar comprar 100.
        vm.startPrank(buyer);
        ecommerce.registerClient(
            "Pepe",
            "1711111111",
            "pepe@mail.com",
            "098",
            "UIO"
        );

        vm.expectRevert("Stock insuficiente");
        ecommerce.addToCart(1, 100);
        vm.stopPrank();
    }

    function testFullPurchaseAndSplit() public {
        testRegisterCompany();
        string[4] memory photos = ["p1", "p2", "p3", "p4"];

        vm.prank(admin);
        ecommerce.addProduct(
            "1723456789001",
            "Laptop",
            photos,
            100 * 10 ** 6,
            10,
            0
        ); // 100 CBT, IVA 0%

        // Registro cliente y fondeo
        vm.startPrank(buyer);
        ecommerce.registerClient(
            "Juan",
            "1722222222",
            "juan@mail.com",
            "123",
            "GYE"
        );
        token.mint(buyer, 150 * 10 ** 6);
        token.approve(address(ecommerce), 150 * 10 ** 6);

        ecommerce.addToCart(1, 1); // 1 unidad = 100 CBT
        ecommerce.checkout();
        vm.stopPrank();

        // Verificar Split 90/10 (Comision 10% por defecto)
        assertEq(token.balanceOf(vault), 10 * 10 ** 6); // 10% de 100
        assertEq(token.balanceOf(vendor), 90 * 10 ** 6); // 90% de 100

        // Verificar stock
        (, , , , uint256 stock, , , ) = ecommerce.products(1);
        assertEq(stock, 9);
    }
}
