import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Seeding database with demo CipherTrust data...");

  // Addresses
  const adminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat Account #0
  const issuerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat Account #1
  const holder1Address = "0x3C44CdD45913C54E43525531E03c981708277271";
  const holder2Address = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

  const chainId = 31337;
  const adminDid = `did:ethr:${chainId}:${adminAddress}`;
  const issuerDid = `did:ethr:${chainId}:${issuerAddress}`;
  const holder1Did = `did:ethr:${chainId}:${holder1Address}`;
  const holder2Did = `did:ethr:${chainId}:${holder2Address}`;

  // 1. Create Users
  for (const addr of [adminAddress, issuerAddress, holder1Address, holder2Address]) {
    await prisma.user.upsert({
      where: { address: addr },
      update: {},
      create: { address: addr },
    });
  }

  // 2. Create DID Documents
  const dids = [
    { did: adminDid, controllerAddress: adminAddress, publicKey: `pub_${adminAddress}` },
    { did: issuerDid, controllerAddress: issuerAddress, publicKey: `pub_${issuerAddress}` },
    { did: holder1Did, controllerAddress: holder1Address, publicKey: `pub_${holder1Address}` },
    { did: holder2Did, controllerAddress: holder2Address, publicKey: `pub_${holder2Address}` },
  ];

  for (const doc of dids) {
    await prisma.didDocument.upsert({
      where: { did: doc.did },
      update: {},
      create: {
        did: doc.did,
        controllerAddress: doc.controllerAddress,
        publicKey: doc.publicKey,
        verified: true,
      },
    });
  }

  // 3. Assign Roles
  await prisma.roleAssignment.createMany({
    data: [
      { did: adminDid, role: Role.ADMIN, assignedBy: adminAddress, active: true },
      { did: issuerDid, role: Role.ISSUER, assignedBy: adminAddress, active: true },
      { did: holder1Did, role: Role.HOLDER, assignedBy: adminAddress, active: true },
      { did: holder2Did, role: Role.HOLDER, assignedBy: adminAddress, active: true },
    ],
    skipDuplicates: true,
  });

  // 4. Create Demo NFTs
  const dummyContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  await prisma.nftAsset.upsert({
    where: {
      tokenId_contractAddress: {
        tokenId: "1",
        contractAddress: dummyContractAddress,
      },
    },
    update: {},
    create: {
      tokenId: "1",
      contractAddress: dummyContractAddress,
      ownerDid: holder1Did,
      metadataUri: "ipfs://QmDemoNftMetadata1",
      metadataJson: {
        name: "Enterprise Identity Security Pass",
        description: "Level 4 Access Clearance Credential for CipherTrust Platform",
        image: "https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/official-artwork/150.png",
        attributes: [
          { trait_type: "Security Clearance", value: "Level 4" },
          { trait_type: "Issuer Verification", value: "Verified" },
          { trait_type: "Department", value: "Cyber Security Ops" }
        ],
      },
      mintedBy: issuerAddress,
    },
  });

  await prisma.nftAsset.upsert({
    where: {
      tokenId_contractAddress: {
        tokenId: "2",
        contractAddress: dummyContractAddress,
      },
    },
    update: {},
    create: {
      tokenId: "2",
      contractAddress: dummyContractAddress,
      ownerDid: holder2Did,
      metadataUri: "ipfs://QmDemoNftMetadata2",
      metadataJson: {
        name: "Verified Auditor Credential",
        description: "On-Chain Audit Log Inspector Credential",
        image: "https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/official-artwork/249.png",
        attributes: [
          { trait_type: "Security Clearance", value: "Auditor" },
          { trait_type: "Issuer Verification", value: "Verified" }
        ],
      },
      mintedBy: issuerAddress,
    },
  });

  // 5. Create Demo Audit Log Entries
  await prisma.auditLogEntry.createMany({
    data: [
      {
        eventType: "DID_CREATED",
        actorAddress: adminAddress,
        targetDid: adminDid,
        txHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
        blockNumber: 100,
        logIndex: 0,
        metadataJson: { note: "Admin DID Created" },
      },
      {
        eventType: "ROLE_ASSIGNED",
        actorAddress: adminAddress,
        targetDid: issuerDid,
        txHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        blockNumber: 101,
        logIndex: 0,
        metadataJson: { role: "ISSUER" },
      },
      {
        eventType: "NFT_MINTED",
        actorAddress: issuerAddress,
        targetDid: holder1Did,
        txHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
        blockNumber: 102,
        logIndex: 0,
        metadataJson: { tokenId: "1", uri: "ipfs://QmDemoNftMetadata1" },
      },
    ],
    skipDuplicates: true,
  });

  console.log("[Seed Finished] Database successfully populated with initial seed records.");
}

main()
  .catch((e) => {
    console.error("Error during database seed execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
