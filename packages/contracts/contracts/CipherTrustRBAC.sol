// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CipherTrustRBAC
 * @notice Role-Based Access Control smart contract for CipherTrust identity platform.
 * @dev Inherits OpenZeppelin AccessControl to manage platform permissions for Admins, Issuers, Verifiers, and Holders.
 */
contract CipherTrustRBAC is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant HOLDER_ROLE = keccak256("HOLDER_ROLE");

    event RoleAssignedByAdmin(address indexed account, bytes32 indexed role, address indexed assignedBy);
    event RoleRevokedByAdmin(address indexed account, bytes32 indexed role, address indexed revokedBy);

    /**
     * @notice Modifier checking if the caller possesses the ISSUER_ROLE.
     */
    modifier onlyIssuer() {
        require(hasRole(ISSUER_ROLE, msg.sender), "CipherTrustRBAC: Caller is not an issuer");
        _;
    }

    /**
     * @notice Modifier checking if the caller possesses the ADMIN_ROLE.
     */
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "CipherTrustRBAC: Caller is not an admin");
        _;
    }

    /**
     * @notice Initializes the RBAC contract granting ADMIN_ROLE and DEFAULT_ADMIN_ROLE to initialAdmin.
     * @param initialAdmin Address of the primary administrator.
     */
    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "CipherTrustRBAC: Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);

        _setRoleAdmin(ISSUER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(VERIFIER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(HOLDER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
    }

    /**
     * @notice Assigns a specific role to a target address.
     * @dev Only callable by an account holding ADMIN_ROLE.
     * @param account Address receiving the role assignment.
     * @param role Hash of the role being assigned.
     */
    function assignRole(address account, bytes32 role) external onlyAdmin {
        require(account != address(0), "CipherTrustRBAC: Invalid account address");
        _grantRole(role, account);
        emit RoleAssignedByAdmin(account, role, msg.sender);
    }

    /**
     * @notice Revokes a specific role from a target address.
     * @dev Only callable by an account holding ADMIN_ROLE.
     * @param account Address losing the role assignment.
     * @param role Hash of the role being revoked.
     */
    function unassignRole(address account, bytes32 role) external onlyAdmin {
        require(account != address(0), "CipherTrustRBAC: Invalid account address");
        _revokeRole(role, account);
        emit RoleRevokedByAdmin(account, role, msg.sender);
    }

    /**
     * @notice Checks whether an address holds a specified role.
     * @param account Target address to check.
     * @param role Hash of the role being queried.
     * @return True if account holds the role, false otherwise.
     */
    function hasRoleFor(address account, bytes32 role) external view returns (bool) {
        return hasRole(role, account);
    }
}
