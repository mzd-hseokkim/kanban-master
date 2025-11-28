import { useModalAnimation } from '@/hooks/useModalAnimation';
import cardService from '@/services/cardService';
import { modalOverlayClass, modalPanelClass } from '@/styles/modalStyles';
import { Card } from '@/types/card';
import { useEffect, useState } from 'react';
import { HiRefresh, HiTrash } from 'react-icons/hi';
import { MdArchive } from 'react-icons/md';

interface ArchivedCardsPanelProps {
    workspaceId: number;
    boardId: number;
    onClose: () => void;
    onRestore: () => void;
}

export const ArchivedCardsPanel: React.FC<ArchivedCardsPanelProps> = ({
    workspaceId,
    boardId,
    onClose,
    onRestore,
}) => {
    const [archivedCards, setArchivedCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCardIds, setSelectedCardIds] = useState<Set<number>>(new Set());

    const { stage, close } = useModalAnimation(() => {
        onClose();
    });

    const loadArchivedCards = async () => {
        try {
            setLoading(true);
            setError(null);
            const cards = await cardService.getArchivedCards(workspaceId, boardId);
            setArchivedCards(cards);
        } catch (err) {
            console.error('Failed to load archived cards:', err);
            setError('아카이브된 카드를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchivedCards();
    }, [workspaceId, boardId]);

    const toggleSelection = (card: Card) => {
        setSelectedCardIds((prev) => {
            const next = new Set(prev);
            if (next.has(card.id)) {
                next.delete(card.id);
            } else {
                next.add(card.id);
            }
            return next;
        });
    };

    const clearSelection = () => setSelectedCardIds(new Set());

    const handleUnarchive = async (card: Card) => {
        if (!card.columnId) return;

        try {
            await cardService.unarchiveCard(workspaceId, boardId, card.columnId, card.id);
            await loadArchivedCards();
            onRestore();
            setSelectedCardIds((prev) => {
                if (!prev.has(card.id)) return prev;
                const next = new Set(prev);
                next.delete(card.id);
                return next;
            });
        } catch (err) {
            console.error('Failed to restore card:', err);
            alert('카드 복구에 실패했습니다');
        }
    };

    const handlePermanentDelete = async (card: Card) => {
        if (!card.columnId) return;

        if (!window.confirm(`"${card.title}" 카드를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            await cardService.permanentlyDeleteCard(workspaceId, boardId, card.columnId, card.id);
            await loadArchivedCards();
        } catch (err) {
            console.error('Failed to delete card:', err);
            alert('카드 삭제에 실패했습니다');
        }
    };

    const handleBulkUnarchive = async () => {
        if (!hasSelection) return;

        const targets = archivedCards.filter((card) => selectedCardIds.has(card.id));
        if (targets.length === 0) return;

        try {
            setLoading(true);
            await cardService.bulkUnarchiveCards(
                workspaceId,
                boardId,
                targets.map((card) => card.id)
            );
            clearSelection();
            await loadArchivedCards();
            onRestore();
        } catch (err) {
            console.error('Failed to bulk restore cards:', err);
            alert('일괄 복구에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!hasSelection) return;

        const targets = archivedCards.filter((card) => selectedCardIds.has(card.id));
        if (targets.length === 0) return;

        if (
            !window.confirm(
                `${targets.length}개의 카드를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            )
        ) {
            return;
        }

        try {
            setLoading(true);
            await cardService.bulkPermanentlyDeleteCards(
                workspaceId,
                boardId,
                targets.map((card) => card.id)
            );
            clearSelection();
            await loadArchivedCards();
        } catch (err) {
            console.error('Failed to bulk delete cards:', err);
            alert('일괄 삭제에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const isSelected = (cardId: number) => selectedCardIds.has(cardId);
    const hasSelection = selectedCardIds.size > 0;

    return (
        <div
            className={modalOverlayClass(stage)}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    close();
                }
            }}
        >
            <div className={`${modalPanelClass({ stage })} w-[56.25vw] max-w-none`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-pastel-blue-500 font-semibold">
                            Archive
                        </p>
                        <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1 flex items-center gap-2">
                            <MdArchive className="text-pastel-blue-500" />
                            아카이브된 카드
                        </h2>
                    </div>
                    <button
                        onClick={close}
                        className="w-10 h-10 rounded-full text-xl text-pastel-blue-500 hover:bg-white/40 transition flex items-center justify-center"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="h-[60vh] overflow-y-auto rounded-2xl border border-white/40 bg-white/30 backdrop-blur-sm p-6">
                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pastel-blue-500 border-r-transparent"></div>
                            <p className="mt-4 text-pastel-blue-600">로딩 중...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    {!loading && !error && archivedCards.length === 0 && (
                        <div className="text-center py-12">
                            <MdArchive className="text-6xl text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">아카이브된 카드가 없습니다</p>
                        </div>
                    )}

                    {!loading && !error && archivedCards.length > 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-3">
                                {archivedCards.map((card) => (
                                    <div
                                        key={card.id}
                                        className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-pastel-blue-200/60 p-3 hover:shadow-lg hover:border-pastel-blue-300 transition flex flex-col gap-2 relative h-full"
                                    >
                                        <div className="flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                checked={isSelected(card.id)}
                                                onChange={() => toggleSelection(card)}
                                                className="mt-0.5 h-4 w-4 rounded border-pastel-blue-300 text-pastel-blue-600 focus:ring-pastel-blue-400"
                                                aria-label={`${card.title} 선택`}
                                            />
                                            <h3 className="font-semibold text-pastel-blue-900 text-sm line-clamp-2 flex-1">
                                                {card.title}
                                            </h3>
                                        </div>
                                        {card.description ? (
                                            <p className="text-xs text-gray-600 line-clamp-2 flex-1">
                                                {card.description.replace(/<[^>]*>/g, '')}
                                            </p>
                                        ) : (
                                            <div className="flex-1" />
                                        )}
                                        <div className="space-y-2 mt-auto">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                {card.archivedAt && (
                                                    <span className="truncate">
                                                        {new Date(card.archivedAt).toLocaleDateString('ko-KR')}
                                                    </span>
                                                )}
                                                {card.priority && (
                                                    <span className="px-2 py-0.5 rounded bg-pastel-blue-100 text-pastel-blue-700 font-medium">
                                                        {card.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleUnarchive(card)}
                                                    className="flex-1 px-2 py-1.5 rounded-lg bg-pastel-green-100 text-pastel-green-700 hover:bg-pastel-green-200 transition flex items-center justify-center gap-1 text-xs font-medium"
                                                    title="복구"
                                                >
                                                    <HiRefresh className="text-sm" />
                                                    복구
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(card)}
                                                    className="flex-1 px-2 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition flex items-center justify-center gap-1 text-xs font-medium"
                                                    title="삭제"
                                                >
                                                    <HiTrash className="text-sm" />
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {hasSelection && (
                                <div className="sticky bottom-0 left-0 right-0 border border-white/50 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-4 flex items-center justify-between">
                                    <div className="text-sm text-pastel-blue-900 font-semibold">
                                        {selectedCardIds.size}개 선택됨
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleBulkUnarchive}
                                            className="px-4 py-2 rounded-lg bg-pastel-green-500 text-white hover:bg-pastel-green-600 transition font-medium text-sm"
                                            disabled={loading}
                                        >
                                            선택 항목 일괄 복구
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-medium text-sm"
                                            disabled={loading}
                                        >
                                            선택 항목 일괄 삭제
                                        </button>
                                        <button
                                            onClick={clearSelection}
                                            className="px-3 py-2 rounded-lg border border-pastel-blue-300 text-pastel-blue-700 hover:bg-white transition text-sm"
                                        >
                                            선택 해제
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
