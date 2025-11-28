import { Avatar } from '@/components/common/Avatar';
import { userService } from '@/services/userService';
import type { UserSearchResult } from '@/types/user';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface AssigneeSelectorProps {
  currentAssignee: { id: number; name: string; avatarUrl?: string } | null;
  onSelect: (user: UserSearchResult | null) => void;
  readOnly?: boolean;
}

export const AssigneeSelector = ({
  currentAssignee,
  onSelect,
  readOnly = false,
}: AssigneeSelectorProps) => {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDropdownPosition = useCallback(() => {
    const anchorEl = containerRef.current;
    if (!anchorEl) return;

    const rect = anchorEl.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (dropdownRef.current && dropdownRef.current.contains(target))
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    const handleResizeOrScroll = () => updateDropdownPosition();
    window.addEventListener('resize', handleResizeOrScroll, true);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll, true);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen, updateDropdownPosition]);

  const performSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const searchResults = await userService.searchUsers(keyword);
      setResults(searchResults);
      setIsOpen(true);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSelect = (user: UserSearchResult) => {
    onSelect(user);
    setSearchInput('');
    setResults([]);
    setIsOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  if (readOnly) {
    if (!currentAssignee) return <span className="text-slate-400 text-xs">-</span>;
    return (
      <div className="flex items-center gap-2">
        <Avatar avatarUrl={currentAssignee.avatarUrl} userName={currentAssignee.name} size="xs" />
        <span className="truncate text-xs text-slate-600">{currentAssignee.name}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {!currentAssignee ? (
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={handleInputChange}
            onFocus={() => {
                if (searchInput) setIsOpen(true);
            }}
            placeholder="담당자 검색..."
            className="w-full px-2 py-1 text-xs text-rose-600 border border-slate-200 rounded focus:outline-none focus:border-pastel-blue-400 focus:ring-1 focus:ring-pastel-blue-200"
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="w-3 h-3 border-2 border-pastel-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <div
            className="flex items-center justify-between gap-2 px-2 py-1 bg-white border border-slate-200 rounded hover:border-pastel-blue-300 cursor-pointer group"
            onClick={() => {
                onSelect(null); // Click to remove/change
            }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar avatarUrl={currentAssignee.avatarUrl} userName={currentAssignee.name} size="xs" />
            <span className="truncate text-xs text-slate-700">{currentAssignee.name}</span>
          </div>
          <button
            onClick={handleRemove}
            className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      )}

      {isOpen && results.length > 0 && dropdownStyle && createPortal(
        <div
          ref={dropdownRef}
          className="absolute mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[120] max-h-48 overflow-y-auto min-w-[150px]"
          style={{
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
          }}
        >
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <Avatar avatarUrl={user.avatarUrl} userName={user.name} size="xs" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-700 truncate">{user.name}</span>
                <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
