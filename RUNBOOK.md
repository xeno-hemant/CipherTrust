# CipherTrust Platform Runbook & Execution Guide (Alternative Ports)

This document provides step-by-step instructions to boot, deploy, seed, and demonstrate the CipherTrust platform locally using non-conflicting alternative ports.

---

## Alternative Port Map
- **Web Portal**: [http://localhost:3005](http://localhost:3005) *(originally 3000)*
- **Admin Console**: [http://localhost:3006](http://localhost:3006) *(originally 3001)*
- **Backend API**: [http://localhost:4005/api](http://localhost:4005/api) *(originally 4000)*
- **Local Hardhat RPC**: [http://localhost:8555](http://localhost:8555) *(originally 8545)*
- **PostgreSQL Database**: [localhost:5433](localhost:5433) *(originally 5432)*
- **Local IPFS Gateway**: [http://localhost:8082](http://localhost:8082) *(originally 8080)* / API `5002`

---

## 1. Quick Start with Docker Compose (Recommended)

Run the entire system stack with non-conflicting host ports:

```bash
docker-compose -f infra/docker-compose.yml up --build
```

Access points:
- **Web Portal**: [http://localhost:3005](http://localhost:3005)
- **Admin Console**: [http://localhost:3006](http://localhost:3006)
- **Backend API**: [http://localhost:4005/api](http://localhost:4005/api)
- **Local Hardhat RPC**: [http://localhost:8555](http://localhost:8555)
- **Local IPFS Gateway**: [http://localhost:8082](http://localhost:8082)

---

## 2. Local Manual Development Workflow

### Step 1: Start Hardhat Node on Alternative Port 8555
```bash
cd packages/contracts
npm run node -- --port 8555
```

### Step 2: Deploy Smart Contracts
```bash
cd packages/contracts
npm run deploy:local
```

### Step 3: Run Database Migrations & Seed Data
```bash
cd apps/backend
npm run db:push
npm run db:seed
```

### Step 4: Start Backend API (Port 4005)
```bash
cd apps/backend
npm run dev
```

### Step 5: Start Frontends (Ports 3005 & 3006)
```bash
# Terminal A: Web Portal (Port 3005)
cd apps/web-portal
npm run dev

# Terminal B: Admin Console (Port 3006)
cd apps/admin-console
npm run dev
```

---

## 3. End-to-End Demo Flow

1. Open **Admin Console** at [http://localhost:3006](http://localhost:3006). Click **Login as Admin**.
2. Go to **Role Management** tab and assign `ISSUER` role to target address `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.
3. Go to **Issue Verifiable Asset** tab and mint an asset to recipient `0x3C44CdD45913C54E43525531E03c981708277271`.
4. Open **Web Portal** at [http://localhost:3005](http://localhost:3005). Log in to view your W3C DID Document and Digital Asset Inventory.
5. In **Admin Console**, view live updating on-chain events in **Audit Log & History**.
