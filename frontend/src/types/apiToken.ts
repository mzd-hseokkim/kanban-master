import type { BoardMemberRole } from './board';

export type ApiTokenScope =
  | 'BOARD_READ'
  | 'BOARD_WRITE'
  | 'CARD_READ'
  | 'CARD_WRITE'
  | 'CARD_ARCHIVE'
  | 'CARD_MANAGE';

export interface CreateApiTokenRequest {
  name: string;
  boardId: number;
  role: BoardMemberRole;
  scopes: ApiTokenScope[];
  expiresAt?: string | null;
}

export interface CreateApiTokenResponse {
  id: number;
  token: string;
  tokenPrefix: string;
  role: BoardMemberRole;
  scopes: ApiTokenScope[];
  expiresAt?: string | null;
}

export interface ApiTokenSummaryResponse {
  id: number;
  name: string;
  boardId: number;
  tokenPrefix: string;
  role: BoardMemberRole;
  scopes: ApiTokenScope[];
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}
