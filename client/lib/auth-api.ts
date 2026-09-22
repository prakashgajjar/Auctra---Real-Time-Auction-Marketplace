const BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api/v1/auth';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'MODERATOR';
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
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
        message: err.message || 'Failed to connect to authentication server. Ensure Auth Service is running on port 3001.',
      },
    };
  }
}

export const authApi = {
  async register(body: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: 'BUYER' | 'SELLER';
  }) {
    return request<{ user: User; message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async verifyEmail(body: { email: string; otp: string }) {
    return request<{ user: User; tokens: AuthTokens; message: string }>('/verify-email', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async resendOtp(email: string) {
    return request<{ message: string }>('/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async login(body: { identifier: string; password: string }) {
    return request<{ user: User; tokens: AuthTokens }>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(body: { email: string; otp: string; newPassword: string }) {
    return request<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async logout(accessToken: string, refreshToken?: string) {
    return request<{ message: string }>('/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
  },

  async getProfile(accessToken: string) {
    return request<{ user: User }>('/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};

// Storage Helpers
export function storeAuthData(tokens: AuthTokens, user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auctra_access_token', tokens.accessToken);
  localStorage.setItem('auctra_refresh_token', tokens.refreshToken);
  localStorage.setItem('auctra_user', JSON.stringify(user));
}

export function getStoredAuthData(): { token: string | null; refreshToken: string | null; user: User | null } {
  if (typeof window === 'undefined') return { token: null, refreshToken: null, user: null };
  const token = localStorage.getItem('auctra_access_token');
  const refreshToken = localStorage.getItem('auctra_refresh_token');
  const userJson = localStorage.getItem('auctra_user');
  let user: User | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      user = null;
    }
  }
  return { token, refreshToken, user };
}

export function clearAuthData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auctra_access_token');
  localStorage.removeItem('auctra_refresh_token');
  localStorage.removeItem('auctra_user');
}
