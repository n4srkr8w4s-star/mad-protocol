// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {TestPONS} from "../src/testnet/TestPONS.sol";

contract DeployTestPONS is Script {
    function run() external returns (TestPONS token) {
        address initialHolder = vm.envAddress("DEPLOYER_ADDRESS");

        vm.startBroadcast();

        token = new TestPONS(initialHolder);

        vm.stopBroadcast();
    }
}
