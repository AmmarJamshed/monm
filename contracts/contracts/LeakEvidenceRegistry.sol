// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LeakEvidenceRegistry
 * @dev Immutable evidence log for detected content leaks. Used for legal/audit.
 */
contract LeakEvidenceRegistry {
    event LeakReported(
        bytes32 indexed reportId,
        bytes32 indexed fingerprint,
        string sourceUrl,
        address indexed reporter,
        uint256 timestamp
    );

    function reportLeak(
        bytes32 reportId,
        bytes32 fingerprint,
        string calldata sourceUrl
    ) external {
        emit LeakReported(reportId, fingerprint, sourceUrl, msg.sender, block.timestamp);
    }
}
