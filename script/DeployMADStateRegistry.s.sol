// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {MADStateRegistry} from "../src/MADStateRegistry.sol";

contract DeployMADStateRegistry is Script {
    function run() external returns (MADStateRegistry registry) {
        address initialAdmin = vm.envAddress("DEPLOYER_ADDRESS");

        vm.startBroadcast();

        registry = new MADStateRegistry(initialAdmin);

        vm.stopBroadcast();
    }
}
