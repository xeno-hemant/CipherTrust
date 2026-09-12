import { expect } from "chai";
import { ethers } from "hardhat";
import { CipherTrustRBAC, CipherTrustNFT, CipherTrustAudit } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CipherTrust Smart Contract Suite", function () {
  let rbac: CipherTrustRBAC;
  let nft: CipherTrustNFT;
  let audit: CipherTrustAudit;

  let admin: SignerWithAddress;
  let issuer: SignerWithAddress;
  let holder: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  let ISSUER_ROLE: string;
  let ADMIN_ROLE: string;

  beforeEach(async function () {
    [admin, issuer, holder, unauthorized] = await ethers.getSigners();

    // Deploy RBAC
    const RBACFactory = await ethers.getContractFactory("CipherTrustRBAC");
    rbac = (await RBACFactory.deploy(admin.address)) as CipherTrustRBAC;

    ISSUER_ROLE = await rbac.ISSUER_ROLE();
    ADMIN_ROLE = await rbac.ADMIN_ROLE();

    // Grant ISSUER_ROLE to issuer account
    await rbac.connect(admin).assignRole(issuer.address, ISSUER_ROLE);

    // Deploy NFT
    const NFTFactory = await ethers.getContractFactory("CipherTrustNFT");
    nft = (await NFTFactory.deploy(await rbac.getAddress(), admin.address)) as CipherTrustNFT;

    // Deploy Audit
    const AuditFactory = await ethers.getContractFactory("CipherTrustAudit");
    audit = (await AuditFactory.deploy(await rbac.getAddress())) as CipherTrustAudit;
  });

  describe("1. CipherTrustRBAC", function () {
    it("Admin can assign and unassign roles", async function () {
      const VERIFIER_ROLE = await rbac.VERIFIER_ROLE();
      expect(await rbac.hasRoleFor(holder.address, VERIFIER_ROLE)).to.be.false;

      await expect(rbac.connect(admin).assignRole(holder.address, VERIFIER_ROLE))
        .to.emit(rbac, "RoleAssignedByAdmin")
        .withArgs(holder.address, VERIFIER_ROLE, admin.address);

      expect(await rbac.hasRoleFor(holder.address, VERIFIER_ROLE)).to.be.true;

      await expect(rbac.connect(admin).unassignRole(holder.address, VERIFIER_ROLE))
        .to.emit(rbac, "RoleRevokedByAdmin")
        .withArgs(holder.address, VERIFIER_ROLE, admin.address);

      expect(await rbac.hasRoleFor(holder.address, VERIFIER_ROLE)).to.be.false;
    });

    it("Non-admin cannot assign roles", async function () {
      const HOLDER_ROLE = await rbac.HOLDER_ROLE();
      await expect(
        rbac.connect(unauthorized).assignRole(holder.address, HOLDER_ROLE)
      ).to.be.revertedWith("CipherTrustRBAC: Caller is not an admin");
    });
  });

  describe("2. CipherTrustNFT", function () {
    const testDid = "did:ethr:31337:0x1234567890123456789012345678901234567890";
    const tokenUri = "ipfs://QmTest123456789";

    it("Authorized Issuer can mint asset successfully", async function () {
      const mintTx = await nft.connect(issuer).mintAsset(holder.address, tokenUri, testDid);
      const receipt = await mintTx.wait();

      expect(await nft.balanceOf(holder.address)).to.equal(1);
      expect(await nft.ownerOf(1)).to.equal(holder.address);
      expect(await nft.tokenURI(1)).to.equal(tokenUri);
      expect(await nft.getDidOfToken(1)).to.equal(testDid);
    });

    it("Unauthorized account cannot mint asset", async function () {
      await expect(
        nft.connect(unauthorized).mintAsset(holder.address, tokenUri, testDid)
      ).to.be.revertedWith("CipherTrustNFT: Caller is not an authorized issuer");
    });

    it("Ownership transfer emits custom event with linked DID", async function () {
      await nft.connect(issuer).mintAsset(holder.address, tokenUri, testDid);

      const recipient = unauthorized.address;
      await expect(nft.connect(holder).transferFrom(holder.address, recipient, 1))
        .to.emit(nft, "OwnershipTransferredWithDid")
        .withArgs(1, holder.address, recipient, testDid);

      expect(await nft.ownerOf(1)).to.equal(recipient);
    });
  });

  describe("3. CipherTrustAudit", function () {
    const testDid = "did:ethr:31337:0x9876543210987654321098765432109876543210";

    it("Admin and Issuer can log audit events, incrementing count", async function () {
      expect(await audit.getAuditCount()).to.equal(0);

      const eventTypeHash = ethers.id("DID_CREATED");

      await expect(audit.connect(issuer).logEvent(eventTypeHash, issuer.address, testDid))
        .to.emit(audit, "AuditLogged")
        .withArgs(eventTypeHash, issuer.address, testDid, (val: bigint) => val > 0n, 0);

      expect(await audit.getAuditCount()).to.equal(1);

      const entry = await audit.getEntry(0);
      expect(entry.eventType).to.equal(eventTypeHash);
      expect(entry.actor).to.equal(issuer.address);
      expect(entry.targetDid).to.equal(testDid);
    });

    it("Unauthorized user cannot log audit events", async function () {
      const eventTypeHash = ethers.id("DID_CREATED");
      await expect(
        audit.connect(unauthorized).logEvent(eventTypeHash, unauthorized.address, testDid)
      ).to.be.revertedWith("CipherTrustAudit: Caller unauthorized to log audit events");
    });
  });
});
