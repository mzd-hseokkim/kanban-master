import ChildCardList from '@/components/ChildCardList';
import { CommentSection } from '@/components/CommentSection';
import { Avatar } from '@/components/common/Avatar';
import { MentionInput } from '@/components/common/MentionInput';
import { CreateCardModal } from '@/components/CreateCardModal';
import { ErrorNotification } from '@/components/ErrorNotification';
import { LabelSelector } from '@/components/label/LabelSelector';
import ParentCardLink from '@/components/ParentCardLink';
import { useAuth } from '@/context/AuthContext';
import { useCard } from '@/context/CardContext';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import cardService from '@/services/cardService';
import { labelService } from '@/services/labelService';
import { userService } from '@/services/userService';
import { watchService } from '@/services/watchService';
import { useTranslation } from 'react-i18next';
import {
    modalColorButtonClass,
    modalErrorClass,
    modalInputClass,
    modalLabelClass,
    modalOverlayClass,
    modalPanelClass,
    modalPrimaryButtonClass,
    modalSecondaryButtonClass,
    modalSelectClass,
} from '@/styles/modalStyles';
import { Card } from '@/types/card';
import type { UserSearchResult } from '@/types/user';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiCheck, HiEye, HiOutlineEye, HiPlay } from 'react-icons/hi';
import { MdArchive } from 'react-icons/md';
import { AttachmentSection } from './attachment/AttachmentSection';
import { ChecklistSection } from './checklist/ChecklistSection';
import { ConfirmModal } from './common/ConfirmModal';

interface EditCardModalProps {
    card: Card;
    workspaceId: number;
    boardId: number;
    boardOwnerId: number;
    columnId: number;
    canEdit: boolean;
    onClose: () => void;
}

const cardPriorities = ['HIGH', 'MEDIUM', 'LOW'];

const cardColors = [
    { label: 'Blue', hex: '#e8f1ff' },
    { label: 'Pink', hex: '#ffe8f1' },
    { label: 'Green', hex: '#e8ffe8' },
    { label: 'Yellow', hex: '#ffffee' },
    { label: 'Purple', hex: '#f0e8ff' },
];

