// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IMADStateRegistry
/// @notice Public integration interface for the MAD State Registry.
interface IMADStateRegistry {
    enum Severity {
        NORMAL,
        WATCH,
        ELEVATED,
        HIGH,
        CRITICAL
    }

    struct AssetState {
        uint8 disorderScore;
        Severity severity;
        uint256 disorderBitmap;
        bytes32 evidenceHash;
        bytes32 rulesetHash;
        uint256 updatedAt;
        uint256 sequence;
    }

    /// @notice Returns the latest canonical MAD state for an asset.
    function getState(address asset) external view returns (AssetState memory);

    /// @notice Returns true if at least one Active Disorder is present.
    function isDisordered(address asset) external view returns (bool);

    /// @notice Checks whether a specific Active Disorder is present.
    /// @param asset Tokenised asset address.
    /// @param disorderId Active Disorder identifier from 0 to 255.
    function hasDisorder(address asset, uint8 disorderId) external view returns (bool);

    /// @notice Returns the lifetime number of state updates for an asset.
    function latestSequence(address asset) external view returns (uint256);

    /// @notice Returns whether MAD currently supports the asset.
    function supportedAssets(address asset) external view returns (bool);
}
