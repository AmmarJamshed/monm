// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FileFingerprintRegistry
 * @dev Registry for media/file fingerprints. Enables leak traceability.
 */
contract FileFingerprintRegistry {
    event FingerprintRegistered(
        bytes32 indexed fingerprint,
        string ipfsCid,
        address indexed registrar,
        uint256 timestamp
    );

    function registerFingerprint(bytes32 fingerprint, string calldata ipfsCid) external {
        emit FingerprintRegistered(fingerprint, ipfsCid, msg.sender, block.timestamp);
    }
}
