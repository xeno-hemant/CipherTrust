import dotenv from "dotenv";
import path from "path";

// Attempt loading from root monorepo directory or current working directory
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const defaultDbUrl = "file:./dev.db";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultDbUrl;
}

export const env = {
  PORT: process.env.PORT || "4005",
  NODE_ENV: process.env.NODE_ENV || "development",
  MOCK_MODE: process.env.MOCK_MODE === "true" || true,
  ON_CHAIN_DID_ANCHOR: process.env.ON_CHAIN_DID_ANCHOR === "true" || true,
  JWT_SECRET: process.env.JWT_SECRET || "ciphertrust_super_secret_jwt_key_2026",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || "*",
  DATABASE_URL: process.env.DATABASE_URL || defaultDbUrl,
  RPC_URL: process.env.RPC_URL || "http://127.0.0.1:8555",
  CHAIN_ID: parseInt(process.env.CHAIN_ID || "31337", 10),
  PRIVATE_KEY: process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  PINATA_JWT: process.env.PINATA_JWT || "",
  IPFS_GATEWAY: process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/",
  LOCAL_IPFS_URL: process.env.LOCAL_IPFS_URL || "http://127.0.0.1:5002",
};
