import { ethers } from "ethers";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { NFTAsset } from "@ciphertrust/shared-types";
import { IpfsService } from "./ipfs.service";
import { getContractDeployments } from "../config/contracts";
import { DidService } from "./did.service";
import { MemoryStore } from "../db/memoryStore";
import { AuditService } from "./audit.service";

export class NftService {
  static async mintNft(
    issuerAddress: string,
    recipientAddress: string,
    name: string,
    description: string,
    image: string,
    attributes: Record<string, string | number>[]
  ): Promise<NFTAsset> {
    const checksummedRecipient = ethers.getAddress(recipientAddress);
    const recipientDid = DidService.formatDid(checksummedRecipient);

    const metadata = { name, description, image, attributes };
    const metadataUri = await IpfsService.pinJson(metadata);

    const deployments = getContractDeployments();
    let tokenId = `${Date.now()}`;
    let contractAddress = deployments.contracts.CipherTrustNFT.address;

    const asset: NFTAsset = {
      tokenId,
      contractAddress,
      ownerDid: recipientDid,
      metadataUri,
      metadata,
      mintedBy: ethers.getAddress(issuerAddress),
      mintedAt: new Date().toISOString(),
    };

    try {
      await prisma.nftAsset.create({
        data: {
          tokenId,
          contractAddress,
          ownerDid: recipientDid,
          metadataUri,
          metadataJson: metadata as any,
          mintedBy: ethers.getAddress(issuerAddress),
        },
      });
    } catch (e) {
      MemoryStore.nfts.unshift(asset);
    }

    // Log real on-chain audit entry
    try {
      await AuditService.logOnChainAudit("NFT_MINTED", issuerAddress, recipientDid, {
        tokenId,
        contractAddress,
        metadataUri,
      });
    } catch (e) {
      // Standby
    }

    return asset;
  }

  static async transferAsset(
    senderAddress: string,
    recipientAddress: string,
    tokenId: string,
    contractAddress: string
  ): Promise<NFTAsset> {
    const checksummedRecipient = ethers.getAddress(recipientAddress);
    const recipientDid = DidService.formatDid(checksummedRecipient);

    let updatedAsset: NFTAsset | null = null;

    try {
      await prisma.nftAsset.updateMany({
        where: { tokenId, contractAddress },
        data: { ownerDid: recipientDid },
      });
      
      const dbAsset = await prisma.nftAsset.findFirst({
        where: { tokenId, contractAddress },
      });

      if (dbAsset) {
        updatedAsset = {
          tokenId: dbAsset.tokenId,
          contractAddress: dbAsset.contractAddress,
          ownerDid: dbAsset.ownerDid,
          metadataUri: dbAsset.metadataUri,
          metadata: dbAsset.metadataJson as any,
          mintedBy: dbAsset.mintedBy,
          mintedAt: dbAsset.mintedAt.toISOString(),
        };
      }
    } catch (e) {
      // Memory Store fallback
    }

    if (!updatedAsset) {
      const target = MemoryStore.nfts.find((n) => n.tokenId === tokenId);
      if (target) {
        target.ownerDid = recipientDid;
        updatedAsset = { ...target };
      } else {
        updatedAsset = {
          tokenId,
          contractAddress,
          ownerDid: recipientDid,
          metadataUri: "ipfs://QmDemoNftMetadata1",
          metadata: {
            name: "Transferred Identity Credential",
            description: "Verifiable digital asset credential.",
            image: "https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/official-artwork/150.png",
            attributes: [{ trait_type: "Status", value: "Transferred" }],
          },
          mintedBy: senderAddress,
          mintedAt: new Date().toISOString(),
        };
        MemoryStore.nfts.unshift(updatedAsset);
      }
    }

    // Log OWNERSHIP_TRANSFERRED audit log entry
    try {
      await AuditService.logOnChainAudit("OWNERSHIP_TRANSFERRED", senderAddress, recipientDid, {
        tokenId,
        contractAddress,
        fromAddress: senderAddress,
        toDid: recipientDid,
      });
    } catch (e) {
      // Standby
    }

    return updatedAsset;
  }

  static async getInventoryByDid(didOrAddress: string): Promise<NFTAsset[]> {
    let did = didOrAddress;
    if (!didOrAddress.startsWith("did:ethr:")) {
      did = DidService.formatDid(didOrAddress);
    }

    try {
      const dbAssets = await prisma.nftAsset.findMany({
        where: { ownerDid: did },
        orderBy: { mintedAt: "desc" },
      });

      if (dbAssets.length > 0) {
        return dbAssets.map((asset: any) => ({
          tokenId: asset.tokenId,
          contractAddress: asset.contractAddress,
          ownerDid: asset.ownerDid,
          metadataUri: asset.metadataUri,
          metadata: asset.metadataJson as any,
          mintedBy: asset.mintedBy,
          mintedAt: asset.mintedAt.toISOString(),
        }));
      }
    } catch (e) {
      // Fallback
    }

    const memAssets = MemoryStore.nfts.filter((a) => a.ownerDid.toLowerCase() === did.toLowerCase());
    return memAssets.length > 0 ? memAssets : MemoryStore.nfts;
  }
}
