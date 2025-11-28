import { useModalAnimation } from '@/hooks/useModalAnimation';
import { labelService } from '@/services/labelService';
import { memberService } from '@/services/memberService';
import { searchService } from '@/services/searchService';
import { hasSearchCriteria } from '@/utils/searchFilters';
import {
  modalInputClass,
  modalLabelClass,
  modalOverlayClass,
  modalPanelClass,
  modalPrimaryButtonClass,
  modalSecondaryButtonClass,
} from '@/styles/modalStyles';
import type { Label } from '@/types/label';
import type { BoardMember } from '@/types/member';
import type { CardSearchRequest, CardSearchResult, CardSearchState } from '@/types/search';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { HiSortAscending, HiSortDescending } from 'react-icons/hi';
import { IoClose, IoFilter, IoRefresh } from 'react-icons/io5';
import { Avatar } from './common/Avatar';

interface SearchPanelProps {
  boardId: number;
  onClose: () => void;
  onCardSelect: (result: CardSearchResult) => void;
  searchState: CardSearchState;
  setSearchState: React.Dispatch<React.SetStateAction<CardSearchState>>;
}

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];

type SortOption = 'PRIORITY' | 'DUE_DATE' | 'CREATED_AT' | 'UPDATED_AT';
type SortDirection = 'ASC' | 'DESC';

