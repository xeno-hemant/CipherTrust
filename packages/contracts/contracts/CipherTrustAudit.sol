// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CipherTrustRBAC.sol";

/**
 * @title CipherTrustAudit
 * @notice Append-only immutable audit trail contract for logging security & identity events.
 * @dev Restricted to caller addresses with ADMIN_ROLE or ISSUER_ROLE in CipherTrustRBAC.
 */
contract CipherTrustAudit {
    CipherTrustRBAC public rbacContract;

    struct AuditEntry {
        bytes32 eventType;
        address actor;
        string targetDid;
        uint256 timestamp;
    }

    AuditEntry[] private _auditLogs;

    event AuditLogged(
        bytes32 indexed eventType,
        address indexed actor,
        string targetDid,
        uint256 timestamp,
        uint256 indexed logIndex
    );

    /**
     * @notice Modifier restricting execution to accounts holding ADMIN_ROLE or ISSUER_ROLE.
     */
    modifier onlyAuthorized() {
        bool isAdmin = rbacContract.hasRoleFor(msg.sender, rbacContract.ADMIN_ROLE());
        bool isIssuer = rbacContract.hasRoleFor(msg.sender, rbacContract.ISSUER_ROLE());
        require(isAdmin || isIssuer, "CipherTrustAudit: Caller unauthorized to log audit events");
        _;
    }

    /**
     * @notice Initializes the Audit contract.
     * @param rbacAddress Address of deployed CipherTrustRBAC contract.
     */
    constructor(address rbacAddress) {
        require(rbacAddress != address(0), "CipherTrustAudit: Invalid RBAC address");
        rbacContract = CipherTrustRBAC(rbacAddress);
    }

    /**
     * @notice Appends a new immutable audit record to the chain.
     * @param eventType Keccak256 hash or string representation of event category.
     * @param actor Wallet address performing the audited action.
     * @param targetDid Linked DID identifier involved in action.
     * @return index Storage index of logged entry.
     */
    function logEvent(
        bytes32 eventType,
        address actor,
        string calldata targetDid
    ) external onlyAuthorized returns (uint256) {
        require(actor != address(0), "CipherTrustAudit: Actor cannot be zero address");

        uint256 index = _auditLogs.length;
        _auditLogs.push(AuditEntry({
            eventType: eventType,
            actor: actor,
            targetDid: targetDid,
            timestamp: block.timestamp
        }));

        emit AuditLogged(eventType, actor, targetDid, block.timestamp, index);
        return index;
    }

    /**
     * @notice Returns total number of audit records logged on-chain.
     * @return Total count of audit entries.
     */
    function getAuditCount() external view returns (uint256) {
        return _auditLogs.length;
    }

    /**
     * @notice Retrieves a specific audit log record by index.
     * @param index Target array index.
     * @return eventType Event type hash.
     * @return actor Actor address.
     * @return targetDid Linked DID string.
     * @return timestamp Block timestamp when logged.
     */
    function getEntry(uint256 index)
        external
        view
        returns (
            bytes32 eventType,
            address actor,
            string memory targetDid,
            uint256 timestamp
        )
    {
        require(index < _auditLogs.length, "CipherTrustAudit: Index out of bounds");
        AuditEntry memory entry = _auditLogs[index];
        return (entry.eventType, entry.actor, entry.targetDid, entry.timestamp);
    }
}
