import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`[Deployer] Deploying CipherTrust contract suite with account: ${deployer.address}`);
  console.log(`[Network] Active network: ${network.name} (Chain ID: ${(await ethers.provider.getNetwork()).chainId})`);

  // 1. Deploy RBAC
  const RBACFactory = await ethers.getContractFactory("CipherTrustRBAC");
  const rbac = await RBACFactory.deploy(deployer.address);
  await rbac.waitForDeployment();
  const rbacAddress = await rbac.getAddress();
  console.log(`[RBAC Deployed] CipherTrustRBAC deployed to: ${rbacAddress}`);

  // Grant ISSUER_ROLE to deployer so deployer can perform initial mints/audits if needed
  const ISSUER_ROLE = await rbac.ISSUER_ROLE();
  const grantTx = await rbac.assignRole(deployer.address, ISSUER_ROLE);
  await grantTx.wait();
  console.log(`[RBAC Setup] Granted ISSUER_ROLE to deployer: ${deployer.address}`);

  // 2. Deploy NFT
  const NFTFactory = await ethers.getContractFactory("CipherTrustNFT");
  const nft = await NFTFactory.deploy(rbacAddress, deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`[NFT Deployed] CipherTrustNFT deployed to: ${nftAddress}`);

  // 3. Deploy Audit
  const AuditFactory = await ethers.getContractFactory("CipherTrustAudit");
  const audit = await AuditFactory.deploy(rbacAddress);
  await audit.waitForDeployment();
  const auditAddress = await audit.getAddress();
  console.log(`[Audit Deployed] CipherTrustAudit deployed to: ${auditAddress}`);

  // Log initial system audit event
  const logTx = await audit.logEvent(
    ethers.id("SYSTEM_INITIALIZED"),
    deployer.address,
    `did:ethr:${(await ethers.provider.getNetwork()).chainId}:${deployer.address}`
  );
  await logTx.wait();
  console.log(`[Audit Setup] Initialized on-chain system audit event.`);

  // Write deployments artifact
  const deploymentData = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      CipherTrustRBAC: {
        address: rbacAddress,
        abi: JSON.parse(rbac.interface.formatJson()),
      },
      CipherTrustNFT: {
        address: nftAddress,
        abi: JSON.parse(nft.interface.formatJson()),
      },
      CipherTrustAudit: {
        address: auditAddress,
        abi: JSON.parse(audit.interface.formatJson()),
      },
    },
  };

  const deploymentsDir = path.resolve(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const fileName = `${network.name}.json`;
  const filePath = path.join(deploymentsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
  console.log(`[Manifest Saved] Contract deployment manifest written to: ${filePath}`);
}

main().catch((error) => {
  console.error("Error executing deployment script:", error);
  process.exitCode = 1;
});
