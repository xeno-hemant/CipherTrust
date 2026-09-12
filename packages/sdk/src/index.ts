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
} from "@ciphertrust/shared-types";

export interface CipherTrustClientOptions {
  baseUrl?: string;
  authToken?: string;
}

export class CipherTrustClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(options?: CipherTrustClientOptions) {
    this.baseUrl = options?.baseUrl || "http://localhost:4005/api";
    this.authToken = options?.authToken;
  }

  public setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || data.error || `HTTP request failed with status ${res.status}`);
    }

    return data as T;
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
}
