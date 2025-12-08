import { Avatar } from "@/components/common/Avatar";
import { useDialog } from "@/context/DialogContext";
import { memberService } from "@/services/memberService";
import type { BoardMember, BoardMemberRole, InvitationStatus } from "@/types/member";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface BoardMemberTableProps {
  boardId: number;
  boardOwnerId: number;
  canManage: boolean;
  onMemberCountChange?: (count: number) => void;
}

export interface BoardMemberTableRef {
  refresh: () => Promise<void>;
}

const roleBadgeColor: Record<BoardMemberRole, string> = {
  VIEWER: "bg-blue-100 text-blue-800",
  EDITOR: "bg-green-100 text-green-800",
  MANAGER: "bg-purple-100 text-purple-800",
};

const roleLabelKey: Record<BoardMemberRole, string> = {
  VIEWER: "board:members.role.viewer",
  EDITOR: "board:members.role.editor",
  MANAGER: "board:members.role.manager",
};

const GRID_TEMPLATES = {
  withActions:
    "grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.5fr)]",
  readOnly:
    "grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]",
} as const;

const statusBadgeStyles: Record<InvitationStatus, { labelKey: string; className: string }> = {
  PENDING: { labelKey: "board:members.status.pending", className: "bg-yellow-100 text-yellow-800" },
  DECLINED: { labelKey: "board:members.status.declined", className: "bg-red-100 text-red-800" },
  EXPIRED: { labelKey: "board:members.status.expired", className: "bg-gray-100 text-gray-800" },
  ACCEPTED: { labelKey: "board:members.status.accepted", className: "bg-green-100 text-green-800" },
};

const formatAvatarUrl = (avatarUrl?: string | null) => {
  if (!avatarUrl) return null;
  return avatarUrl.startsWith("http")
    ? avatarUrl
    : `${import.meta.env.VITE_API_URL}${avatarUrl}`;
};

interface BoardMemberRowProps {
  member: BoardMember;
  boardOwnerId: number;
  canManage: boolean;
  gridTemplate: string;
  loading: boolean;
  changingRole: number | null;
  removingMember: number | null;
  onRoleChange: (memberId: number, newRole: BoardMemberRole) => Promise<void>;
  onRemove: (memberId: number) => Promise<void>;
}

const StatusBadge = ({ status }: { status: InvitationStatus }) => {
  const { t } = useTranslation();
  const statusInfo = statusBadgeStyles[status];

  return (
    <span
      className={`inline-block px-2 py-1 text-xs rounded whitespace-nowrap ${statusInfo.className}`}
    >
      {t(statusInfo.labelKey)}
    </span>
  );
};

