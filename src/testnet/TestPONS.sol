// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title PONS Test Asset
/// @notice Testnet-only asset used for MAD integration demonstrations.
/// @dev This is NOT an official PONS token and has no economic value.
contract TestPONS is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;

    constructor(address initialHolder) ERC20("PONS Test Asset", "tPONS") {
        _mint(initialHolder, INITIAL_SUPPLY);
    }
}
