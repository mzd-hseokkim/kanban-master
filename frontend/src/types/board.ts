export type BoardStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type BoardMemberRole = 'VIEWER' | 'EDITOR' | 'MANAGER';

export interface Board {
  id: number;
  workspaceId: number;
  ownerId: number;
  ownerName: string;
  name: string;
  description?: string | null;
  themeColor?: string | null;
  icon?: string | null;
  status: BoardStatus;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** 현재 사용자의 초대 상태 (null이면 owner) */
  invitationStatus?: InvitationStatus | null;
  /** 현재 사용자의 초대 토큰 (초대 대기 중일 때만) */
  invitationToken?: string | null;
  /** 현재 사용자의 보드 내 역할 (VIEWER, EDITOR, MANAGER) */
  currentUserRole?: BoardMemberRole;
  /** 현재 사용자가 편집 권한이 있는지 (EDITOR 이상) */
  canEdit?: boolean;
  /** 현재 사용자가 관리 권한이 있는지 (MANAGER 또는 Owner) */
  canManage?: boolean;
  /** 보드 모드 (KANBAN | SPRINT) */
  mode?: 'KANBAN' | 'SPRINT';
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  themeColor?: string;
  icon?: string;
  templateId?: number;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  themeColor?: string;
  icon?: string;
}
