import {
  AuthResponse,
  AuthSession,
  AuditLogEntry,
  AuditQueryFilter,
  DIDDocument,
  MintNftRequest,
  TransferNftRequest,
  NFTAsset,
  NonceResponse,
  PaginatedResponse,
  Role,
  RoleAssignment,
  SystemStats,
  DocumentRecord,
  DocumentAccessRecord,
  DocumentAuditEventRecord,
  DocumentVerificationRecord,
  ShareDocumentRequest,
  VerifyIssuerRequest,
  KycStatus,
  KycRecord,
  SubmitKycRequest,
  ReviewKycRequest,
} from "@ciphertrust/shared-types";

export * from "@ciphertrust/shared-types";


export interface CipherTrustClientOptions {
  baseUrl?: string;
  authToken?: string;
}

export class CipherTrustClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(options?: CipherTrustClientOptions) {
    const envUrl =
      (typeof process !== "undefined" && (process.env?.VITE_API_BASE_URL || process.env?.VITE_API_URL || process.env?.NEXT_PUBLIC_API_BASE_URL)) ||
      (typeof import.meta !== "undefined" && ((import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL));

    const isLocal =
      (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) ||
      (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV);

    const rawUrl = options?.baseUrl || envUrl || (isLocal ? "http://localhost:4005/api" : "https://ciphertrust-backend.onrender.com/api");
    this.baseUrl = rawUrl.replace(/\/+$/, "");
    this.authToken = options?.authToken;
  }

  public setAuthToken(token: string) {
    this.authToken = token;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error(`[CipherTrust API Error] ${options.method || "GET"} ${url} failed [Status ${res.status}]`, data);
        throw new Error(data.error?.message || data.error || `HTTP request failed with status ${res.status}`);
      }