export const SearchPanel: React.FC<SearchPanelProps> = ({ boardId, onClose, onCardSelect, searchState, setSearchState }) => {
  // Destructure state from props for easier usage
  const {
    keyword,
    selectedPriorities,
    selectedLabelIds,
    selectedAssigneeIds,
    isCompleted,
    overdue,
    dueDateFrom,
    dueDateTo,
    sortBy,
    sortDir: sortDirection,
    onlyMine,
  } = searchState;
  const { user } = useAuth();

  // Helper to update specific fields in state and recompute filter 활성 여부
  const updateState = (updates: Partial<CardSearchState> | ((prev: CardSearchState) => CardSearchState)) => {
    setSearchState(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      const withFlag = { ...next, isFilterActive: hasSearchCriteria(next) };
      return withFlag;
    });
  };

  const setKeyword = (val: string) => updateState({ keyword: val });
  const setSelectedPriorities = (val: string[] | ((prev: string[]) => string[])) => {
    if (typeof val === 'function') {
        updateState(prev => ({ ...prev, selectedPriorities: val(prev.selectedPriorities) }));
    } else {
        updateState({ selectedPriorities: val });
    }
  };
  const setSelectedLabelIds = (val: number[] | ((prev: number[]) => number[])) => {
    if (typeof val === 'function') {
        updateState(prev => ({ ...prev, selectedLabelIds: val(prev.selectedLabelIds) }));
    } else {
        updateState({ selectedLabelIds: val });
    }
  };
  const setSelectedAssigneeIds = (val: number[] | ((prev: number[]) => number[])) => {
    if (typeof val === 'function') {
        updateState(prev => ({ ...prev, selectedAssigneeIds: val(prev.selectedAssigneeIds) }));
    } else {
        updateState({ selectedAssigneeIds: val });
    }
  };
  const setIsCompleted = (val: boolean | undefined) => updateState({ isCompleted: val });
  const setOverdue = (val: boolean) => updateState({ overdue: val });
  const setDueDateFrom = (val: string) => updateState({ dueDateFrom: val });
  const setDueDateTo = (val: string) => updateState({ dueDateTo: val });
  const setSortBy = (val: SortOption) => updateState({ sortBy: val });
  const setSortDirection = (val: SortDirection | ((prev: SortDirection) => SortDirection)) => {
    if (typeof val === 'function') {
        updateState(prev => ({ ...prev, sortDir: val(prev.sortDir) }));
    } else {
        updateState({ sortDir: val });
    }
  };
  const toggleOnlyMine = () => updateState({ onlyMine: !onlyMine });

  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const memberMap = useMemo(() => {
    const map = new Map<number, BoardMember>();
    members.forEach((member) => {
      map.set(member.userId, member);
    });
    return map;
  }, [members]);

  const buildAvatarUrl = (userId?: number) => {
    if (!userId) return undefined;
    return `/users/${userId}/avatar`;
  };

  const getAssigneeMeta = (result: CardSearchResult) => {
    const memberInfo = result.assigneeId ? memberMap.get(result.assigneeId) : undefined;
    const name = result.assignee || memberInfo?.userName || '';
    const avatarUrl = buildAvatarUrl(result.assigneeId ?? memberInfo?.userId);

    return { name, avatarUrl };
  };

  const { stage, close } = useModalAnimation(onClose);

  useEffect(() => {
    loadLabels();
    loadMembers();
  }, [boardId]);

  const loadLabels = async () => {
    try {
      const data = await labelService.getLabels(boardId);
      setLabels(data);
    } catch (err) {
      console.error('Failed to load labels:', err);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await memberService.getBoardMembers(boardId);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const assigneeFilter = onlyMine && user ? [user.id] : (selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined);
      const request: CardSearchRequest = {
        keyword: keyword.trim() || undefined,
        priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
        assigneeIds: assigneeFilter,
        isCompleted,
        overdue: overdue || undefined,
        dueDateFrom: dueDateFrom || undefined,
        dueDateTo: dueDateTo || undefined,
      };
      const data = await searchService.searchCardsInBoard(boardId, request);
      setResults(sortResults(data, sortBy, sortDirection));
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Re-sort results when sort options change
  useEffect(() => {
    if (results.length > 0) {
        setResults(prev => sortResults([...prev], sortBy, sortDirection));
    }
  }, [sortBy, sortDirection]);

  const sortResults = (items: CardSearchResult[], by: SortOption, dir: SortDirection) => {
    return items.sort((a, b) => {
        let comparison = 0;
        switch (by) {
            case 'PRIORITY':
                const pMap: {[key: string]: number} = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                comparison = (pMap[a.priority || ''] || 0) - (pMap[b.priority || ''] || 0);
                break;
            case 'DUE_DATE':
                comparison = (new Date(a.dueDate || '9999-12-31').getTime()) - (new Date(b.dueDate || '9999-12-31').getTime());
                break;
            case 'CREATED_AT':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
            case 'UPDATED_AT':
                comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                break;
        }
        return dir === 'ASC' ? comparison : -comparison;
    });
  };

  const togglePriority = (priority: string) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const toggleLabel = (labelId: number) => {
    setSelectedLabelIds(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const toggleAssignee = (memberId: number) => {
    setSelectedAssigneeIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const clearFilters = () => {
    setSearchState(prev => ({
        ...prev,
        keyword: '',
        selectedPriorities: [],
        selectedLabelIds: [],
        selectedAssigneeIds: [],
        isCompleted: undefined,
        overdue: false,
        dueDateFrom: '',
        dueDateTo: '',
        isFilterActive: false,
        onlyMine: false,
    }));
    setResults([]);
  };

  useEffect(() => {
    if (!showFilters) return;
    handleSearch();
  }, [keyword, selectedPriorities, selectedLabelIds, selectedAssigneeIds, isCompleted, overdue, dueDateFrom, dueDateTo, boardId, showFilters, onlyMine, user?.id]);

  const priorityActiveClasses: { [key: string]: string } = {
    HIGH: 'bg-pastel-pink-200/80 text-pastel-pink-800 ring-1 ring-pastel-pink-300',
    MEDIUM: 'bg-pastel-yellow-200/80 text-pastel-yellow-800 ring-1 ring-pastel-yellow-300',
    LOW: 'bg-pastel-green-200/80 text-pastel-green-800 ring-1 ring-pastel-green-300',
  };

  const priorityBadgeClasses: { [key: string]: string } = {
    HIGH: 'bg-pastel-pink-100 text-pastel-pink-700',
    MEDIUM: 'bg-pastel-yellow-100 text-pastel-yellow-700',
    LOW: 'bg-pastel-green-100 text-pastel-green-700',
  };

  const labelColorMap: { [key: string]: string } = {
    'pastel-blue-500': '#8fb3ff',
    'pastel-pink-500': '#ffb3e6',
    'pastel-green-500': '#b3ffc4',
    'pastel-purple-500': '#d4a5ff',
    'pastel-yellow-500': '#fff4b3',
    'pastel-orange-500': '#ffd4b3',
    'pastel-red-500': '#ffb3b3',
    'pastel-teal-500': '#b3ffe6',
  };

  const handleResultSelect = (result: CardSearchResult) => {
    onCardSelect(result);
    close();
  };

  return (
    <div
      className={modalOverlayClass(stage)}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div
        className={modalPanelClass({
          stage,
          maxWidth: 'max-w-4xl',
          padding: 'p-0',
          extra: 'max-h-[90vh] flex flex-col overflow-hidden',
        })}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/40 bg-gradient-to-r from-white via-pastel-blue-50 to-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-pastel-blue-500 font-semibold">Smart Search</p>
              <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">카드 검색</h2>
            </div>
            <button
              onClick={close}
              className="w-10 h-10 rounded-full hover:bg-pastel-blue-100 text-xl text-pastel-blue-600 transition flex items-center justify-center"
              aria-label="검색 닫기"
              type="button"
            >
              <IoClose />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-white/40 bg-white/80 flex-shrink-0">
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="카드 제목이나 설명으로 검색..."
              className={`${modalInputClass} flex-1`}
              autoFocus
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 ${modalSecondaryButtonClass} !px-5 !py-3 ${
                showFilters ? '!bg-white/50 !text-pastel-blue-900 ring-2 ring-white/50' : ''
              }`}
              type="button"
            >
              <IoFilter /> 필터
            </button>
            <button
              onClick={handleSearch}
              disabled={searching}
              className={`${modalPrimaryButtonClass} !px-6 !py-3`}
              type="button"
            >
              {searching ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-white/30 bg-gradient-to-r from-pastel-blue-50 via-pastel-purple-50 to-pastel-cyan-50 space-y-6 flex-shrink-0 overflow-y-auto max-h-[40vh]">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Priority Filter */}
                    <div>
                        <label className={modalLabelClass}>우선순위</label>
                        <div className="flex gap-2">
                            {PRIORITIES.map((priority) => (
                            <button
                                key={priority}
                                onClick={() => togglePriority(priority)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition shadow ${selectedPriorities.includes(priority)
                                ? priorityActiveClasses[priority]
                                : 'bg-white/70 text-pastel-blue-600 border border-white/60 hover:bg-white'
                                }`}
                            >
                                {priority}
                            </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Filters */}
                    <div>
                        <label className={modalLabelClass}>상태</label>
                        <div className="flex gap-2 flex-wrap">
                            <button
                            onClick={() => setIsCompleted(isCompleted === true ? undefined : true)}
                            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition ${
                                isCompleted === true
                                ? 'bg-pastel-green-200 text-pastel-green-900 ring-1 ring-pastel-green-300 shadow-sm'
                                : 'bg-pastel-green-50 text-pastel-green-700 border border-pastel-green-100 hover:bg-pastel-green-100/80'
                            }`}
                            type="button"
                            >
                            완료
                            </button>
                            <button
                            onClick={() => setIsCompleted(isCompleted === false ? undefined : false)}
                            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition ${
                                isCompleted === false
                                ? 'bg-pastel-blue-200 text-pastel-blue-900 ring-1 ring-pastel-blue-300 shadow-sm'
                                : 'bg-pastel-blue-50 text-pastel-blue-700 border border-pastel-blue-100 hover:bg-pastel-blue-100/80'
                            }`}
                            type="button"
                            >
                            미완료
                            </button>
                            <button
                            onClick={() => setOverdue(!overdue)}
                            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition ${
                                overdue
                                ? 'bg-pastel-pink-200 text-pastel-pink-900 ring-1 ring-pastel-pink-300 shadow-sm'
                                : 'bg-pastel-pink-50 text-pastel-pink-700 border border-pastel-pink-100 hover:bg-pastel-pink-100/80'
                            }`}
                            type="button"
                            >
                            지연됨
                            </button>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className={modalLabelClass}>마감일 범위</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dueDateFrom}
                                onChange={(e) => setDueDateFrom(e.target.value)}
                                className={`${modalInputClass} !py-1.5 !text-sm`}
                            />
                            <span className="text-pastel-blue-400">~</span>
                            <input
                                type="date"
                                value={dueDateTo}
                                onChange={(e) => setDueDateTo(e.target.value)}
                                className={`${modalInputClass} !py-1.5 !text-sm`}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
          {/* Assignee Filter */}
          {members.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className={`${modalLabelClass} !mb-0`}>담당자</label>
                <label className="inline-flex items-center gap-2 text-sm text-pastel-blue-700 font-medium">
                  <input
                    type="checkbox"
                    checked={onlyMine}
                    onChange={toggleOnlyMine}
                    disabled={!user}
                    className="w-4 h-4 rounded border border-slate-300 text-pastel-green-600 focus:ring-pastel-green-400"
                  />
                  <span className={!user ? 'text-slate-400' : ''}>내게 할당된 카드</span>
                </label>
              </div>
              <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto p-1">
                {members.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => toggleAssignee(member.userId)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition ${
                                            selectedAssigneeIds.includes(member.userId)
                                                ? 'bg-pastel-blue-100 border-pastel-blue-300 ring-1 ring-pastel-blue-200'
                                                : 'bg-white/60 border-white/60 hover:bg-white'
                                        }`}
                                        title={member.userName}
                                    >
                                        <Avatar
                                          userName={member.userName}
                                          avatarUrl={buildAvatarUrl(member.userId)}
                                          size="sm"
                                          className="!w-5 !h-5 !text-[10px]"
                                        />
                                        <span className="text-xs text-pastel-blue-800 truncate max-w-[80px]">{member.userName}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Label Filter */}
                    {labels.length > 0 && (
                        <div>
                            <label className={modalLabelClass}>라벨</label>
                            <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto p-1">
                                {labels.map((label) => {
                                    const bgColor = labelColorMap[label.colorToken] || '#8fb3ff';
                                    const isSelected = selectedLabelIds.includes(label.id);
                                    return (
                                    <button
                                        key={label.id}
                                        onClick={() => toggleLabel(label.id)}
                                        className={`px-3 py-1 rounded text-sm font-medium border-2 transition text-slate-900 ${
                                        isSelected
                                            ? 'border-pastel-blue-600'
                                            : 'border-white/40'
                                        }`}
                                        style={{ backgroundColor: bgColor }}
                                    >
                                        {label.name}
                                    </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sorting & Reset */}
            <div className="flex items-center justify-between pt-4 border-t border-white/30">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-pastel-blue-600">정렬:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className={`${modalInputClass} !py-1 !px-2 !text-sm !w-auto`}
                    >
                        <option value="UPDATED_AT">최근 수정순</option>
                        <option value="CREATED_AT">생성일순</option>
                        <option value="DUE_DATE">마감일순</option>
                        <option value="PRIORITY">우선순위순</option>
                    </select>
                    <button
                        onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                        className="p-1.5 rounded hover:bg-white/50 text-pastel-blue-600 transition"
                        title={sortDirection === 'ASC' ? '오름차순' : '내림차순'}
                    >
                        {sortDirection === 'ASC' ? <HiSortAscending size={20} /> : <HiSortDescending size={20} />}
                    </button>
                </div>

                <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-sm text-pastel-blue-600 hover:text-pastel-blue-800 font-semibold"
                    type="button"
                >
                    <IoRefresh /> 필터 초기화
                </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white/90 via-pastel-blue-50 to-pastel-purple-50">
          {results.length === 0 ? (
            <div className="py-16 text-center text-pastel-blue-600 border-2 border-dashed border-pastel-blue-100 rounded-3xl bg-white/70">
              {searching ? '검색 중...' : '검색 결과가 없습니다'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((result) => {
                const assigneeMeta = getAssigneeMeta(result);

                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultSelect(result)}
                    className="text-left h-full rounded-2xl border border-pastel-blue-200 bg-white/90 shadow-sm hover:shadow-glass hover:border-pastel-blue-500 transition px-4 py-3 flex flex-col gap-3"
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-pastel-blue-900 truncate">{result.title}</h3>
                          {result.isCompleted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-pastel-green-100 text-pastel-green-700 inline-flex whitespace-nowrap">
                              완료
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-pastel-blue-500 truncate">
                          {result.boardName} → {result.columnName}
                        </p>
                      </div>
                      {result.priority && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${
                            priorityBadgeClasses[result.priority] || 'bg-pastel-blue-100 text-pastel-blue-700'
                          }`}
                        >
                          {result.priority}
                        </span>
                      )}
                    </div>

                    {result.description && (
                      <p className="text-sm text-pastel-blue-600 line-clamp-2">
                        {result.description}
                      </p>
                    )}

                        {result.labels && result.labels.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {result.labels.slice(0, 3).map((label) => {
                          const bgColor = labelColorMap[label.colorToken] || '#8fb3ff';
                          return (
                            <span
                              key={label.id}
                              className="text-xs px-2 py-1 rounded-full font-medium text-slate-900"
                              style={{ backgroundColor: bgColor }}
                            >
                              {label.name}
                            </span>
                          );
                        })}
                        {result.labels.length > 3 && (
                          <span className="text-xs text-pastel-blue-600">
                            +{result.labels.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Result Footer: Due Date & Assignee */}
                    <div className="flex items-center justify-between pt-2 border-t border-pastel-blue-100/50 mt-auto">
                      <div className="text-xs text-pastel-blue-500">
                          {result.dueDate && (
                              <span className={new Date(result.dueDate) < new Date() && !result.isCompleted ? 'text-pastel-pink-600 font-semibold' : ''}>
                                  📅 {result.dueDate}
                              </span>
                          )}
                      </div>
                      {assigneeMeta.name && (
                        <div className="flex items-center gap-1.5 text-xs text-pastel-blue-600 font-medium">
                          <Avatar
                            avatarUrl={assigneeMeta.avatarUrl || undefined}
                            userName={assigneeMeta.name}
                            size="xs"
                            className="!w-5 !h-5 !text-[10px]"
                          />
                          <span className="truncate max-w-[110px]">{assigneeMeta.name}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
