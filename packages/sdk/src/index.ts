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
    const envUrl =
      (typeof process !== "undefined" && (process.env?.VITE_API_BASE_URL || process.env?.VITE_API_URL || process.env?.NEXT_PUBLIC_API_BASE_URL)) ||
      (typeof import.meta !== "undefined" && ((import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL));

    const rawUrl = options?.baseUrl || envUrl || "https://ciphertrust-backend.onrender.com/api";
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
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
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
}
