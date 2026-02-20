// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MessageHashRegistry
 * @dev Immutable audit log for message hashes. Used by MonM backend only.
 */
contract MessageHashRegistry {
    event MessageHashLogged(
        bytes32 indexed messageId,
        bytes32 indexed messageHash,
        address indexed logger,
        uint256 timestamp
    );

    function logMessageHash(bytes32 messageId, bytes32 messageHash) external {
        emit MessageHashLogged(messageId, messageHash, msg.sender, block.timestamp);
    }
}
