import { ethers } from "ethers";
import { prisma } from "../db/prisma";
import { KycRecord, KycStatus, SubmitKycRequest, ReviewKycRequest } from "@ciphertrust/shared-types";
import { AuditService } from "./audit.service";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export class KycService {
  /**
   * Submit or update a KYC application for an applicant address
   */
  static async submitKyc(
    applicantAddress: string,
    data: SubmitKycRequest
  ): Promise<KycRecord> {
    const checksummedAddress = ethers.getAddress(applicantAddress);
    const applicantDid = `did:ethr:${env.CHAIN_ID}:${checksummedAddress}`;

    // Ensure User and DidDocument exist in DB
    try {
      await prisma.user.upsert({
        where: { address: checksummedAddress },
        update: {},
        create: { address: checksummedAddress },
      });

      await prisma.didDocument.upsert({
        where: { did: applicantDid },
        update: {},
        create: {
          did: applicantDid,
          controllerAddress: checksummedAddress,
          publicKey: ethers.hexlify(ethers.randomBytes(33)),
          verified: false,
        },
      });
    } catch (err: any) {
      logger.warn(`[KycService] Error ensuring user/did exists: ${err.message}`);
    }

    // Check for existing KYC record
    const existing = await prisma.kycApplication.findFirst({
      where: { applicantAddress: checksummedAddress },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.status === KycStatus.APPROVED) {
      return this.mapToRecord(existing);
    }

    let application;
    if (existing && (existing.status === KycStatus.PENDING || existing.status === KycStatus.REJECTED)) {
      // Update existing record
      application = await prisma.kycApplication.update({
        where: { id: existing.id },
        data: {
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth || null,
          nationality: data.nationality || null,
          idType: data.idType,
          idNumber: data.idNumber,
          documentFilename: data.documentFilename || null,
          documentData: data.documentData || null,
          selfieData: data.selfieData || null,
          phone: data.phone || null,
          email: data.email || null,
          status: KycStatus.PENDING,
          reviewedBy: null,
          reviewNotes: null,
          reviewedAt: null,
        },
      });
    } else {
      // Create new application
      application = await prisma.kycApplication.create({
        data: {
          applicantAddress: checksummedAddress,
          applicantDid,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth || null,
          nationality: data.nationality || null,
          idType: data.idType,
          idNumber: data.idNumber,
          documentFilename: data.documentFilename || null,
          documentData: data.documentData || null,
          selfieData: data.selfieData || null,
          phone: data.phone || null,
          email: data.email || null,
          status: KycStatus.PENDING,
        },
      });
    }

    // Log on-chain audit entry
    try {
      await AuditService.logOnChainAudit(
        "KYC_SUBMITTED" as any,
        checksummedAddress,
        applicantDid,
        {
          applicationId: application.id,
          idType: application.idType,
          status: KycStatus.PENDING,
          submittedAt: new Date().toISOString(),
        }
      );
    } catch (auditErr: any) {
      logger.warn(`[KycService] Audit logging skipped: ${auditErr.message}`);
    }

    return this.mapToRecord(application);
  }

  /**
   * Get current applicant's KYC status
   */
  static async getKycStatus(
    applicantAddress: string
  ): Promise<KycRecord | { status: KycStatus.NOT_SUBMITTED }> {
    const checksummedAddress = ethers.getAddress(applicantAddress);
    const application = await prisma.kycApplication.findFirst({
      where: { applicantAddress: checksummedAddress },
      orderBy: { createdAt: "desc" },
    });

    if (!application) {
      return { status: KycStatus.NOT_SUBMITTED };
    }

    return this.mapToRecord(application);
  }

  /**
   * List all KYC applications (for Admin review)
   */
  static async getKycApplications(statusFilter?: string): Promise<KycRecord[]> {
    const where: any = {};
    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    const applications = await prisma.kycApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return applications.map((app) => this.mapToRecord(app));
  }

  /**
   * Get single KYC application by ID
   */
  static async getKycApplicationById(id: string): Promise<KycRecord | null> {
    const application = await prisma.kycApplication.findUnique({
      where: { id },
    });

    if (!application) return null;
    return this.mapToRecord(application);
  }

  /**
   * Review (Approve or Reject) KYC application
   */
  static async reviewKyc(
    id: string,
    reviewerAddress: string,
    review: ReviewKycRequest
  ): Promise<KycRecord> {
    const checksummedReviewer = ethers.getAddress(reviewerAddress);

    const existing = await prisma.kycApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`KYC application not found with ID ${id}`);
    }

    const updated = await prisma.kycApplication.update({
      where: { id },
      data: {
        status: review.status,
        reviewedBy: checksummedReviewer,
        reviewNotes: review.reviewNotes || null,
        reviewedAt: new Date(),
      },
    });

    // If approved, update DID verification status to true
    if (review.status === KycStatus.APPROVED) {
      try {
        await prisma.didDocument.updateMany({
          where: { controllerAddress: existing.applicantAddress },
          data: { verified: true },
        });
      } catch (err: any) {
        logger.warn(`[KycService] Could not update DidDocument verification: ${err.message}`);
      }

      try {
        await AuditService.logOnChainAudit(
          "KYC_VERIFIED" as any,
          checksummedReviewer,
          existing.applicantDid,
          {
            applicationId: id,
            applicant: existing.applicantAddress,
            notes: review.reviewNotes,
            approvedAt: new Date().toISOString(),
          }
        );
      } catch (err: any) {
        logger.warn(`[KycService] Audit log error: ${err.message}`);
      }
    } else if (review.status === KycStatus.REJECTED) {
      try {
        await AuditService.logOnChainAudit(
          "KYC_REJECTED" as any,
          checksummedReviewer,
          existing.applicantDid,
          {
            applicationId: id,
            applicant: existing.applicantAddress,
            notes: review.reviewNotes,
            rejectedAt: new Date().toISOString(),
          }
        );
      } catch (err: any) {
        logger.warn(`[KycService] Audit log error: ${err.message}`);
      }
    }

    return this.mapToRecord(updated);
  }

  private static mapToRecord(item: any): KycRecord {
    return {
      id: item.id,
      applicantAddress: item.applicantAddress,
      applicantDid: item.applicantDid,
      fullName: item.fullName,
      dateOfBirth: item.dateOfBirth,
      nationality: item.nationality,
      idType: item.idType,
      idNumber: item.idNumber,
      documentFilename: item.documentFilename,
      documentData: item.documentData,
      selfieData: item.selfieData,
      phone: item.phone,
      email: item.email,
      status: item.status as KycStatus,
      reviewedBy: item.reviewedBy,
      reviewNotes: item.reviewNotes,
      reviewedAt: item.reviewedAt ? new Date(item.reviewedAt).toISOString() : null,
      createdAt: new Date(item.createdAt).toISOString(),
      updatedAt: new Date(item.updatedAt).toISOString(),
    };
  }
}
