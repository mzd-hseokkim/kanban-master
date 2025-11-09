import { useEffect, useState } from 'react';
import { memberService } from '@/services/memberService';
import type { BoardMember, BoardMemberRole } from '@/types/member';

interface BoardMemberTableProps {
  boardId: number;
  onMemberCountChange?: (count: number) => void;
}

const roleBadgeColor: Record<BoardMemberRole, string> = {
  VIEWER: 'bg-blue-100 text-blue-800',
  EDITOR: 'bg-green-100 text-green-800',
  MANAGER: 'bg-purple-100 text-purple-800',
};

const roleLabel: Record<BoardMemberRole, string> = {
  VIEWER: '보기',
  EDITOR: '편집',
  MANAGER: '관리',
};

export const BoardMemberTable = ({ boardId, onMemberCountChange }: BoardMemberTableProps) => {
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
      const response = await memberService.getBoardMembersPage(boardId, page, pageSize);
      setMembers(response.content);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
      onMemberCountChange?.(response.totalElements);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
      setError(errorMessage);
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers(0);
  }, [boardId]);

  const handleRoleChange = async (memberId: number, newRole: BoardMemberRole) => {
    try {
      setChangingRole(memberId);
      await memberService.changeMemberRole(boardId, memberId, { role: newRole });
      await loadMembers(currentPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change role';
      setError(errorMessage);
      console.error('Failed to change role:', err);
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('이 멤버를 제거하시겠습니까?')) {
      return;
    }

    try {
      setRemovingMember(memberId);
      await memberService.removeMember(boardId, memberId);
      await loadMembers(currentPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      console.error('Failed to remove member:', err);
    } finally {
      setRemovingMember(null);
    }
  };

  const getStatusBadge = (member: BoardMember) => {
    if (member.invitationStatus === 'PENDING') {
      return <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded whitespace-nowrap">초대 대기중</span>;
    }
    if (member.invitationStatus === 'DECLINED') {
      return <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded whitespace-nowrap">거절됨</span>;
    }
    if (member.invitationStatus === 'EXPIRED') {
      return <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded whitespace-nowrap">만료됨</span>;
    }
    return null;
  };

  if (error && members.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-red-600">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">보드 멤버</h3>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {members.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 p-4">
            <p className="text-sm">멤버가 없습니다</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-medium text-gray-700 sticky top-0">
              <div className="col-span-1">이름</div>
              <div className="col-span-1">권한</div>
              <div className="col-span-1">상태</div>
              <div className="col-span-1 flex justify-end">작업</div>
            </div>

            {/* Table Body */}
            {members.map((member) => (
              <div
                key={member.userId}
                className="grid grid-cols-4 gap-4 border-b border-gray-100 px-4 py-2 items-center hover:bg-blue-50 transition-colors"
              >
                {/* Name with Tooltip */}
                <div className="col-span-1 relative group">
                  <span className="text-xs text-gray-900 font-medium cursor-help inline-block">
                    {member.userName}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {member.userEmail}
                    <div className="absolute top-full left-2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>

                {/* Role */}
                <div className="col-span-1">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as BoardMemberRole)}
                    disabled={changingRole === member.userId || loading}
                    className={`w-full px-2 py-1 text-xs rounded font-medium border border-gray-300 cursor-pointer ${
                      roleBadgeColor[member.role]
                    } disabled:opacity-50`}
                  >
                    <option value="VIEWER">{roleLabel.VIEWER}</option>
                    <option value="EDITOR">{roleLabel.EDITOR}</option>
                    <option value="MANAGER">{roleLabel.MANAGER}</option>
                  </select>
                </div>

                {/* Status */}
                <div className="col-span-1">{getStatusBadge(member)}</div>

                {/* Action */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    disabled={removingMember === member.userId || loading}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50 rounded transition-colors flex items-center justify-center"
                    title="멤버 제거"
                  >
                    {removingMember === member.userId ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
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
};
