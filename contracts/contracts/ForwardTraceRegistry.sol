// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ForwardTraceRegistry
 * @dev Immutable trace chain for permission-based message forwarding.
 */
contract ForwardTraceRegistry {
    event ForwardTraced(
        bytes32 indexed originalMessageId,
        bytes32 indexed forwardId,
        address indexed forwardedBy,
        bool permissionGranted,
        uint256 timestamp
    );

    function traceForward(
        bytes32 originalMessageId,
        bytes32 forwardId,
        bool permissionGranted
    ) external {
        emit ForwardTraced(
            originalMessageId,
            forwardId,
            msg.sender,
            permissionGranted,
            block.timestamp
        );
    }
}