      return data as T;
    } catch (err: any) {
      console.error(`[CipherTrust API Network Error] ${options.method || "GET"} ${url} - ${err.message || err}`);
      throw err;
    }
  }

  // Health Check Method
  public async getHealth(): Promise<{ status: string; service?: string; mode?: string; timestamp?: string }> {
    return this.request<{ status: string; service?: string; mode?: string; timestamp?: string }>("/health");
  }

  // Auth Methods
  public async getNonce(address: string): Promise<NonceResponse> {
    return this.request<NonceResponse>("/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  }

  public async verifySiwe(message: string, signature: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ message, signature }),
    });
    this.authToken = res.token;
    return res;
  }

  // DID Methods
  public async createDid(address?: string): Promise<DIDDocument> {
    return this.request<DIDDocument>("/did/create", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  }

  public async getDid(didOrAddress: string): Promise<DIDDocument> {
    return this.request<DIDDocument>(`/did/${encodeURIComponent(didOrAddress)}`);
  }

  // NFT Methods
  public async mintNft(params: MintNftRequest): Promise<NFTAsset> {
    return this.request<NFTAsset>("/nft/mint", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  public async transferNft(params: TransferNftRequest): Promise<NFTAsset> {
    return this.request<NFTAsset>("/nft/transfer", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  public async getInventory(didOrAddress: string): Promise<NFTAsset[]> {
    return this.request<NFTAsset[]>(`/nft/inventory/${encodeURIComponent(didOrAddress)}`);
  }

  // Role Methods
  public async assignRole(did: string, role: Role): Promise<RoleAssignment> {
    return this.request<RoleAssignment>("/roles/assign", {
      method: "POST",
      body: JSON.stringify({ did, role }),
    });
  }

  public async revokeRole(did: string, role: Role): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/roles/revoke", {
      method: "POST",
      body: JSON.stringify({ did, role }),
    });
  }

  public async getRoles(didOrAddress: string): Promise<RoleAssignment[]> {
    return this.request<RoleAssignment[]>(`/roles/${encodeURIComponent(didOrAddress)}`);
  }

  // Audit Methods
  public async getAuditLogs(filter: AuditQueryFilter = {}): Promise<PaginatedResponse<AuditLogEntry>> {
    const params = new URLSearchParams();
    if (filter.eventType) params.append("eventType", filter.eventType);
    if (filter.actor) params.append("actor", filter.actor);
    if (filter.targetDid) params.append("targetDid", filter.targetDid);
    if (filter.page) params.append("page", filter.page.toString());
    if (filter.limit) params.append("limit", filter.limit.toString());

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<PaginatedResponse<AuditLogEntry>>(`/audit${queryString}`);
  }

  // Stats Methods
  public async getStats(): Promise<SystemStats> {
    return this.request<SystemStats>("/stats");
  }

  // Document Management Methods
  public async uploadDocument(formData: FormData): Promise<DocumentRecord> {
    return this.request<DocumentRecord>("/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  public async getMyDocuments(): Promise<DocumentRecord[]> {
    return this.request<DocumentRecord[]>("/documents/my");
  }

  public async getSharedDocuments(): Promise<DocumentRecord[]> {
    return this.request<DocumentRecord[]>("/documents/shared");
  }

  public async getDocumentDetails(id: string): Promise<DocumentRecord> {
    return this.request<DocumentRecord>(`/documents/${encodeURIComponent(id)}`);
  }

  public async downloadDocument(id: string): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const res = await fetch(`${this.baseUrl}/documents/${encodeURIComponent(id)}/download`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      throw new Error(`Download failed with status ${res.status}`);
    }

    return res.blob();
  }

  public async shareDocument(id: string, params: ShareDocumentRequest): Promise<DocumentAccessRecord> {
    return this.request<DocumentAccessRecord>(`/documents/${encodeURIComponent(id)}/share`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  public async revokeDocumentAccess(id: string, accessId: string): Promise<DocumentAccessRecord> {
    return this.request<DocumentAccessRecord>(`/documents/${encodeURIComponent(id)}/revoke`, {
      method: "POST",
      body: JSON.stringify({ accessId }),
    });
  }

  public async verifyDocumentIntegrity(id: string): Promise<{ match: boolean; storedHash: string; calculatedHash: string; verificationStatus: string; verifiedAt: string }> {
    return this.request<{ match: boolean; storedHash: string; calculatedHash: string; verificationStatus: string; verifiedAt: string }>(
      `/documents/${encodeURIComponent(id)}/verify-integrity`
    );
  }

  public async verifyDocumentIssuer(
    id: string,
    params: VerifyIssuerRequest
  ): Promise<{ document: DocumentRecord; verification: DocumentVerificationRecord }> {
    return this.request<{ document: DocumentRecord; verification: DocumentVerificationRecord }>(
      `/documents/${encodeURIComponent(id)}/verify-issuer`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  public async getDocumentAuditHistory(id: string): Promise<DocumentAuditEventRecord[]> {
    return this.request<DocumentAuditEventRecord[]>(`/documents/${encodeURIComponent(id)}/audit-history`);
  }

  public async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/documents/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // KYC Methods
  public async submitKyc(data: SubmitKycRequest): Promise<KycRecord> {
    return this.request<KycRecord>("/kyc/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async getKycStatus(): Promise<KycRecord | { status: KycStatus.NOT_SUBMITTED }> {
    return this.request<KycRecord | { status: KycStatus.NOT_SUBMITTED }>("/kyc/status");
  }

  public async getKycApplications(status?: string): Promise<KycRecord[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<KycRecord[]>(`/kyc/applications${query}`);
  }

  public async getKycApplication(id: string): Promise<KycRecord> {
    return this.request<KycRecord>(`/kyc/applications/${encodeURIComponent(id)}`);
  }

  public async reviewKyc(id: string, review: ReviewKycRequest): Promise<KycRecord> {
    return this.request<KycRecord>(`/kyc/applications/${encodeURIComponent(id)}/review`, {
      method: "POST",
      body: JSON.stringify(review),
    });
  }
}

