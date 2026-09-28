import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import app from "../server";
import { env } from "../config/env";
import { Role } from "@ciphertrust/shared-types";
import { ethers } from "ethers";

async function testHttpEndpoints() {
  console.log("\n========================================================");
  console.log("   CIPHERTRUST PHASE 7: HTTP API INTEGRATION TESTS      ");
  console.log("========================================================\n");

  const port = 4015;
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(port, () => resolve()));
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, extra = "") {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] Test ${total}: ${testName} ${extra}`);
    } else {
      console.error(`  [FAIL] Test ${total}: ${testName} ${extra}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  try {
    // 1. Health check
    console.log("--- Section 1: Health & Index Endpoints ---");
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json() as any;
    assert(healthRes.status === 200, "GET /health returns 200 OK");
    assert(healthData.status === "ok", "GET /health status is 'ok'");

    // 2. Mock SIWE user token
    const testWallet = ethers.Wallet.createRandom();
    const testAddress = testWallet.address.toLowerCase();
    const userSession = {
      address: testAddress,
      did: `did:ethr:${env.CHAIN_ID}:${testAddress}`,
      roles: [Role.HOLDER],
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    const userToken = jwt.sign(userSession, env.JWT_SECRET, { expiresIn: "24h" });

    // 3. Verification OTP endpoints
    console.log("\n--- Section 2: Verification OTP Endpoints ---");
    const sendOtpRes = await fetch(`${baseUrl}/api/verification/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        documentType: "AADHAAR",
        identifier: "9876543210",
        verificationType: "phone",
      }),
    });
    const otpData = await sendOtpRes.json() as any;
    assert(sendOtpRes.status === 200, "POST /api/verification/send-otp returns 200 OK");
    assert(otpData.success === true, "OTP generated successfully");
    assert(otpData._devOtp !== undefined, "Development OTP returned", `(OTP: ${otpData._devOtp})`);

    // Verify OTP
    const verifyOtpRes = await fetch(`${baseUrl}/api/verification/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        sessionId: otpData.sessionId,
        otp: otpData._devOtp,
      }),
    });
    const verifyOtpData = await verifyOtpRes.json() as any;
    assert(verifyOtpRes.status === 200, "POST /api/verification/verify-otp returns 200 OK");
    assert(verifyOtpData.verified === true, "OTP correctly verified");
    assert(verifyOtpData.verificationToken !== undefined, "JWT verification token issued");

    // 4. Admin Auth
    console.log("\n--- Section 3: Admin Auth Route ---");
    const adminWalletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const verifyWalletRes = await fetch(`${baseUrl}/api/admin/auth/verify-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: adminWalletAddress }),
    });
    const walletData = await verifyWalletRes.json() as any;
    assert(verifyWalletRes.status === 200, "POST /api/admin/auth/verify-wallet returns 200");
    assert(walletData.authorized === true, "Admin wallet recognized and challenge issued");

    // 5. Document List (empty or existing for new wallet)
    console.log("\n--- Section 4: Document HTTP Endpoints ---");
    const myDocsRes = await fetch(`${baseUrl}/api/documents/my`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(myDocsRes.status === 200, "GET /api/documents/my returns 200 OK");
    const myDocs = await myDocsRes.json() as any;
    assert(Array.isArray(myDocs), "Response is an array of documents");

    // Shared docs endpoint
    const sharedDocsRes = await fetch(`${baseUrl}/api/documents/shared`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(sharedDocsRes.status === 200, "GET /api/documents/shared returns 200 OK");

    console.log("\n========================================================");
    console.log(`  ALL ${passed} / ${total} HTTP API INTEGRATION TESTS PASSED!`);
    console.log("========================================================\n");
  } catch (err) {
    console.error("HTTP Test Error:", err);
    process.exit(1);
  } finally {
    server.close();
  }
}

testHttpEndpoints();
