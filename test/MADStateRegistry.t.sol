// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MADStateRegistry} from "../src/MADStateRegistry.sol";
import {IMADStateRegistry} from "../src/interfaces/IMADStateRegistry.sol";

contract MADStateRegistryTest is Test {
    MADStateRegistry internal registry;

    address internal admin;
    address internal updater;
    address internal outsider;
    address internal asset;

    bytes32 internal evidenceHash;
    bytes32 internal rulesetHash;

    function setUp() public {
        admin = makeAddr("admin");
        updater = makeAddr("updater");
        outsider = makeAddr("outsider");
        asset = makeAddr("NVDA");

        evidenceHash = keccak256("MAD-EVIDENCE-001");
        rulesetHash = keccak256("MAD-RULESET-0.1");

        registry = new MADStateRegistry(admin);

        vm.startPrank(admin);

        registry.setAssetSupported(asset, true);

        registry.grantRole(registry.MAD_UPDATER_ROLE(), updater);

        vm.stopPrank();
    }

    // =============================================================
    //                         DEPLOYMENT
    // =============================================================

    function testInitialRolesAreConfigured() public view {
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin));

        assertTrue(registry.hasRole(registry.MAD_UPDATER_ROLE(), admin));

        assertTrue(registry.hasRole(registry.MAD_UPDATER_ROLE(), updater));
    }

    function testAssetIsSupported() public view {
        assertTrue(registry.supportedAssets(asset));
    }

    // =============================================================
    //                       STATE UPDATES
    // =============================================================

    function testUpdateStateStoresCanonicalState() public {
        vm.warp(1_800_000_000);

        uint256 bitmap = (uint256(1) << 1) | (uint256(1) << 4);

        vm.prank(updater);

        registry.updateState(asset, 73, bitmap, evidenceHash, rulesetHash);

        MADStateRegistry.AssetState memory state = registry.getState(asset);

        assertEq(state.disorderScore, 73);

        assertEq(uint256(state.severity), uint256(IMADStateRegistry.Severity.HIGH));

        assertEq(state.disorderBitmap, bitmap);
        assertEq(state.evidenceHash, evidenceHash);
        assertEq(state.rulesetHash, rulesetHash);
        assertEq(state.updatedAt, 1_800_000_000);
        assertEq(state.sequence, 1);

        assertEq(registry.latestSequence(asset), 1);
    }

    function testSequenceIncrementsAcrossUpdates() public {
        _updateState(20, uint256(1) << 0);

        _updateState(40, uint256(1) << 1);

        _updateState(80, uint256(1) << 2);

        MADStateRegistry.AssetState memory state = registry.getState(asset);

        assertEq(state.sequence, 3);

        assertEq(registry.latestSequence(asset), 3);
    }

    // =============================================================
    //                      SEVERITY BOUNDARIES
    // =============================================================

    function testSeverityBoundaries() public {
        _assertSeverity(0, IMADStateRegistry.Severity.NORMAL);

        _assertSeverity(19, IMADStateRegistry.Severity.NORMAL);

        _assertSeverity(20, IMADStateRegistry.Severity.WATCH);

        _assertSeverity(39, IMADStateRegistry.Severity.WATCH);

        _assertSeverity(40, IMADStateRegistry.Severity.ELEVATED);

        _assertSeverity(59, IMADStateRegistry.Severity.ELEVATED);

        _assertSeverity(60, IMADStateRegistry.Severity.HIGH);

        _assertSeverity(79, IMADStateRegistry.Severity.HIGH);

        _assertSeverity(80, IMADStateRegistry.Severity.CRITICAL);

        _assertSeverity(100, IMADStateRegistry.Severity.CRITICAL);
    }

    // =============================================================
    //                      DISORDER BITMAP
    // =============================================================

    function testBitmapDetectsActiveDisorders() public {
        uint256 bitmap = (uint256(1) << 1) | (uint256(1) << 4);

        _updateState(73, bitmap);

        assertTrue(registry.isDisordered(asset));

        assertTrue(registry.hasDisorder(asset, 1));

        assertTrue(registry.hasDisorder(asset, 4));

        assertFalse(registry.hasDisorder(asset, 2));
    }

    function testZeroBitmapIsNotDisordered() public {
        _updateState(0, 0);

        assertFalse(registry.isDisordered(asset));
    }

    // =============================================================
    //                         VALIDATION
    // =============================================================

    function testRejectsScoreAbove100() public {
        vm.expectRevert(MADStateRegistry.InvalidDisorderScore.selector);

        vm.prank(updater);

        registry.updateState(asset, 101, 0, evidenceHash, rulesetHash);
    }

    function testRejectsMissingEvidence() public {
        vm.expectRevert(MADStateRegistry.MissingEvidence.selector);

        vm.prank(updater);

        registry.updateState(asset, 20, 1, bytes32(0), rulesetHash);
    }

    function testRejectsMissingRuleset() public {
        vm.expectRevert(MADStateRegistry.MissingRuleset.selector);

        vm.prank(updater);

        registry.updateState(asset, 20, 1, evidenceHash, bytes32(0));
    }

    // =============================================================
    //                       ACCESS CONTROL
    // =============================================================

    function testUnauthorisedAccountCannotUpdateState() public {
        vm.expectRevert();

        vm.prank(outsider);

        registry.updateState(asset, 20, 1, evidenceHash, rulesetHash);
    }

    function testUnauthorisedAccountCannotAddAsset() public {
        address secondAsset = makeAddr("AAPL");

        vm.expectRevert();

        vm.prank(outsider);

        registry.setAssetSupported(secondAsset, true);
    }

    // =============================================================
    //                          PAUSING
    // =============================================================

    function testPausedRegistryRejectsUpdates() public {
        vm.prank(admin);
        registry.pause();

        assertTrue(registry.paused());

        vm.expectRevert();

        vm.prank(updater);

        registry.updateState(asset, 20, 1, evidenceHash, rulesetHash);
    }

    function testUpdatesResumeAfterUnpause() public {
        vm.startPrank(admin);

        registry.pause();
        registry.unpause();

        vm.stopPrank();

        _updateState(40, 1);

        MADStateRegistry.AssetState memory state = registry.getState(asset);

        assertEq(state.disorderScore, 40);
    }

    // =============================================================
    //                    ASSET LIFECYCLE
    // =============================================================

    function testDisablingAssetClearsCurrentState() public {
        _updateState(73, uint256(1) << 1);

        assertEq(registry.latestSequence(asset), 1);

        vm.prank(admin);

        registry.setAssetSupported(asset, false);

        assertFalse(registry.supportedAssets(asset));

        assertEq(registry.latestSequence(asset), 1);

        vm.expectRevert(MADStateRegistry.UnsupportedAsset.selector);

        MADStateRegistry.AssetState memory unusedState = registry.getState(asset);

        unusedState;
    }

    function testSequenceContinuesAfterReenable() public {
        _updateState(20, 1);

        vm.startPrank(admin);

        registry.setAssetSupported(asset, false);

        registry.setAssetSupported(asset, true);

        vm.stopPrank();

        MADStateRegistry.AssetState memory clearedState = registry.getState(asset);

        assertEq(clearedState.disorderScore, 0);

        assertEq(clearedState.sequence, 0);

        assertEq(registry.latestSequence(asset), 1);

        _updateState(40, 2);

        MADStateRegistry.AssetState memory newState = registry.getState(asset);

        assertEq(newState.sequence, 2);

        assertEq(registry.latestSequence(asset), 2);
    }

    function testRejectsUnchangedAssetSupport() public {
        vm.expectRevert(MADStateRegistry.AssetSupportUnchanged.selector);

        vm.prank(admin);

        registry.setAssetSupported(asset, true);
    }

    function testRejectsZeroAddressAsset() public {
        vm.expectRevert(MADStateRegistry.ZeroAddress.selector);

        vm.prank(admin);

        registry.setAssetSupported(address(0), true);
    }

    // =============================================================
    //                          HELPERS
    // =============================================================

    function _updateState(uint8 score, uint256 bitmap) internal {
        vm.prank(updater);

        registry.updateState(asset, score, bitmap, evidenceHash, rulesetHash);
    }

    function _assertSeverity(uint8 score, IMADStateRegistry.Severity expected) internal {
        _updateState(score, 0);

        MADStateRegistry.AssetState memory state = registry.getState(asset);

        assertEq(uint256(state.severity), uint256(expected));
    }
}
