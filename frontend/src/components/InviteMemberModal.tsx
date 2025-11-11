import { useCallback, useEffect, useRef, useState } from 'react';
import { memberService } from '@/services/memberService';
import { userService } from '@/services/userService';
import type { BoardMemberRole } from '@/types/member';
import type { UserSearchResult } from '@/types/user';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { Avatar } from '@/components/common/Avatar';
import {
  modalOverlayClass,
  modalPanelClass,
  modalLabelClass,
  modalSelectClass,
  modalTextareaClass,
  modalSecondaryButtonClass,
  modalPrimaryButtonClass,
  modalErrorClass,
} from '@/styles/modalStyles';

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
    <div
      className={modalOverlayClass(stage)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div className={modalPanelClass({ stage })}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-pastel-blue-500 font-semibold">
              Collaboration
            </p>
            <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">멤버 초대</h2>
          </div>
          <button
            onClick={close}
            disabled={loading}
            className="w-10 h-10 rounded-full text-xl text-pastel-blue-500 hover:bg-white/40 transition disabled:opacity-50 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className={modalErrorClass}>{error}</div>}

          {/* User Search with Badge */}
          <div className="relative">
            <label htmlFor="userSearch" className={modalLabelClass}>
              사용자 검색
            </label>
            <div className="relative">
              {/* Input Container with Badge */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 border border-white/40 rounded-xl focus-within:outline-none focus-within:ring-2 focus-within:ring-pastel-blue-300/60 bg-white/40 backdrop-blur-sm">
                {/* Selected User Badge */}
                {selectedUser && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/60 border border-white/40 text-pastel-blue-700 rounded-lg text-sm font-medium flex-shrink-0 shadow-sm">
                    <span>{selectedUser.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveUser}
                      disabled={loading}
                      className="text-pastel-blue-500 hover:text-pastel-blue-700 disabled:opacity-50 flex items-center justify-center w-4 h-4"
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
                  className="borderless-input flex-1 min-w-0 outline-none bg-transparent text-pastel-blue-900 placeholder-pastel-blue-500 disabled:bg-transparent disabled:opacity-50"
                />

                {/* Loading Spinner */}
                {searching && (
                  <div className="animate-spin h-4 w-4 border-2 border-pastel-blue-400 border-t-transparent rounded-full flex-shrink-0" />
                )}
              </div>

              {/* Search Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white/80 border border-white/40 rounded-2xl shadow-glass z-10 max-h-48 overflow-y-auto backdrop-blur-lg"
                >
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-2 text-left hover:bg-white/70 border-b border-white/30 last:border-b-0 transition-colors flex items-center gap-3"
                    >
                      <Avatar
                        avatarUrl={user.avatarUrl}
                        userName={user.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-pastel-blue-900">{user.name}</div>
                        <div className="text-xs text-pastel-blue-500">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {searchInput && searchResults.length === 0 && !searching && (
              <p className="text-xs text-pastel-blue-500 mt-1">검색 결과가 없습니다</p>
            )}
          </div>

          {/* Role Select */}
          <div>
            <label htmlFor="role" className={modalLabelClass}>
              권한
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as BoardMemberRole)}
              disabled={loading}
              className={modalSelectClass}
            >
              <option value="VIEWER">보기 (Viewer)</option>
              <option value="EDITOR">편집 (Editor)</option>
              <option value="MANAGER">관리 (Manager)</option>
            </select>
            <p className="text-xs text-pastel-blue-500 mt-2 leading-5">
              • Viewer: 보드 및 카드 조회만 가능<br />
              • Editor: 카드 생성, 편집, 이동 가능<br />
              • Manager: 멤버 관리, 보드 설정 변경 가능
            </p>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className={modalLabelClass}>
              초대 메시지 (선택사항)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder="초대 메시지를 입력하세요"
              rows={3}
              className={modalTextareaClass}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              disabled={loading}
              className={`flex-1 ${modalSecondaryButtonClass}`}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUser}
              className={`flex-1 ${modalPrimaryButtonClass}`}
            >
              {loading ? '초대 중…' : '초대하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
