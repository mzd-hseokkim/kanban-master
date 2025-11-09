export interface WorkspaceMembership {
  workspaceId: number;
  workspaceName: string;
  slug: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
  status: UserStatus;
  workspaces: WorkspaceMembership[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface TokenRefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
