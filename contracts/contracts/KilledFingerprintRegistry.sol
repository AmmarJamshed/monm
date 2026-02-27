// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KilledFingerprintRegistry
 * @dev Immutable on-chain record of killed file fingerprints.
 *      When kill switch is activated, the fingerprint is registered here.
 *      Any viewer (e.g. embedded macro in Office files) can check isKilled()
 *      before rendering content — making files unreadable even if already downloaded.
 */
contract KilledFingerprintRegistry {
    mapping(bytes32 => bool) public killed;
    
    event FingerprintKilled(
        bytes32 indexed fingerprint,
        address indexed killedBy,
        uint256 timestamp
    );

    function killFingerprint(bytes32 fingerprint) external {
        require(!killed[fingerprint], "Already killed");
        killed[fingerprint] = true;
        emit FingerprintKilled(fingerprint, msg.sender, block.timestamp);
    }

    function isKilled(bytes32 fingerprint) external view returns (bool) {
        return killed[fingerprint];
    }
}
