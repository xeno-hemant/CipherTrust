// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CipherTrustRBAC.sol";

/**
 * @title CipherTrustNFT
 * @notice Verifiable Digital Asset NFT smart contract linked with Decentralized Identifiers (DIDs).
 * @dev Inherits OpenZeppelin ERC721URIStorage, ERC721Enumerable, and Ownable. Restricted to authorized Issuers.
 */
contract CipherTrustNFT is ERC721URIStorage, ERC721Enumerable, Ownable {
    CipherTrustRBAC public rbacContract;
    uint256 private _nextTokenId;

    mapping(uint256 => string) public didOfToken;

    event OwnershipTransferredWithDid(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        string didLinked
    );

    /**
     * @notice Modifier enforcing caller holds ISSUER_ROLE in the linked CipherTrustRBAC contract.
     */
    modifier onlyAuthorizedIssuer() {
        require(
            rbacContract.hasRoleFor(msg.sender, rbacContract.ISSUER_ROLE()),
            "CipherTrustNFT: Caller is not an authorized issuer"
        );
        _;
    }

    /**
     * @notice Initializes the CipherTrust NFT contract.
     * @param rbacAddress Address of deployed CipherTrustRBAC contract.
     * @param initialOwner Address of contract owner.
     */
    constructor(address rbacAddress, address initialOwner)
        ERC721("CipherTrust Verifiable Asset", "CTVA")
        Ownable(initialOwner)
    {
        require(rbacAddress != address(0), "CipherTrustNFT: Invalid RBAC address");
        rbacContract = CipherTrustRBAC(rbacAddress);
        _nextTokenId = 1;
    }

    /**
     * @notice Mints a verifiable asset linked to a target DID.
     * @dev Only callable by an address holding ISSUER_ROLE in the RBAC contract.
     * @param to Recipient address receiving the minted NFT.
     * @param uri Metadata IPFS URI string.
     * @param didLinked Decentralized Identifier associated with asset recipient.
     * @return tokenId Newly minted token identifier.
     */
    function mintAsset(
        address to,
        string calldata uri,
        string calldata didLinked
    ) external onlyAuthorizedIssuer returns (uint256) {
        require(to != address(0), "CipherTrustNFT: Cannot mint to zero address");
        require(bytes(uri).length > 0, "CipherTrustNFT: URI cannot be empty");
        require(bytes(didLinked).length > 0, "CipherTrustNFT: DID link cannot be empty");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        didOfToken[tokenId] = didLinked;

        emit OwnershipTransferredWithDid(tokenId, address(0), to, didLinked);
        return tokenId;
    }

    /**
     * @notice Retrieves the linked DID string for a given token ID.
     * @param tokenId Target asset token ID.
     * @return Decentralized Identifier string associated with token.
     */
    function getDidOfToken(uint256 tokenId) external view returns (string memory) {
        _requireOwned(tokenId);
        return didOfToken[tokenId];
    }

    // Required overrides for OpenZeppelin ERC721 multi-inheritance

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address previousOwner = super._update(to, tokenId, auth);
        if (previousOwner != address(0) && to != address(0)) {
            emit OwnershipTransferredWithDid(tokenId, previousOwner, to, didOfToken[tokenId]);
        }
        return previousOwner;
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
