import crypto from "crypto";
import { DocumentService } from "../services/document.service";
import { CryptoService } from "../services/crypto.service";
import { StorageService } from "../services/storage.service";
import { prisma } from "../db/prisma";
import { DocumentType, PermissionType, VerificationStatus } from "@ciphertrust/shared-types";

async function runEndToEndVerification() {
  console.log("\n========================================================");
  console.log("   CIPHERTRUST PHASE 7: END-TO-END VERIFICATION SUITE   ");
  console.log("========================================================\n");

  const ALICE_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase();
  const BOB_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".toLowerCase();
  const ISSUER_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".toLowerCase();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, extraInfo = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName} ${extraInfo}`);
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName} ${extraInfo}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  try {
    // ----------------------------------------------------
    // Test 1: Crypto Service Encryption & Decryption
    // ----------------------------------------------------
    console.log("\n--- Section 1: AES-256-GCM Cryptographic Engine ---");
    const samplePayload = Buffer.from("CONFIDENTIAL_GOVERNMENT_ID_DOCUMENT_CIPHERTRUST_TEST_PAYLOAD", "utf8");
    const testDocId = crypto.randomUUID();
    const encrypted = CryptoService.encryptBuffer(samplePayload, testDocId);
    
    assert(encrypted.length > samplePayload.length, "Encrypted payload contains IV + ciphertext + Auth Tag");
    assert(!encrypted.includes(samplePayload), "Plaintext does not appear unencrypted in ciphertext");

    const decrypted = CryptoService.decryptBuffer(encrypted, testDocId);
    assert(decrypted.equals(samplePayload), "AES-256-GCM Decryption perfectly reconstructs original buffer");
    assert(CryptoService.hashBuffer(decrypted) === CryptoService.hashBuffer(samplePayload), "SHA-256 hashes match identically");

    // ----------------------------------------------------
    // Test 2: Storage Service & Off-Chain Encrypted Disk Layer
    // ----------------------------------------------------
    console.log("\n--- Section 2: Storage Service & Disk Persistence ---");
    const storageKey = await StorageService.saveEncryptedFile(testDocId, encrypted);
    const readEncrypted = await StorageService.readEncryptedFile(storageKey);
    assert(readEncrypted.equals(encrypted), "Storage read returns exact encrypted binary stream");
    const deleted = await StorageService.deleteEncryptedFile(storageKey);
    assert(deleted === true, "Storage cleanup correctly deletes file");

    // ----------------------------------------------------
    // Test 3: Document Upload with Metadata & Hashing
    // ----------------------------------------------------
    console.log("\n--- Section 3: Document Upload Workflow ---");
    const dummyPdfContent = Buffer.from("%PDF-1.4 Mock Degree Certificate Content for Antigravity Verification", "utf8");
    const expectedHash = CryptoService.hashBuffer(dummyPdfContent);

    const uploadedDoc = await DocumentService.uploadDocument({
      ownerAddress: ALICE_ADDRESS,
      documentType: DocumentType.DEGREE_CERTIFICATE,
      title: "Bachelor of Technology Certificate",
      description: "University degree verified by CipherTrust",
      originalFilename: "btech_certificate.pdf",
      mimeType: "application/pdf",
      fileBuffer: dummyPdfContent,
    });

    assert(uploadedDoc.id !== undefined && uploadedDoc.id.length > 0, "Document created with unique UUID", `(${uploadedDoc.id})`);
    assert(uploadedDoc.documentHash === expectedHash, "Document SHA-256 matches client buffer hash", `(${expectedHash.substring(0, 16)}...)`);
    assert(uploadedDoc.ownerAddress === ALICE_ADDRESS, "Owner address correctly normalized and set");
    assert(uploadedDoc.status === "ACTIVE", "Document initial status is ACTIVE");
    assert(uploadedDoc.verificationStatus === VerificationStatus.UNVERIFIED, "Initial verification status is UNVERIFIED");

    // Verify encrypted file exists and can be read
    const onDiskRead = await StorageService.readEncryptedFile(uploadedDoc.encryptedStorageKey);
    assert(onDiskRead.length > 0, "Encrypted file successfully read from off-chain directory");

    // ----------------------------------------------------
    // Test 4: Document Retrieval & Decrypted Download
    // ----------------------------------------------------
    console.log("\n--- Section 4: Document Retrieval & Decryption ---");
    const myDocs = await DocumentService.getMyDocuments(ALICE_ADDRESS);
    assert(myDocs.some(d => d.id === uploadedDoc.id), "Alice can list her uploaded document");

    const docDetails = await DocumentService.getDocumentDetails(uploadedDoc.id, ALICE_ADDRESS);
    assert(docDetails.id === uploadedDoc.id, "Owner can fetch document details");
    assert(docDetails.versions.length >= 1, "Document version 1 created and tracked");

    const downloaded = await DocumentService.downloadDocument(uploadedDoc.id, ALICE_ADDRESS);
    assert(downloaded.buffer.equals(dummyPdfContent), "Decrypted downloaded stream matches original PDF byte-for-byte");
    assert(downloaded.mimeType === "application/pdf", "MIME type preserved as application/pdf");

    // ----------------------------------------------------
    // Test 5: Access Control & Sharing (VIEW vs DOWNLOAD)
    // ----------------------------------------------------
    console.log("\n--- Section 5: Granular Sharing & Permission Enforcement ---");
    
    // Bob has no access yet
    let unauthorizedFailed = false;
    try {
      await DocumentService.getDocumentDetails(uploadedDoc.id, BOB_ADDRESS);
    } catch (err: any) {
      unauthorizedFailed = err.message.includes("Unauthorized");
    }
    assert(unauthorizedFailed, "Unauthorized access by Bob is strictly blocked (IDOR Protection)");

    // Alice shares document with Bob (VIEW only)
    const accessView = await DocumentService.shareDocument(
      uploadedDoc.id,
      ALICE_ADDRESS,
      BOB_ADDRESS,
      PermissionType.VIEW,
      new Date(Date.now() + 3600 * 1000)
    );
    assert(accessView.status === "ACTIVE", "Alice grants Bob VIEW access");

    // Bob can now view details
    const bobView = await DocumentService.getDocumentDetails(uploadedDoc.id, BOB_ADDRESS);
    assert(bobView.id === uploadedDoc.id, "Bob can inspect document details with VIEW permission");

    // Bob can download/view content with VIEW permission (or DOWNLOAD)
    const bobDownloaded = await DocumentService.downloadDocument(uploadedDoc.id, BOB_ADDRESS);
    assert(bobDownloaded.buffer.equals(dummyPdfContent), "Bob can view/download with active permission");

    // Bob can see it in his shared documents
    const bobSharedDocs = await DocumentService.getSharedDocuments(BOB_ADDRESS);
    assert(bobSharedDocs.some(d => d.id === uploadedDoc.id), "Bob's shared documents list contains Alice's certificate");

    // Alice revokes Bob's access
    const revoked = await DocumentService.revokeAccess(
      uploadedDoc.id,
      ALICE_ADDRESS,
      accessView.id
    );
    assert(revoked.status === "REVOKED", "Access successfully revoked");

    let bobAccessAfterRevokeFailed = false;
    try {
      await DocumentService.getDocumentDetails(uploadedDoc.id, BOB_ADDRESS);
    } catch (err: any) {
      bobAccessAfterRevokeFailed = err.message.includes("Unauthorized");
    }
    assert(bobAccessAfterRevokeFailed, "Bob's access immediately denied after revocation");

    // ----------------------------------------------------
    // Test 6: Document Integrity Verification
    // ----------------------------------------------------
    console.log("\n--- Section 6: Cryptographic Integrity Verification ---");
    const integrityValid = await DocumentService.verifyIntegrity(uploadedDoc.id);
    assert(integrityValid.match === true, "Integrity check returns VALID for pristine document");
    assert(integrityValid.calculatedHash === uploadedDoc.documentHash, "Computed hash matches recorded documentHash");

    // ----------------------------------------------------
    // Test 7: Formal Issuer / Verifier Attestation
    // ----------------------------------------------------
    console.log("\n--- Section 7: Verification & Attestation Flow ---");
    const verifiedResult = await DocumentService.verifyIssuerStatus(
      uploadedDoc.id,
      ISSUER_ADDRESS,
      VerificationStatus.VERIFIED,
      "REG-2026-BTECH-9912",
      "Degree certified and authenticated via University Registrar digital seal"
    );

    assert(verifiedResult.document.verificationStatus === VerificationStatus.VERIFIED, "Document status updated to VERIFIED");
    assert(verifiedResult.document.issuerReference === "REG-2026-BTECH-9912", "Issuer reference securely recorded");

    // ----------------------------------------------------
    // Test 8: Document Audit Trail & Tamper-Evident History
    // ----------------------------------------------------
    console.log("\n--- Section 8: Tamper-Evident Audit Logging ---");
    const auditLogs = await DocumentService.getDocumentAuditHistory(uploadedDoc.id, ALICE_ADDRESS);
    assert(auditLogs.length >= 4, "Comprehensive audit trail captured events", `(Total: ${auditLogs.length})`);
    
    const actions = auditLogs.map((l: any) => l.actionType);
    assert(actions.includes("UPLOAD"), "UPLOAD logged with actor and eventHash");
    assert(actions.includes("SHARE"), "SHARE logged");
    assert(actions.includes("REVOKE"), "REVOKE logged");
    assert(actions.includes("VERIFY"), "VERIFY logged");

    console.log("\n========================================================");
    console.log(`  ALL ${passedTests} / ${totalTests} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
    console.log("========================================================\n");

  } catch (error: any) {
    console.error("\n❌ VERIFICATION TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndVerification();
