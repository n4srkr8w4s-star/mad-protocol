// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MAD Disorders
/// @notice Canonical Active Disorder identifiers used across MAD.
/// @dev IDs are protocol-level constants and MUST NOT be reassigned.
library MADDisorders {
    uint8 internal constant PRICE_DISLOCATION = 0;
    uint8 internal constant UNDERLYING_TRADING_HALT = 1;
    uint8 internal constant CORPORATE_ACTION_PENDING = 2;
    uint8 internal constant MULTIPLIER_TRANSITION = 3;
    uint8 internal constant REFERENCE_DATA_STALE = 4;
    uint8 internal constant LIQUIDITY_STRESS = 5;
    uint8 internal constant MARKET_SESSION_DISLOCATION = 6;
    uint8 internal constant ORACLE_DEVIATION = 7;

    function mask(uint8 disorderId) internal pure returns (uint256) {
        return uint256(1) << disorderId;
    }

    function contains(uint256 bitmap, uint8 disorderId) internal pure returns (bool) {
        return (bitmap & mask(disorderId)) != 0;
    }
}
