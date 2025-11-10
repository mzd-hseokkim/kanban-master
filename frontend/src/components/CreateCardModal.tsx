import React, { useEffect, useRef, useState } from 'react';
import { useCard } from '@/context/CardContext';
import { ErrorNotification } from '@/components/ErrorNotification';
import { LabelSelector } from '@/components/label/LabelSelector';
import { labelService } from '@/services/labelService';
import { userService } from '@/services/userService';
import type { UserSearchResult } from '@/types/user';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
    modalOverlayClass,
    modalPanelClass,
    modalLabelClass,
    modalInputClass,
    modalTextareaClass,
    modalSelectClass,
    modalSecondaryButtonClass,
    modalPrimaryButtonClass,
    modalErrorClass,
    modalColorButtonClass,
} from '@/styles/modalStyles';

interface CreateCardModalProps {
    workspaceId: number;
    boardId: number;
    columnId: number;
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

export const CreateCardModal: React.FC<CreateCardModalProps> = ({ workspaceId, boardId, columnId, onClose }) => {
    const { createCard } = useCard();
    const { stage, close } = useModalAnimation(onClose);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedColor, setSelectedColor] = useState(cardColors[0].hex);
    const [priority, setPriority] = useState<string>('');
    const [dueDate, setDueDate] = useState('');
    const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [assigneeSearchInput, setAssigneeSearchInput] = useState('');
    const [assigneeResults, setAssigneeResults] = useState<UserSearchResult[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<UserSearchResult | null>(null);
    const [assigneeSearching, setAssigneeSearching] = useState(false);
    const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
    const assigneeInputRef = useRef<HTMLInputElement>(null);
    const assigneeInputContainerRef = useRef<HTMLDivElement>(null);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);
    const assigneeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const handleRemoveAssignee = () => {
        setSelectedAssignee(null);
        setAssigneeSearchInput('');
        setAssigneeResults([]);
        setAssigneeDropdownOpen(false);
    };

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

    useEffect(() => {
        return () => {
            if (assigneeDebounceRef.current) {
                clearTimeout(assigneeDebounceRef.current);
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('카드 제목을 입력해주세요');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const newCard = await createCard(workspaceId, boardId, columnId, {
                title: title.trim(),
                description: description.trim() || undefined,
                bgColor: selectedColor,
                priority: priority || undefined,
                assignee: selectedAssignee?.name,
                dueDate: dueDate || undefined,
            });

            // 라벨 할당 (선택된 라벨이 있을 경우)
            if (selectedLabelIds.length > 0 && newCard?.id) {
                await labelService.assignLabelsToCard(newCard.id, selectedLabelIds);
            }

            close();
        } catch (err) {
            const message = err instanceof Error ? err.message : '카드 생성에 실패했습니다';
            setError(message);
            console.error('Failed to create card:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className={modalOverlayClass(stage)}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        close();
                    }
                }}
            >
                <div className={modalPanelClass({ stage, maxWidth: 'max-w-lg' })}>
                    {/* 헤더 */}
                    <h2 className="text-2xl font-bold text-pastel-blue-900 mb-1">카드 생성</h2>
                    <p className="text-sm text-pastel-blue-600 mb-6">새로운 카드를 생성하세요</p>

                    <form onSubmit={handleSubmit}>
                        {/* 제목 입력 */}
                        <div className="mb-4">
                            <label className={modalLabelClass}>카드 제목 *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="예: 로그인 기능 구현"
                                className={modalInputClass}
                                disabled={loading}
                            />
                        </div>

                        {/* 설명 입력 */}
                        <div className="mb-4">
                            <label className={modalLabelClass}>설명</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="카드에 대한 설명을 입력하세요 (선택사항)"
                                className={modalTextareaClass}
                                rows={3}
                                disabled={loading}
                            />
                        </div>

                        {/* 우선순위 선택 */}
                        <div className="mb-4">
                            <label className={modalLabelClass}>우선순위</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className={modalSelectClass}
                                disabled={loading}
                            >
                                <option value="">우선순위 선택 (선택사항)</option>
                                {cardPriorities.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 담당자 입력 */}
                        <div className="mb-4">
                            <label className={modalLabelClass}>담당자</label>
                            <div className="relative">
                                <div
                                    ref={assigneeInputContainerRef}
                                    className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-xl border border-white/40 bg-white/40 backdrop-blur-sm focus-within:ring-2 focus-within:ring-pastel-blue-300/60"
                                >
                                    {selectedAssignee && (
                                        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/60 border border-white/40 text-pastel-blue-700 text-sm font-medium shadow-sm">
                                            <span>{selectedAssignee.name}</span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveAssignee}
                                                disabled={loading}
                                                className="text-pastel-blue-500 hover:text-pastel-blue-700 disabled:opacity-50"
                                                aria-label="담당자 제거"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                  <input
                    ref={assigneeInputRef}
                    type="text"
                    value={assigneeSearchInput}
                    onChange={handleAssigneeInputChange}
                    onFocus={() => assigneeResults.length > 0 && setAssigneeDropdownOpen(true)}
                    placeholder={selectedAssignee ? '' : '이름 또는 이메일로 검색 (선택사항)'}
                    className="borderless-input flex-1 min-w-0 bg-transparent text-pastel-blue-900 placeholder-pastel-blue-500 focus:outline-none"
                    disabled={loading}
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
                                                className="w-full px-4 py-2 text-left hover:bg-white/70 transition-colors border-b border-white/30 last:border-b-0"
                                            >
                                                <div className="font-medium text-pastel-blue-900">{user.name}</div>
                                                <div className="text-xs text-pastel-blue-500">{user.email}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {assigneeSearchInput && assigneeResults.length === 0 && !assigneeSearching && (
                                <p className="text-xs text-pastel-blue-500 mt-1">검색 결과가 없습니다</p>
                            )}
                        </div>

                        {/* 마감 날짜 입력 */}
                        <div className="mb-4">
                            <label className={modalLabelClass}>마감 날짜</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className={modalInputClass}
                                disabled={loading}
                            />
                        </div>

                        {/* 라벨 선택 */}
                        <div className="mb-6">
                            <label className={`${modalLabelClass} !mb-3`}>라벨</label>
                            <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/30 bg-white/30 p-3">
                                <LabelSelector
                                    boardId={boardId}
                                    selectedLabelIds={selectedLabelIds}
                                    onChange={setSelectedLabelIds}
                                />
                            </div>
                        </div>

                        {/* 색상 선택 */}
                        <div className="mb-6">
                            <label className={`${modalLabelClass} !mb-3`}>색상 선택</label>
                            <div className="grid grid-cols-5 gap-3">
                                {cardColors.map((color) => (
                                    <button
                                        key={color.hex}
                                        type="button"
                                        onClick={() => setSelectedColor(color.hex)}
                                        style={{ backgroundColor: color.hex }}
                                        className={`w-full h-12 ${modalColorButtonClass(selectedColor === color.hex)}`}
                                        title={color.label}
                                        disabled={loading}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {error && <div className={`mb-4 ${modalErrorClass}`}>{error}</div>}

                        {/* 버튼 */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={close}
                                disabled={loading}
                                className={`flex-1 ${modalSecondaryButtonClass}`}
                            >
                                취소
                            </button>
                            <button type="submit" disabled={loading} className={`flex-1 ${modalPrimaryButtonClass}`}>
                                {loading ? '생성 중...' : '생성'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 에러 알림 (모달 외부 표시) */}
            {error && <ErrorNotification message={error} onClose={() => setError(null)} duration={5000} />}
        </>
    );
};
