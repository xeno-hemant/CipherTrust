import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { ChainListener } from "./listeners/chainListener";

// Routes
import authRoutes from "./routes/auth.routes";
import didRoutes from "./routes/did.routes";
import nftRoutes from "./routes/nft.routes";
import rolesRoutes from "./routes/roles.routes";
import auditRoutes from "./routes/audit.routes";
import statsRoutes from "./routes/stats.routes";

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const apiIndexHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    name: "CipherTrust API Backend",
    version: "1.0.0",
    status: "online",
    mode: env.MOCK_MODE ? "MOCK_MODE" : "LIVE_CHAIN",
    endpoints: [
      "/api/health",
      "/api/auth/nonce",
      "/api/auth/verify",
      "/api/did/create",
      "/api/did/:address",
      "/api/nft/mint",
      "/api/nft/inventory/:did",
      "/api/roles/assign",
      "/api/roles/revoke",
      "/api/roles/:did",
      "/api/audit",
      "/api/stats",
    ],
  });
};

// Root & API Base Index
app.get("/", apiIndexHandler);
app.get("/api", apiIndexHandler);
app.get("/api/", apiIndexHandler);

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CipherTrust Backend API",
    mode: env.MOCK_MODE ? "MOCK_MODE" : "LIVE_CHAIN",
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/did", didRoutes);
app.use("/api/nft", nftRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/stats", statsRoutes);

// Error Handler
app.use(errorHandler);

const port = parseInt(env.PORT, 10);

const server = app.listen(port, () => {
  logger.info(`CipherTrust Backend API running on port ${port} [Mode: ${env.MOCK_MODE ? "MOCK_MODE" : "LIVE_CHAIN"}]`);

  try {
    const listener = new ChainListener();
    listener.start().catch((err) => {
      logger.warn("Chain listener in standby mode:", err.message || err);
    });
  } catch (e) {
    // Standby
  }
});

export default app;
