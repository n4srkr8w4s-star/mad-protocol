// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IMADStateRegistry} from "./interfaces/IMADStateRegistry.sol";
import {MADDisorders} from "./libraries/MADDisorders.sol";

/// @title MAD State Registry
/// @notice Canonical onchain registry for Active Disorder state.
/// @dev MAD Engine performs analysis offchain. This registry publishes
///      compact, auditable and reproducible state results onchain.
contract MADStateRegistry is IMADStateRegistry, AccessControl, Pausable {
    // =============================================================
    //                           ROLES
    // =============================================================

    /// @notice Accounts allowed to publish MAD state updates.
    bytes32 public constant MAD_UPDATER_ROLE = keccak256("MAD_UPDATER_ROLE");

    // =============================================================
    //                           TYPES
    // =============================================================

    // =============================================================
    //                          STORAGE
    // =============================================================

    /// @notice Whether an asset is currently supported by MAD.
    mapping(address => bool) public override supportedAssets;

    /// @dev Latest state for each supported asset.
    mapping(address => AssetState) private assetStates;

    /// @dev Lifetime update sequence for each asset.
    ///      This is deliberately retained even if support is disabled.
    mapping(address => uint256) private assetSequences;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event AssetSupportChanged(address indexed asset, bool supported);

    event StateUpdated(
        address indexed asset,
        uint8 disorderScore,
        Severity severity,
        uint256 disorderBitmap,
        bytes32 evidenceHash,
        bytes32 rulesetHash,
        uint256 sequence,
        uint256 updatedAt
    );

    event AssetStateCleared(address indexed asset, uint256 lastSequence);

    // =============================================================
    //                           ERRORS
    // =============================================================

    error ZeroAddress();
    error UnsupportedAsset();
    error InvalidDisorderScore();
    error MissingEvidence();
    error MissingRuleset();
    error AssetSupportUnchanged();

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MAD_UPDATER_ROLE, initialAdmin);
    }

    // =============================================================
    //                     ADMINISTRATION
    // =============================================================

    /// @notice Enable or disable MAD support for an asset.
    /// @dev Disabling an asset clears its current state so that stale
    ///      state cannot become canonical again if the asset is re-enabled.
    ///      Historical StateUpdated events remain permanently available.
    function setAssetSupported(address asset, bool supported) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (asset == address(0)) revert ZeroAddress();

        if (supportedAssets[asset] == supported) {
            revert AssetSupportUnchanged();
        }

        supportedAssets[asset] = supported;

        if (!supported) {
            delete assetStates[asset];

            emit AssetStateCleared(asset, assetSequences[asset]);
        }

        emit AssetSupportChanged(asset, supported);
    }

    /// @notice Pause publication of new MAD states.
    /// @dev Existing states remain readable.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Resume publication of MAD states.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // =============================================================
    //                       STATE UPDATES
    // =============================================================

    /// @notice Publish the latest MAD state for an asset.
    /// @param asset Supported tokenised asset.
    /// @param disorderScore Deterministic MAD score from 0 to 100.
    /// @param disorderBitmap Bitmap representing active disorder types.
    /// @param evidenceHash Hash of the canonical evidence payload.
    /// @param rulesetHash Hash identifying the scoring/ruleset version.
    function updateState(
        address asset,
        uint8 disorderScore,
        uint256 disorderBitmap,
        bytes32 evidenceHash,
        bytes32 rulesetHash
    ) external onlyRole(MAD_UPDATER_ROLE) whenNotPaused {
        if (!supportedAssets[asset]) {
            revert UnsupportedAsset();
        }

        if (disorderScore > 100) {
            revert InvalidDisorderScore();
        }

        if (evidenceHash == bytes32(0)) {
            revert MissingEvidence();
        }

        if (rulesetHash == bytes32(0)) {
            revert MissingRuleset();
        }

        uint256 nextSequence = assetSequences[asset] + 1;

        assetSequences[asset] = nextSequence;

        Severity severity = _severityFromScore(disorderScore);

        AssetState memory newState = AssetState({
            disorderScore: disorderScore,
            severity: severity,
            disorderBitmap: disorderBitmap,
            evidenceHash: evidenceHash,
            rulesetHash: rulesetHash,
            updatedAt: block.timestamp,
            sequence: nextSequence
        });

        assetStates[asset] = newState;

        emit StateUpdated(
            asset, disorderScore, severity, disorderBitmap, evidenceHash, rulesetHash, nextSequence, block.timestamp
        );
    }

    // =============================================================
    //                           READS
    // =============================================================

    /// @notice Return the latest canonical MAD state for an asset.
    function getState(address asset) external view override returns (AssetState memory) {
        if (!supportedAssets[asset]) {
            revert UnsupportedAsset();
        }

        return assetStates[asset];
    }

    /// @notice Return whether at least one Active Disorder is present.
    function isDisordered(address asset) external view override returns (bool) {
        if (!supportedAssets[asset]) {
            revert UnsupportedAsset();
        }

        return assetStates[asset].disorderBitmap != 0;
    }

    /// @notice Check whether a particular Active Disorder is present.
    /// @param disorderId Disorder identifier from 0 to 255.
    function hasDisorder(address asset, uint8 disorderId) external view override returns (bool) {
        if (!supportedAssets[asset]) {
            revert UnsupportedAsset();
        }

        return MADDisorders.contains(assetStates[asset].disorderBitmap, disorderId);
    }

    /// @notice Number of states ever published for an asset.
    /// @dev Remains available even if the asset is disabled.
    function latestSequence(address asset) external view override returns (uint256) {
        return assetSequences[asset];
    }

    // =============================================================
    //                      INTERNAL LOGIC
    // =============================================================

    function _severityFromScore(uint8 score) internal pure returns (Severity) {
        if (score >= 80) {
            return Severity.CRITICAL;
        }

        if (score >= 60) {
            return Severity.HIGH;
        }

        if (score >= 40) {
            return Severity.ELEVATED;
        }

        if (score >= 20) {
            return Severity.WATCH;
        }

        return Severity.NORMAL;
    }
}