const BoardMemberRow = ({
  member,
  boardOwnerId,
  canManage,
  gridTemplate,
  loading,
  changingRole,
  removingMember,
  onRoleChange,
  onRemove,
}: BoardMemberRowProps) => {
  const { t } = useTranslation(['board', 'common']);
  const avatarUrl = formatAvatarUrl(member.avatarUrl);

  const isOwner = member.userId === boardOwnerId;

  const renderRoleControl = () => {
    if (isOwner) {
      return (
        <span className="inline-block px-2 py-1 text-xs rounded font-medium bg-indigo-100 text-indigo-800">
          {t('board:members.role.owner')}
        </span>
      );
    }

    if (!canManage) {
      return (
        <span
          className={`inline-block px-2 py-1 text-xs rounded font-medium ${roleBadgeColor[member.role]}`}
        >
          {t(roleLabelKey[member.role])}
        </span>
      );
    }

    return (
      <select
        value={member.role}
        onChange={(e) => onRoleChange(member.userId, e.target.value as BoardMemberRole)}
        disabled={changingRole === member.userId || loading}
        className={`w-full px-2 py-1 text-xs rounded font-medium border border-gray-300 cursor-pointer ${
          roleBadgeColor[member.role]
        } disabled:opacity-50`}
      >
        <option value="VIEWER">{t(roleLabelKey.VIEWER)}</option>
        <option value="EDITOR">{t(roleLabelKey.EDITOR)}</option>
        <option value="MANAGER">{t(roleLabelKey.MANAGER)}</option>
      </select>
    );
  };

  return (
    <div
      className={`grid ${gridTemplate} gap-4 border-b border-gray-100 px-4 py-2 items-center hover:bg-blue-50 transition-colors`}
    >
      <div className="col-span-1 flex items-center gap-2">
        <Avatar avatarUrl={avatarUrl} userName={member.userName} size="sm" />
        <span className="text-xs text-gray-900 font-medium truncate">
          {member.userName}
        </span>
      </div>

      <div className="col-span-1 text-xs text-gray-600 truncate" title={member.userEmail}>
        {member.userEmail}
      </div>

      <div className="col-span-1">{renderRoleControl()}</div>

      <div className="col-span-1">
        <StatusBadge status={member.invitationStatus} />
      </div>

      {canManage && !isOwner && (
        <div className="col-span-1 flex justify-end">
          <button
            onClick={() => onRemove(member.userId)}
            disabled={removingMember === member.userId || loading}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-md transition-colors flex items-center justify-center"
            title={useTranslation().t('board:members.remove')}
          >
            {removingMember === member.userId ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M12 2a10 10 0 0110 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            ) : (
              <FiTrash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export const BoardMemberTable = forwardRef<BoardMemberTableRef, BoardMemberTableProps>(({ 
  boardId,
  boardOwnerId,
  canManage,
  onMemberCountChange,
}, ref) => {
  const { t } = useTranslation(['board', 'common']);
  const { confirm } = useDialog();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [removingMember, setRemovingMember] = useState<number | null>(null);
  const pageSize = 10;

  const loadMembers = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberService.getBoardMembersPage(
        boardId,
        page,
        pageSize,
      );
      setMembers(response.content);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
      onMemberCountChange?.(response.totalElements);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('board:members.loadFailed', { defaultValue: 'Failed to load members' });
      setError(errorMessage);
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await loadMembers(currentPage);
    },
  }));

  useEffect(() => {
    loadMembers(0);
  }, [boardId]);

  const handleRoleChange = async (
    memberId: number,
    newRole: BoardMemberRole,
  ) => {
    try {
      setChangingRole(memberId);
      await memberService.changeMemberRole(boardId, memberId, {
        role: newRole,
      });
      await loadMembers(currentPage);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('board:members.roleChangeFailed', { defaultValue: 'Failed to change role' });
      setError(errorMessage);
      console.error("Failed to change role:", err);
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    const confirmed = await confirm(t('board:members.removeConfirm'), {
      confirmText: t('common:button.delete'),
      cancelText: t('common:button.cancel'),
      isDestructive: true,
    });

    if (!confirmed) return;

    try {
      setRemovingMember(memberId);
      await memberService.removeMember(boardId, memberId);
      await loadMembers(currentPage);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('board:members.removeFailed', { defaultValue: 'Failed to remove member' });
      setError(errorMessage);
      console.error("Failed to remove member:", err);
    } finally {
      setRemovingMember(null);
    }
  };

  if (error && members.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-red-600">
        <span>{error}</span>
      </div>
    );
  }

  const gridTemplate = canManage ? GRID_TEMPLATES.withActions : GRID_TEMPLATES.readOnly;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">{t('board:members.tableTitle')}</h3>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {members.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 p-4">
            <p className="text-sm">{t('board:members.empty')}</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Table Header */}
            <div
              className={`grid ${gridTemplate} gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-medium text-gray-700 sticky top-0`}
            >
              <div className="col-span-1">{t('board:members.name')}</div>
              <div className="col-span-1">{t('board:members.email')}</div>
              <div className="col-span-1">{t('board:members.roleLabel')}</div>
              <div className="col-span-1">{t('board:members.statusLabel')}</div>
              {canManage && (
                <div className="col-span-1 flex justify-end">{t('board:members.actions')}</div>
              )}
            </div>

            {/* Table Body */}
            {members.map((member) => (
              <BoardMemberRow
                key={member.userId}
                member={member}
                boardOwnerId={boardOwnerId}
                canManage={canManage}
                gridTemplate={gridTemplate}
                loading={loading}
                changingRole={changingRole}
                removingMember={removingMember}
                onRoleChange={handleRoleChange}
                onRemove={handleRemoveMember}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => loadMembers(currentPage - 1)}
            disabled={currentPage === 0 || loading}
            className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 rounded transition-colors"
          >
            이전
          </button>
          <span className="text-xs text-gray-600">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => loadMembers(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || loading}
            className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 rounded transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
});
