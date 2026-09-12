import fs from "fs";
import path from "path";
import { env } from "./env";

export interface ContractInfo {
  address: string;
  abi: any[];
}

export interface ContractDeployment {
  network: string;
  chainId: number;
  deployedAt: string;
  contracts: {
    CipherTrustRBAC: ContractInfo;
    CipherTrustNFT: ContractInfo;
    CipherTrustAudit: ContractInfo;
  };
}

let deploymentCache: ContractDeployment | null = null;

export function getContractDeployments(): ContractDeployment {
  if (deploymentCache) return deploymentCache;

  const deploymentPath = path.resolve(__dirname, "../../../packages/contracts/deployments/localhost.json");
  
  if (fs.existsSync(deploymentPath)) {
    try {
      const content = fs.readFileSync(deploymentPath, "utf-8");
      deploymentCache = JSON.parse(content);
      return deploymentCache!;
    } catch (err) {
      console.warn(`[Config] Error reading contract deployment file at ${deploymentPath}, falling back to defaults.`);
    }
  }

  // Fallback defaults for bootstrap prior to compile/deploy
  return {
    network: "localhost",
    chainId: env.CHAIN_ID,
    deployedAt: new Date().toISOString(),
    contracts: {
      CipherTrustRBAC: {
        address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        abi: [],
      },
      CipherTrustNFT: {
        address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        abi: [],
      },
      CipherTrustAudit: {
        address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        abi: [],
      },
    },
  };
}
