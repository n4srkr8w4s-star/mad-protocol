// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MADDisorders} from "../src/libraries/MADDisorders.sol";

contract MADDisordersTest is Test {
    function testMaskCreatesCorrectBit() public pure {
        assertEq(MADDisorders.mask(MADDisorders.PRICE_DISLOCATION), uint256(1) << 0);

        assertEq(MADDisorders.mask(MADDisorders.UNDERLYING_TRADING_HALT), uint256(1) << 1);

        assertEq(MADDisorders.mask(MADDisorders.ORACLE_DEVIATION), uint256(1) << 7);
    }

    function testContainsDetectsMultipleDisorders() public pure {
        uint256 bitmap = MADDisorders.mask(MADDisorders.PRICE_DISLOCATION)
            | MADDisorders.mask(MADDisorders.REFERENCE_DATA_STALE) | MADDisorders.mask(MADDisorders.ORACLE_DEVIATION);

        assertTrue(MADDisorders.contains(bitmap, MADDisorders.PRICE_DISLOCATION));

        assertTrue(MADDisorders.contains(bitmap, MADDisorders.REFERENCE_DATA_STALE));

        assertTrue(MADDisorders.contains(bitmap, MADDisorders.ORACLE_DEVIATION));

        assertFalse(MADDisorders.contains(bitmap, MADDisorders.LIQUIDITY_STRESS));
    }

    function testZeroBitmapContainsNoDisorders() public pure {
        assertFalse(MADDisorders.contains(0, MADDisorders.PRICE_DISLOCATION));
    }
}