export const EditCardModal: React.FC<EditCardModalProps> = ({
    card,
    workspaceId,
    boardId,
    boardOwnerId,
    columnId,
    canEdit,
    onClose,
}) => {
    const { t } = useTranslation(['card', 'common']);
    const { updateCard, loadCards } = useCard();
    const { user } = useAuth();
    const { stage, close } = useModalAnimation(onClose);

    // 현재 표시 중인 카드 상태 (부모/자식 네비게이션용)
    const [currentCard, setCurrentCard] = useState<Card>(card);
    const [isNavigating, setIsNavigating] = useState(false);

    // 자식 카드 생성 모달 상태
    const [showCreateChildModal, setShowCreateChildModal] = useState(false);

    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [selectedColor, setSelectedColor] = useState(card.bgColor || cardColors[0].hex);
    const [priority, setPriority] = useState(card.priority || '');
    const [dueDate, setDueDate] = useState(card.dueDate || '');
    const [isCompleted, setIsCompleted] = useState(card.isCompleted);
    const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(card.labels?.map((l) => l.id) || []);
    const [loading, setLoading] = useState(false);
    const [startLoading, setStartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [assigneeSearchInput, setAssigneeSearchInput] = useState('');
    const [assigneeResults, setAssigneeResults] = useState<UserSearchResult[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<UserSearchResult | null>(
        card.assigneeId && card.assignee
            ? {
                  id: card.assigneeId,
                  name: card.assignee,
                  email: '',
              }
            : null
    );
    const [assigneeSearching, setAssigneeSearching] = useState(false);
    const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
    const [descriptionSaving, setDescriptionSaving] = useState(false);
    const [isWatching, setIsWatching] = useState(false);
    const [watchLoading, setWatchLoading] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const assigneeInputRef = useRef<HTMLInputElement>(null);
    const assigneeInputContainerRef = useRef<HTMLDivElement>(null);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);
    const assigneeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

    const watchButtonClass = isWatching
        ? 'text-pastel-blue-600 hover:bg-pastel-blue-100'
        : 'text-gray-400 hover:text-pastel-blue-600 hover:bg-gray-100';

    const renderWatchIcon = () => {
        if (watchLoading) {
            return <span className="animate-spin text-lg">⏳</span>;
        }
        return isWatching ? <HiEye className="text-xl" /> : <HiOutlineEye className="text-xl" />;
    };

    const getStartButtonLabel = () => {
        if (startLoading) return t('card:editModal.starting', { defaultValue: '시작 중...' });
        if (currentCard.startedAt) return isCompleted ? t('card:editModal.completed', { defaultValue: '완료됨' }) : t('card:editModal.inProgress', { defaultValue: '진행 중' });
        return t('card:editModal.start');
    };

    const performAssigneeSearch = async (keyword: string) => {
        const trimmedKeyword = keyword.trim();
        if (!trimmedKeyword) {
            setAssigneeResults([]);
            setAssigneeDropdownOpen(false);
            return;
        }

        try {
            setAssigneeSearching(true);
            const results = await userService.searchUsers(trimmedKeyword);
            setAssigneeResults(results);
            setAssigneeDropdownOpen(results.length > 0);
        } catch (err) {
            console.error('Failed to search users:', err);
            setAssigneeResults([]);
            setAssigneeDropdownOpen(false);
        } finally {
            setAssigneeSearching(false);
        }
    };

    const handleAssigneeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAssigneeSearchInput(value);

        if (assigneeDebounceRef.current) {
            clearTimeout(assigneeDebounceRef.current);
        }

        assigneeDebounceRef.current = setTimeout(() => {
            performAssigneeSearch(value);
        }, 300);
    };

    const handleSelectAssignee = (user: UserSearchResult) => {
        setSelectedAssignee(user);
        setAssigneeSearchInput('');
        setAssigneeResults([]);
        setAssigneeDropdownOpen(false);
    };

    const handleAssignToMe = () => {
        if (!canEdit || !user || loading) return;
        setSelectedAssignee({
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl || undefined,
        });
        setAssigneeSearchInput('');
        setAssigneeResults([]);
        setAssigneeDropdownOpen(false);
    };

    const handleRemoveAssignee = () => {
        setSelectedAssignee(null);
        setAssigneeSearchInput('');
        setAssigneeResults([]);
        setAssigneeDropdownOpen(false);
    };

    // 부모/자식 카드 네비게이션 핸들러
    const handleNavigateToCard = async (targetCardId: number) => {
        try {
            setIsNavigating(true);
            setError(null);

            // includeRelations=true로 계층 정보 포함하여 카드 조회
            const targetCard = await cardService.getCard(
                workspaceId,
                boardId,
                columnId,
                targetCardId,
                true
            );

            // 현재 카드 상태 업데이트
            setCurrentCard(targetCard);

            // 폼 필드 초기화
            setTitle(targetCard.title);
            setDescription(targetCard.description || '');
            setSelectedColor(targetCard.bgColor || cardColors[0].hex);
            setPriority(targetCard.priority || '');
            setDueDate(targetCard.dueDate || '');
            setIsCompleted(targetCard.isCompleted);
            setSelectedLabelIds(targetCard.labels?.map((l) => l.id) || []);
            setSelectedAssignee(
                targetCard.assigneeId && targetCard.assignee
                    ? {
                          id: targetCard.assigneeId,
                          name: targetCard.assignee,
                          email: '',
                      }
                    : null
            );

            // 담당자 검색 필드 초기화
            setAssigneeSearchInput('');
            setAssigneeResults([]);
            setAssigneeDropdownOpen(false);
        } catch (err) {
            console.error('Failed to navigate to card:', err);
            setError(err instanceof Error ? err.message : '카드 정보를 불러오는데 실패했습니다');
        } finally {
            setIsNavigating(false);
        }
    };

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return null;
        return new Date(isoString).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleStartCard = useCallback(async () => {
        if (!canEdit || startLoading) return;
        try {
            setStartLoading(true);
            setError(null);
            const startedCard = await cardService.startCard(workspaceId, boardId, columnId, currentCard.id);
            setCurrentCard(startedCard);
            setIsCompleted(startedCard.isCompleted);
            await loadCards(workspaceId, boardId, columnId);
        } catch (err) {
            console.error('Failed to start card:', err);
            setError(err instanceof Error ? err.message : '카드를 시작할 수 없습니다');
        } finally {
            setStartLoading(false);
        }
    }, [canEdit, startLoading, workspaceId, boardId, columnId, currentCard.id, loadCards]);

    // 완료 체크 토글 핸들러 (즉시 업데이트)
    const handleToggleCompletion = useCallback(async () => {
        if (!canEdit || loading) return;

        const newCompletionState = !isCompleted;

        try {
            setLoading(true);
            setError(null);

            // 낙관적 업데이트 (UI 즉시 반영)
            setIsCompleted(newCompletionState);

            // 서버에 업데이트 요청
            await updateCard(workspaceId, boardId, columnId, currentCard.id, {
                isCompleted: newCompletionState,
            });

            // 카드 목록 새로고침
            await loadCards(workspaceId, boardId, columnId);
        } catch (err) {
            console.error('Failed to toggle completion:', err);
            setError(err instanceof Error ? err.message : '완료 상태 변경에 실패했습니다');
            // 에러 발생 시 상태 롤백
            setIsCompleted(!newCompletionState);
        } finally {
            setLoading(false);
        }
    }, [canEdit, loading, isCompleted, workspaceId, boardId, columnId, currentCard.id, updateCard, loadCards]);



    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedInsideDropdown = assigneeDropdownRef.current && assigneeDropdownRef.current.contains(target);
            const clickedInsideInput =
                assigneeInputContainerRef.current && assigneeInputContainerRef.current.contains(target);

            if (!clickedInsideDropdown && !clickedInsideInput) {
                setAssigneeDropdownOpen(false);
            }
        };

        if (assigneeDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [assigneeDropdownOpen]);

    // 모달이 열릴 때 제목 필드에 자동 포커스
    useEffect(() => {
        const timer = setTimeout(() => {
            titleInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        return () => {
            if (assigneeDebounceRef.current) {
                clearTimeout(assigneeDebounceRef.current);
            }

        };
    }, []);

    useEffect(() => {
        if (currentCard.assigneeId && currentCard.assignee) {
            setSelectedAssignee({
                id: currentCard.assigneeId,
                name: currentCard.assignee,
                email: '',
            });
        } else {
            setSelectedAssignee(null);
        }
    }, [currentCard.assigneeId, currentCard.assignee]);

    // Watch 상태 로드
    useEffect(() => {
        const loadWatchStatus = async () => {
            if (currentCard && user) {
                try {
                    const status = await watchService.getWatchStatus(currentCard.id);
                    console.log('Watch Status Response:', status); // 디버깅용 로그
                    setIsWatching(status.isWatching);
                } catch (error) {
                    console.error('Failed to load watch status:', error);
                }
            }
        };
        loadWatchStatus();
    }, [currentCard, user]);

    // Keyboard shortcuts
    // Esc: Close modal
    useKeyboardShortcut('esc', () => {
        close();
    });

    // Cmd/Ctrl + Enter: Submit form
    useKeyboardShortcut('mod+enter', () => {
        if (canEdit && title.trim() && !loading) {
            handleSubmit(new Event('submit') as any);
        }
    });

    // Cmd/Ctrl + I: Assign to me
    useKeyboardShortcut('mod+i', () => {
        handleAssignToMe();
    }, { preventDefault: true });

    // Watch 토글 핸들러
    const handleToggleWatch = async () => {
        if (!currentCard) return;

        try {
            setWatchLoading(true);
            const response = await watchService.toggleWatch(currentCard.id);
            console.log('Toggle Watch Response:', response); // 디버깅용 로그
            setIsWatching(response.isWatching);

            // GNB 업데이트를 위한 이벤트 발송
            window.dispatchEvent(new CustomEvent('watch-updated'));
        } catch (error) {
            console.error('Failed to toggle watch:', error);
            // 에러 시 상태 롤백 (낙관적 업데이트를 했다면)
        } finally {
            setWatchLoading(false);
        }
    };

    // 아카이브 핸들러
    const handleArchiveCard = async () => {
        if (!canEdit || loading) return;

        try {
            setLoading(true);
            setError(null);
            await cardService.archiveCard(workspaceId, boardId, columnId, currentCard.id);
            await loadCards(workspaceId, boardId, columnId);
            close();
        } catch (err) {
            console.error('Failed to archive card:', err);
            setError(err instanceof Error ? err.message : t('card:editModal.archiveFailed', { defaultValue: '카드 아카이브에 실패했습니다' }));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('카드 제목을 입력해주세요');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 라벨 업데이트 먼저 수행 (변경이 있을 경우에만)
            const sortByNumber = (a: number, b: number) => a - b;
            const currentLabelIds = currentCard.labels?.map((l) => l.id).sort(sortByNumber) || [];
            const newLabelIds = [...selectedLabelIds].sort(sortByNumber);
            if (JSON.stringify(currentLabelIds) !== JSON.stringify(newLabelIds)) {
                await labelService.assignLabelsToCard(currentCard.id, selectedLabelIds);
            }

            // 기본 정보 업데이트 후 전체 데이터 새로고침
            await updateCard(workspaceId, boardId, columnId, currentCard.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                bgColor: selectedColor || undefined,
                priority: priority || undefined,
                assigneeId: selectedAssignee ? selectedAssignee.id : -1, // -1 to unassign
                dueDate: dueDate || undefined,
                isCompleted,
            });

            // 모든 변경사항이 반영된 최신 데이터를 가져옴
            await loadCards(workspaceId, boardId, columnId);

            close();
        } catch (err) {
            const message = err instanceof Error ? err.message : '카드 수정에 실패했습니다';
            setError(message);
            console.error('Failed to update card:', err);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div
            className={modalOverlayClass(stage)}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    close();
                }
            }}
        >
            <div
                className={modalPanelClass({
                    stage,
                    maxWidth: 'max-w-6xl',
                    scrollable: false,
                    padding: '',
                })}
                style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
                    {/* 상단 고정 헤더 영역 */}
                    <div className="flex-shrink-0 px-5 pt-4 pb-2 border-b border-white/30">
                        {/* 타이틀과 설명 */}
                        <div className="mb-2">
                            <h2 className="text-lg font-bold text-slate-800 mb-0.5">{t('card:editModal.title')}</h2>
                            <p className="text-xs text-slate-500">{t('card:editModal.subtitle')}</p>
                        </div>

                        {/* 카드 제목 입력 + 액션 버튼들 */}
                        <div className="flex items-center gap-3">
                            {/* 카드 제목 입력 */}
                            <div className="flex-1 relative">
                                <input
                                    ref={titleInputRef}
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && canEdit) {
                                            e.preventDefault();
                                            handleSubmit(e as unknown as React.FormEvent);
                                        }
                                    }}
                                    placeholder={t('card:createModal.titlePlaceholder')}
                                    className={`${modalInputClass} pr-12 ${isCompleted ? 'line-through text-gray-400' : ''}`}
                                    disabled={loading || !canEdit}
                                    readOnly={!canEdit}
                                />
                                <button
                                    type="button"
                                    onClick={handleToggleWatch}
                                    disabled={watchLoading}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${watchButtonClass} disabled:opacity-50`}
                                    title={isWatching ? t('card:editModal.unwatch') : t('card:editModal.watch')}
                                >
                                    {renderWatchIcon()}
                                </button>
                            </div>

                            {/* 우측 액션 버튼들 */}
                            <div className="flex items-center gap-2">
                                {/* 작업 시작 버튼 */}
                                <button
                                    type="button"
                                    onClick={handleStartCard}
                                    disabled={
                                        !canEdit ||
                                        startLoading ||
                                        Boolean(currentCard.startedAt)
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                                        !canEdit || currentCard.startedAt
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-pastel-blue-600 text-white hover:bg-pastel-blue-500 shadow-sm'
                                    }`}
                                    title={
                                        currentCard.startedAt
                                            ? t('card:editModal.startedAt', { time: formatDateTime(currentCard.startedAt) })
                                            : t('card:editModal.notStarted')
                                    }
                                >
                                    <HiPlay className="text-sm" />
                                    {getStartButtonLabel()}
                                </button>

                                {/* 완료 체크박스 */}
                                <button
                                    type="button"
                                    onClick={handleToggleCompletion}
                                    disabled={loading || !canEdit}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                                        isCompleted
                                            ? 'bg-pastel-green-50 border-pastel-green-300'
                                            : 'bg-white/30 border-white/40 hover:border-pastel-green-400'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    <div className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                                        isCompleted
                                            ? 'bg-white border-pastel-green-500'
                                            : 'bg-white border-gray-300'
                                    }`}>
                                        {isCompleted && <HiCheck className="text-pastel-green-500 text-xs font-bold" />}
                                    </div>
                                    <span className="text-xs font-semibold text-pastel-blue-900">{t('card:editModal.complete')}</span>
                                </button>

                                {/* 아카이브 버튼 */}
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => setShowArchiveConfirm(true)}
                                        disabled={loading}
                                        className="px-3 py-1.5 rounded-lg border border-pastel-pink-300 bg-pastel-pink-50 text-pastel-pink-700 text-xs font-semibold hover:bg-pastel-pink-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                                    >
                                        <MdArchive className="text-sm" />
                                        {t('card:column.archiveAll')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 스크롤 가능한 컨텐츠 영역 */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                        {/* 2열 레이아웃 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                            {/* 왼쪽 컬럼: 카드 메타데이터 */}
                            <div className="space-y-3">
                                {/* 부모 카드 링크 (있는 경우에만 표시) */}
                                {currentCard.parentCard && (
                                    <ParentCardLink
                                        parentCard={currentCard.parentCard}
                                        onNavigate={handleNavigateToCard}
                                        disabled={isNavigating}
                                    />
                                )}

                                {/* Read-Only Notice */}
                                {!canEdit && (
                                    <div className="px-4 py-3 rounded-xl bg-pastel-yellow-100 border border-pastel-yellow-300 text-pastel-yellow-800 text-sm font-medium">
                                        🔒 읽기 전용 모드 - 이 카드를 수정할 권한이 없습니다
                                    </div>
                                )}

                                {/* 우선순위 + 마감일 (2열 그리드) */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* 우선순위 선택 */}
                                    <div>
                                        <label className={modalLabelClass}>{t('card:common.priorityLabel')}</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className={modalSelectClass}
                                            disabled={loading || !canEdit}
                                        >
                                            <option value="">선택 (선택사항)</option>
                                            {cardPriorities.map((p) => (
                                                <option key={p} value={p}>
                                                    {p}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 마감 날짜 입력 */}
                                    <div>
                                        <label className={modalLabelClass}>{t('card:common.dueDateLabel')}</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className={modalInputClass}
                                            disabled={loading || !canEdit}
                                            readOnly={!canEdit}
                                        />
                                    </div>
                                </div>

                                {/* 담당자 입력 */}
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <label className={`${modalLabelClass} mb-0`}>{t('card:common.assigneeLabel')}</label>
                                        <button
                                            type="button"
                                            onClick={handleAssignToMe}
                                            disabled={!user || loading || !canEdit}
                                            className="text-xs font-semibold text-pastel-blue-700 hover:text-pastel-blue-900 disabled:opacity-50 underline decoration-dotted"
                                        >
                                            {t('card:common.assignToMe')}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <div
                                            ref={assigneeInputContainerRef}
                                            className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-xl border border-white/40 bg-white/40 backdrop-blur-sm focus-within:ring-2 focus-within:ring-pastel-blue-300/60"
                                        >
                                            {selectedAssignee && (
                                                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-pastel-blue-400 to-pastel-cyan-400 border-2 border-pastel-blue-500 text-white text-sm font-bold shadow-md">
                                                    <span>👤 {selectedAssignee.name}</span>
                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveAssignee}
                                                            disabled={loading}
                                                            className="text-white hover:text-pastel-pink-200 disabled:opacity-50 transition-colors"
                                                            aria-label="담당자 제거"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <input
                                                ref={assigneeInputRef}
                                                type="text"
                                                value={assigneeSearchInput}
                                                onChange={handleAssigneeInputChange}
                                                onFocus={() =>
                                                    canEdit && assigneeResults.length > 0 && setAssigneeDropdownOpen(true)
                                                }
                                                placeholder={selectedAssignee ? '' : t('card:createModal.searchAssigneePlaceholder')}
                                                className="borderless-input flex-1 min-w-0 bg-transparent text-pastel-blue-900 placeholder-pastel-blue-500 focus:outline-none"
                                                disabled={loading || !canEdit}
                                                readOnly={!canEdit}
                                            />

                                            {assigneeSearching && (
                                                <div className="h-4 w-4 border-2 border-pastel-blue-400 border-t-transparent rounded-full animate-spin" />
                                            )}
                                        </div>

                                        {assigneeDropdownOpen && assigneeResults.length > 0 && (
                                            <div
                                                ref={assigneeDropdownRef}
                                                className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/40 bg-white/80 backdrop-blur-lg shadow-glass max-h-48 overflow-y-auto z-10"
                                            >
                                                {assigneeResults.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => handleSelectAssignee(user)}
                                                        className="w-full px-4 py-2 text-left hover:bg-white/70 border-b border-white/30 last:border-b-0 transition-colors flex items-center gap-3"
                                                    >
                                                        <Avatar avatarUrl={user.avatarUrl} userName={user.name} size="sm" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-pastel-blue-900">{user.name}</div>
                                                            <div className="text-xs text-pastel-blue-500">{user.email}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {assigneeSearchInput && assigneeResults.length === 0 && !assigneeSearching && (
                                        <p className="text-xs text-pastel-blue-500 mt-1">{t('common:action.noData')}</p>
                                    )}
                                </div>

                                {/* 라벨 */}
                                {canEdit && (
                                    <div>
                                        <label className={modalLabelClass}>{t('card:common.labelLabel')}</label>
                                        <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/30 bg-white/30 p-3">
                                            <LabelSelector
                                                boardId={boardId}
                                                cardId={currentCard.id}
                                                selectedLabelIds={selectedLabelIds}
                                                onChange={setSelectedLabelIds}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 색상 선택 */}
                                <div>
                                    <label className={modalLabelClass}>{t('card:createModal.colorLabel', { defaultValue: '색상' })}</label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {cardColors.map((color) => (
                                            <button
                                                key={color.hex}
                                                type="button"
                                                onClick={canEdit ? () => setSelectedColor(color.hex) : undefined}
                                                style={{ backgroundColor: color.hex }}
                                                className={`w-full h-12 ${modalColorButtonClass(
                                                    selectedColor === color.hex
                                                )}`}
                                                title={color.label}
                                                disabled={loading || !canEdit}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* 설명 */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={modalLabelClass}>{t('card:common.descriptionLabel')}</label>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        setDescriptionSaving(true);
                                                        await updateCard(workspaceId, boardId, columnId, currentCard.id, {
                                                            description: description,
                                                        });
                                                        // 성공 표시 (선택 사항)
                                                    } catch (err) {
                                                        console.error('Failed to save description:', err);
                                                        setError(err instanceof Error ? err.message : t('card:editModal.saveDescriptionFailed', { defaultValue: '설명 저장에 실패했습니다' }));
                                                    } finally {
                                                        setDescriptionSaving(false);
                                                    }
                                                }}
                                                disabled={descriptionSaving || description === (currentCard.description || '')}
                                                className="px-3 py-1 text-xs font-medium rounded-lg bg-pastel-blue-100 text-pastel-blue-700 hover:bg-pastel-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {descriptionSaving ? t('card:editModal.savingDescription', { defaultValue: '저장 중...' }) : t('card:editModal.saveDescription', { defaultValue: '설명 저장' })}
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ minHeight: '150px' }}>
                                        <MentionInput
                                            boardId={boardId}
                                            value={description}
                                            onChange={useCallback((val: string) => setDescription(val), [])}
                                            placeholder={t('card:common.descriptionPlaceholder')}
                                            readOnly={!canEdit}
                                            disabled={loading || !canEdit}
                                            maxLength={50000}
                                        />
                                    </div>
                                </div>

                                {/* 에러 메시지 */}
                                {error && <div className={modalErrorClass}>{error}</div>}
                            </div>

                            {/* 오른쪽 컬럼: 자식 카드 + 체크리스트 + 첨부파일 + 댓글 섹션 */}
                            <div className="space-y-3 border-l border-gray-200 pl-4">
                                {/* 자식 카드 목록 (항상 표시) */}
                                <div>
                                    <ChildCardList
                                        childCards={currentCard.childCards || []}
                                        onNavigate={handleNavigateToCard}
                                        onCreateChild={() => setShowCreateChildModal(true)}
                                        disabled={isNavigating || !canEdit}
                                    />
                                </div>

                                {/* 체크리스트 섹션 */}
                                <div>
                                    <ChecklistSection
                                        cardId={currentCard.id}
                                        workspaceId={workspaceId}
                                        boardId={boardId}
                                        columnId={columnId}
                                        canEdit={canEdit}
                                    />
                                </div>

                                {/* 첨부파일 섹션 */}
                                <div>
                                    <AttachmentSection
                                        cardId={currentCard.id}
                                        workspaceId={workspaceId}
                                        boardId={boardId}
                                        columnId={columnId}
                                        canEdit={canEdit}
                                    />
                                </div>

                                {/* 댓글 섹션 */}
                                {user && (
                                    <CommentSection
                                        workspaceId={workspaceId}
                                        boardId={boardId}
                                        cardId={currentCard.id}
                                        currentUserId={user.id}
                                        isOwner={user.id === boardOwnerId}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 하단 고정 버튼 영역 */}
                    <div className="flex-shrink-0 border-t border-white/30 bg-white/60 backdrop-blur-sm px-5 py-2.5">
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={close}
                                disabled={loading}
                                className={`px-4 py-1.5 text-sm ${modalSecondaryButtonClass}`}
                            >
                                {canEdit ? t('common:button.cancel') : t('common:button.close', { defaultValue: '닫기' })}
                            </button>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSubmit(e as unknown as React.FormEvent);
                                    }}
                                    disabled={loading}
                                    className={`px-4 py-1.5 text-sm ${modalPrimaryButtonClass}`}
                                >
                                    {loading ? t('card:editModal.updating', { defaultValue: '저장 중...' }) : t('card:editModal.update')}
                                </button>
                            )}
                        </div>
                    </div>

                {/* 자식 카드 생성 모달 */}
                {showCreateChildModal && (
                    <CreateCardModal
                        workspaceId={workspaceId}
                        boardId={boardId}
                        columnId={columnId}
                        parentCardId={currentCard.id}
                        onClose={() => setShowCreateChildModal(false)}
                        onSuccess={async (_newCard) => {
                            setShowCreateChildModal(false);
                            try {
                                // 현재 카드를 다시 불러와서 새로 생성된 자식 카드를 포함시킴
                                const refreshedCard = await cardService.getCard(
                                    workspaceId,
                                    boardId,
                                    columnId,
                                    currentCard.id,
                                    true
                                );
                                setCurrentCard(refreshedCard);
                                // 카드 목록도 새로고침하여 childCount 업데이트
                                await loadCards(workspaceId, boardId, columnId);
                            } catch (err) {
                                console.error('Failed to refresh card after child creation:', err);
                                setError(err instanceof Error ? err.message : '카드 정보를 새로고침하는데 실패했습니다');
                            }
                        }}
                    />
                )}

                {/* 아카이브 확인 모달 */}
                {showArchiveConfirm && (
                    <ConfirmModal
                        isOpen={showArchiveConfirm}
                        message={t('card:editModal.archiveConfirm', {
                            defaultValue:
                                "이 카드를 아카이브하시겠습니까?&#10;아카이브된 카드는 '아카이브된 카드 보기'에서 복구할 수 있습니다.",
                        })}
                        onConfirm={() => {
                            setShowArchiveConfirm(false);
                            handleArchiveCard();
                        }}
                        onCancel={() => setShowArchiveConfirm(false)}
                        confirmText={t('card:editModal.archive', { defaultValue: '아카이브' })}
                        cancelText={t('common:button.cancel')}
                        isDestructive={true}
                    />
                )}

                {/* 에러 알림 (모달 내부 표시) */}
                {error && <ErrorNotification message={error} onClose={() => setError(null)} duration={5000} />}
            </div>
        </div>,
        document.body
    );
};
