export interface Account {
  id: string;
  publicKey: string;
  wallet: string;
  blockchain: string;
  username?: string;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  account: Account;
}

export interface AuthState {
  account: Account | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignMessageRequest {
  nonce: string;
  onSuccess: (signature: string) => void;
  onError: (error: Error) => void;
}