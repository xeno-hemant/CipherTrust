import { DIDDocument, NFTAsset, RoleAssignment, AuditLogEntry, Role } from "@ciphertrust/shared-types";

// In-Memory Fallback State Store (guarantees zero backend failures even if Postgres container is offline)
export class MemoryStore {
  public static users = new Set<string>([
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdD45913C54E43525531E03c981708277271",
  ]);

  public static dids: Map<string, DIDDocument> = new Map([
    [
      "did:ethr:31337:0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      {
        did: "did:ethr:31337:0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        controllerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        publicKey: "pub_0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        createdAt: new Date().toISOString(),
        verified: true,
      },
    ],
    [
      "did:ethr:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      {
        did: "did:ethr:31337:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        controllerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        publicKey: "pub_0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        createdAt: new Date().toISOString(),
        verified: true,
      },
    ],
  ]);

  public static roles: RoleAssignment[] = [
    {
      did: "did:ethr:31337:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      role: Role.ADMIN,
      assignedBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      assignedAt: new Date().toISOString(),
      active: true,
    },
    {
      did: "did:ethr:31337:0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      role: Role.ISSUER,
      assignedBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      assignedAt: new Date().toISOString(),
      active: true,
    },
  ];

  public static nfts: NFTAsset[] = [
    {
      tokenId: "1",
      contractAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      ownerDid: "did:ethr:31337:0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      metadataUri: "ipfs://QmDemoNftMetadata1",
      metadata: {
        name: "Enterprise Identity Security Pass",
        description: "Level 5 Security Access Clearance Credential issued by CipherTrust Platform.",
        image: "https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/official-artwork/150.png",
        attributes: [
          { trait_type: "Security Clearance", value: "Level 5" },
          { trait_type: "Department", value: "Cyber Security Ops" },
        ],
      },
      mintedBy: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      mintedAt: new Date().toISOString(),
    },
  ];

  public static audits: AuditLogEntry[] = [
    {
      id: "audit-1",
      eventType: "DID_CREATED",
      actorAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      targetDid: "did:ethr:31337:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      txHash: "0x4a2e8f1c9d0b3e5a7f9c2d4e6a8b0c1d3e5f7a9b2c4d6e8f0a2b4c6d8e0f1a3b",
      blockNumber: 100,
      timestamp: new Date().toISOString(),
      metadata: { note: "System Admin DID Initialized" },
    },
    {
      id: "audit-2",
      eventType: "ROLE_ASSIGNED",
      actorAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      targetDid: "did:ethr:31337:0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      txHash: "0x7b9a1c3e5f7d9b1a3c5e7f9a1b3c5e7f9a1b3c5e7f9a1b3c5e7f9a1b3c5e7f9a",
      blockNumber: 101,
      timestamp: new Date().toISOString(),
      metadata: { role: "ISSUER" },
    },
  ];
}
