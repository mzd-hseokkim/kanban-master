import { useMemo } from 'react';
import { Board, BoardMemberRole } from '../types/board';

interface PermissionResult {
  /** 현재 사용자가 보드 소유자인지 */
  isOwner: boolean;
  /** 현재 사용자의 역할이 VIEWER인지 */
  isViewer: boolean;
  /** 현재 사용자의 역할이 EDITOR인지 */
  isEditor: boolean;
  /** 현재 사용자의 역할이 MANAGER인지 */
  isManager: boolean;
  /** 편집 권한 (EDITOR 이상) */
  canEdit: boolean;
  /** 관리 권한 (MANAGER 또는 Owner) */
  canManage: boolean;
  /** 현재 역할 */
  currentRole?: BoardMemberRole;
}

/**
 * 보드에 대한 현재 사용자의 권한을 계산하는 커스텀 훅
 *
 * @param board - 권한을 확인할 보드 객체
 * @param currentUserId - 현재 로그인한 사용자의 ID (선택사항)
 * @returns 권한 정보 객체
 */
export function usePermissions(
  board: Board | null | undefined,
  currentUserId?: number
): PermissionResult {
  return useMemo(() => {
    // 보드 정보가 없는 경우 기본값 반환
    if (!board) {
      return {
        isOwner: false,
        isViewer: false,
        isEditor: false,
        isManager: false,
        canEdit: false,
        canManage: false,
        currentRole: undefined,
      };
    }

    // 소유자 확인
    const isOwner = currentUserId !== undefined && board.ownerId === currentUserId;

    // 백엔드에서 권한 정보를 제공하는 경우 사용
    if (board.canEdit !== undefined && board.canManage !== undefined) {
      const currentRole = board.currentUserRole;
      return {
        isOwner,
        isViewer: currentRole === 'VIEWER',
        isEditor: currentRole === 'EDITOR',
        isManager: currentRole === 'MANAGER',
        canEdit: board.canEdit,
        canManage: board.canManage,
        currentRole,
      };
    }

    // 백엔드에서 권한 정보가 없는 경우 역할 기반으로 계산
    const currentRole = board.currentUserRole;

    // 소유자는 항상 MANAGER 권한
    if (isOwner) {
      return {
        isOwner: true,
        isViewer: false,
        isEditor: false,
        isManager: true,
        canEdit: true,
        canManage: true,
        currentRole: currentRole || 'MANAGER',
      };
    }

    // 역할 기반 권한 계산
    const isViewer = currentRole === 'VIEWER';
    const isEditor = currentRole === 'EDITOR';
    const isManager = currentRole === 'MANAGER';
    const canEdit = isEditor || isManager;
    const canManage = isManager;

    return {
      isOwner: false,
      isViewer,
      isEditor,
      isManager,
      canEdit,
      canManage,
      currentRole,
    };
  }, [board, currentUserId]);
}
