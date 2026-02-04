// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CBToken.sol";

contract CBTokenTest is Test {
    CBToken public token;
    address public owner = address(1);
    address public user = address(2);

    event TokensMinted(address indexed to, uint256 amount);

    function setUp() public {
        vm.prank(owner);
        token = new CBToken(owner);
    }

    function test_InitialSetup() public view {
        assertEq(token.name(), "Crypto Business Token");
        assertEq(token.symbol(), "CBT");
        assertEq(token.decimals(), 6);
        assertEq(token.owner(), owner);
    }

    function test_MintByOwner() public {
        uint256 mintAmount = 1000 * 10 ** 6;

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit TokensMinted(user, mintAmount);
        token.mint(user, mintAmount);

        assertEq(token.balanceOf(user), mintAmount);
    }

    function testRevert_MintByNonOwner() public {
        uint256 mintAmount = 1000 * 10 ** 6;

        vm.prank(user);
        // Ownable de OpenZeppelin lanza OwnableUnauthorizedAccount
        // pero depende de la versión. Usaremos el mensaje genérico o buscaremos el error.
        // En 5.x es error OwnableUnauthorizedAccount(address account)
        vm.expectRevert();
        token.mint(user, mintAmount);
    }

    function test_Transfer() public {
        uint256 mintAmount = 1000 * 10 ** 6;
        uint256 transferAmount = 500 * 10 ** 6;

        vm.prank(owner);
        token.mint(user, mintAmount);

        vm.prank(user);
        token.transfer(address(3), transferAmount);

        assertEq(token.balanceOf(user), mintAmount - transferAmount);
        assertEq(token.balanceOf(address(3)), transferAmount);
    }
}
