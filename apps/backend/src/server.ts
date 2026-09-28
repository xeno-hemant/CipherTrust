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
import documentRoutes from "./routes/document.routes";
import adminAuthRoutes from "./routes/admin-auth.routes";
import verificationRoutes from "./routes/verification.routes";
import kycRoutes from "./routes/kyc.routes";
import { initDb } from "./db/initDb";



const app = express();

const rawAllowedOrigins = env.ALLOWED_ORIGINS || "*";
const parsedOrigins = rawAllowedOrigins === "*" ? "*" : rawAllowedOrigins.split(",").map((o) => o.trim()).filter(Boolean);

// Dynamic CORS Middleware supporting Vercel, Render, and Local Dev
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || parsedOrigins === "*") {
        return callback(null, true);
      }
      if (Array.isArray(parsedOrigins) && parsedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }
      logger.warn(`CORS request from unlisted origin: ${origin}`);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());

const apiIndexHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    name: "CipherTrust API Backend",
    version: "1.0.0",
    status: "online",
    mode: env.MOCK_MODE ? "MOCK_MODE" : "LIVE_CHAIN",
    endpoints: [
      "/health",
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

// Health Check Endpoints (available at /health and /api/health)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: "ok",
    service: "CipherTrust Backend API",
    mode: env.MOCK_MODE ? "MOCK_MODE" : "LIVE_CHAIN",
    timestamp: new Date().toISOString(),
  });
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// Register API Routes (Mounted under both /api/* and /* for full endpoint compatibility)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/did", didRoutes);
app.use("/did", didRoutes);

app.use("/api/nft", nftRoutes);
app.use("/nft", nftRoutes);

app.use("/api/roles", rolesRoutes);
app.use("/roles", rolesRoutes);

app.use("/api/audit", auditRoutes);
app.use("/audit", auditRoutes);

app.use("/api/stats", statsRoutes);
app.use("/stats", statsRoutes);

app.use("/api/documents", documentRoutes);
app.use("/documents", documentRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/admin/auth", adminAuthRoutes);

app.use("/api/verification", verificationRoutes);
app.use("/verification", verificationRoutes);

app.use("/api/kyc", kycRoutes);
app.use("/kyc", kycRoutes);


// Error Handler
app.use(errorHandler);

const port = parseInt(env.PORT, 10);

const startServer = async () => {
  await initDb().catch((err) => {
    logger.error(`Database auto-init failed: ${err.message}`);
  });

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

  return server;
};

startServer();


export default app;
