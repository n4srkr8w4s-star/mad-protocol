// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TestPONS} from "../src/testnet/TestPONS.sol";

contract TestPONSTest is Test {
    address internal holder = address(0xBEEF);

    function testInitialSupplyIsMintedToHolder() public {
        TestPONS token = new TestPONS(holder);

        assertEq(token.name(), "PONS Test Asset");
        assertEq(token.symbol(), "tPONS");
        assertEq(token.totalSupply(), 1_000_000 ether);
        assertEq(token.balanceOf(holder), 1_000_000 ether);
    }
}
