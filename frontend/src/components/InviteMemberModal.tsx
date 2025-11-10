import { useCallback, useEffect, useRef, useState } from 'react';
import { memberService } from '@/services/memberService';
import { userService } from '@/services/userService';
import type { BoardMemberRole } from '@/types/member';
import type { UserSearchResult } from '@/types/user';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface InviteMemberModalProps {
  boardId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteMemberModal = ({
  boardId,
  isOpen,
  onClose,
  onSuccess,
}: InviteMemberModalProps) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState<BoardMemberRole>('EDITOR');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 검색 실행
  const performSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setSearching(true);
      const results = await userService.searchUsers(keyword);
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch (err) {
      console.error('Failed to search users:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 입력 변경 시 debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setError(null);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // 사용자 선택
  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchInput('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // 선택한 사용자 제거
  const handleRemoveUser = () => {
    setSelectedUser(null);
    setSearchInput('');
  };

  const resetForm = useCallback(() => {
    setSearchInput('');
    setSearchResults([]);
    setSelectedUser(null);
    setRole('EDITOR');
    setMessage('');
    setError(null);
    setShowDropdown(false);
  }, []);

  const { stage, close } = useModalAnimation(() => {
    resetForm();
    onClose();
  });

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      setError('초대할 사용자를 선택해주세요');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await memberService.inviteMember(boardId, {
        userId: selectedUser.id,
        role,
        message: message || undefined,
      });

      onSuccess();
      close();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite member';
      setError(errorMessage);
      console.error('Failed to invite member:', err);
    } finally {
      setLoading(false);
    }
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`modal-overlay modal-overlay-${stage} bg-black bg-opacity-50 p-4`}>
      <div className={`modal-panel modal-panel-${stage} bg-white rounded-lg shadow-xl max-w-md w-full`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">멤버 초대</h2>
          <button
            onClick={close}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* User Search with Badge */}
          <div className="relative">
            <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-2">
              사용자 검색
            </label>
            <div className="relative">
              {/* Input Container with Badge */}
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                {/* Selected User Badge */}
                {selectedUser && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium flex-shrink-0">
                    <span>{selectedUser.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveUser}
                      disabled={loading}
                      className="text-blue-500 hover:text-blue-700 disabled:opacity-50 flex items-center justify-center w-4 h-4"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Text Input */}
                <input
                  ref={searchInputRef}
                  id="userSearch"
                  type="text"
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  disabled={loading}
                  placeholder={selectedUser ? '' : '이름 또는 이메일로 검색...'}
                  className="flex-1 min-w-0 outline-none text-gray-900 placeholder-gray-400 disabled:bg-transparent disabled:opacity-50"
                />

                {/* Loading Spinner */}
                {searching && (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0" />
                )}
              </div>

              {/* Search Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                >
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {searchInput && searchResults.length === 0 && !searching && (
              <p className="text-xs text-gray-500 mt-1">검색 결과가 없습니다</p>
            )}
          </div>

          {/* Role Select */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              권한
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as BoardMemberRole)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50"
            >
              <option value="VIEWER">보기 (Viewer)</option>
              <option value="EDITOR">편집 (Editor)</option>
              <option value="MANAGER">관리 (Manager)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              • Viewer: 보드 및 카드 조회만 가능<br/>
              • Editor: 카드 생성, 편집, 이동 가능<br/>
              • Manager: 멤버 관리, 보드 설정 변경 가능
            </p>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              초대 메시지 (선택사항)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder="초대 메시지를 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={close}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUser}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? '초대 중…' : '초대하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
