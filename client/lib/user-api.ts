const BASE_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:3002/api/v1';

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  streetLine1: string;
  streetLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeDescription?: string | null;
  businessType: 'INDIVIDUAL' | 'REGISTERED_BUSINESS';
  taxId?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string | null;
  ratingAverage: number | string;
  ratingCount: number;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'MODERATOR';
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  addresses: Address[];
  sellerProfile?: SellerProfile | null;
}

export interface UserAuditLog {
  _id: string;
  userId: string;
  performedBy: string;
  action: string;
  details: any;
  ipAddress?: string | null;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

async function request<T>(
  endpoint: string,
  token?: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to connect to User Service on port 3002.',
      },
    };
  }
}

// User Profile APIs
export const userApi = {
  async getMe(token: string) {
    return request<{ user: UserProfile }>('/users/me', token);
  },

  async updateMe(
    token: string,
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      avatarUrl?: string | null;
      bio?: string | null;
    }
  ) {
    return request<{ user: UserProfile }>('/users/me', token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async getPublicProfile(idOrUsername: string) {
    return request<{ user: any }>(`/users/profile/${idOrUsername}`);
  },
};

// Address Book APIs
export const addressApi = {
  async list(token: string) {
    return request<{ addresses: Address[] }>('/users/me/addresses', token);
  },

  async create(
    token: string,
    body: {
      fullName: string;
      phone: string;
      streetLine1: string;
      streetLine2?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      isDefault?: boolean;
    }
  ) {
    return request<{ address: Address }>('/users/me/addresses', token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async update(token: string, addressId: string, body: Partial<Address>) {
    return request<{ address: Address }>(`/users/me/addresses/${addressId}`, token, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async delete(token: string, addressId: string) {
    return request<{ message: string }>(`/users/me/addresses/${addressId}`, token, {
      method: 'DELETE',
    });
  },

  async setDefault(token: string, addressId: string) {
    return request<{ address: Address }>(`/users/me/addresses/${addressId}/default`, token, {
      method: 'PATCH',
    });
  },
};

// Seller APIs
export const sellerApi = {
  async apply(
    token: string,
    body: {
      storeName: string;
      storeDescription?: string | null;
      businessType?: 'INDIVIDUAL' | 'REGISTERED_BUSINESS';
      taxId: string;
      bankAccountNumber: string;
      bankIfsc: string;
    }
  ) {
    return request<{ profile: SellerProfile }>('/sellers/apply', token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getProfile(token: string) {
    return request<{ profile: SellerProfile }>('/sellers/profile', token);
  },

  async updateProfile(
    token: string,
    body: {
      storeDescription?: string | null;
      businessType?: 'INDIVIDUAL' | 'REGISTERED_BUSINESS';
    }
  ) {
    return request<{ profile: SellerProfile }>('/sellers/profile', token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async getPublicStore(storeName: string) {
    return request<{ store: any }>(`/sellers/store/${storeName}`);
  },
};

// Admin APIs
export const adminApi = {
  async listUsers(
    token: string,
    params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }
  ) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/admin/users${queryString}`, token);
  },

  async getUserDetails(token: string, userId: string) {
    return request<{ user: UserProfile; auditLogs: UserAuditLog[] }>(
      `/admin/users/${userId}`,
      token
    );
  },

  async updateUserStatus(token: string, userId: string, status: string, reason: string) {
    return request<{ user: any }>(`/admin/users/${userId}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  async updateUserRole(token: string, userId: string, role: string, reason: string) {
    return request<{ user: any }>(`/admin/users/${userId}/role`, token, {
      method: 'PATCH',
      body: JSON.stringify({ role, reason }),
    });
  },

  async listSellerApplications(token: string, status = 'PENDING') {
    return request<any[]>(`/admin/seller-applications?status=${status}`, token);
  },

  async reviewSellerApplication(
    token: string,
    profileId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ) {
    return request<{ profile: SellerProfile }>(
      `/admin/seller-applications/${profileId}/review`,
      token,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      }
    );
  },
};
