// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "./Ecommerce.t.sol"; // Import MockERC20

contract CartTest is Test {
    Ecommerce public ecommerce;
    MockERC20 public token;

    address admin = address(0xF39);
    address vault = address(0x709);
    address vendor = address(0x123);
    address buyer = address(0x456);

    function setUp() public {
        vm.startPrank(admin);
        token = new MockERC20();
        ecommerce = new Ecommerce(address(token), vault);

        // Register Company
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

        // Add Product
        string[4] memory photos = ["p1", "p2", "p3", "p4"];
        ecommerce.addProduct(
            "1723456789001",
            "Laptop",
            photos,
            100 * 10 ** 6,
            10, // Stock
            0
        );
        vm.stopPrank();

        // Register Client
        vm.startPrank(buyer);
        ecommerce.registerClient(
            "Juan",
            "1722222222",
            "juan@mail.com",
            "123",
            "GYE"
        );
        vm.stopPrank();
    }

    function testRemoveFromCartPartial() public {
        vm.startPrank(buyer);

        // Add 5 items
        ecommerce.addToCart(1, 5);

        CartLib.CartItem[] memory items = ecommerce.getCartItems();
        assertEq(items.length, 1);
        assertEq(items[0].quantity, 5);

        // Remove 2 items
        ecommerce.removeFromCart(1, 2);

        items = ecommerce.getCartItems();
        assertEq(items.length, 1);
        assertEq(items[0].quantity, 3);

        vm.stopPrank();
    }

    function testRemoveFromCartFull() public {
        vm.startPrank(buyer);

        // Add 5 items
        ecommerce.addToCart(1, 5);

        // Remove 5 items (Exact amount)
        ecommerce.removeFromCart(1, 5);

        CartLib.CartItem[] memory items = ecommerce.getCartItems();
        assertEq(items.length, 0);

        vm.stopPrank();
    }

    function testRemoveFromCartMoreThanQuantity() public {
        vm.startPrank(buyer);

        // Add 5 items
        ecommerce.addToCart(1, 5);

        // Remove 10 items (Should remove item completely)
        ecommerce.removeFromCart(1, 10);

        CartLib.CartItem[] memory items = ecommerce.getCartItems();
        assertEq(items.length, 0);

        vm.stopPrank();
    }

    function testClearCart() public {
        vm.startPrank(buyer);

        ecommerce.addToCart(1, 5);

        CartLib.CartItem[] memory items = ecommerce.getCartItems();
        assertEq(items.length, 1);

        ecommerce.clearCart();

        items = ecommerce.getCartItems();
        assertEq(items.length, 0);

        vm.stopPrank();
    }
}
