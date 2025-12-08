import { useModalAnimation } from '@/hooks/useModalAnimation';
import cardService from '@/services/cardService';
import { modalOverlayClass, modalPanelClass } from '@/styles/modalStyles';
import { Card } from '@/types/card';
import { useEffect, useState } from 'react';
import { HiRefresh, HiTrash } from 'react-icons/hi';
import { MdArchive } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

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
    const { t, i18n } = useTranslation(['board', 'card', 'common']);
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';

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
            setError(t('board:archivePanel.loadFailed'));
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
            alert(t('board:archivePanel.restoreFailed'));
        }
    };

    const handlePermanentDelete = async (card: Card) => {
        if (!card.columnId) return;

        if (
            !window.confirm(
                t('board:archivePanel.confirmDelete', {
                    title: card.title,
                })
            )
        ) {
            return;
        }

        try {
            await cardService.permanentlyDeleteCard(workspaceId, boardId, card.columnId, card.id);
            await loadArchivedCards();
        } catch (err) {
            console.error('Failed to delete card:', err);
            alert(t('board:archivePanel.deleteFailed'));
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
            alert(t('board:archivePanel.bulkRestoreFailed'));
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
                t('board:archivePanel.confirmBulkDelete', { count: targets.length })
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
            alert(t('board:archivePanel.bulkDeleteFailed'));
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
                            {t('board:archivePanel.sectionLabel')}
                        </p>
                        <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1 flex items-center gap-2">
                            <MdArchive className="text-pastel-blue-500" />
                            {t('board:archivePanel.title')}
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
                            <p className="mt-4 text-pastel-blue-600">{t('common:action.loading')}</p>
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
                            <p className="text-gray-500">{t('board:archivePanel.empty')}</p>
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
                                                aria-label={t('board:archivePanel.selectCard', { title: card.title })}
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
                                                            {new Date(card.archivedAt).toLocaleDateString(locale)}
                                                        </span>
                                                    )}
                                                    {card.priority && (
                                                        <span className="px-2 py-0.5 rounded bg-pastel-blue-100 text-pastel-blue-700 font-medium">
                                                            {t(`card:priority.${card.priority.toLowerCase()}`, { defaultValue: card.priority })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleUnarchive(card)}
                                                        className="flex-1 px-2 py-1.5 rounded-lg bg-pastel-green-100 text-pastel-green-700 hover:bg-pastel-green-200 transition flex items-center justify-center gap-1 text-xs font-medium"
                                                        title={t('board:archivePanel.restore')}
                                                    >
                                                        <HiRefresh className="text-sm" />
                                                        {t('board:archivePanel.restore')}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(card)}
                                                        className="flex-1 px-2 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition flex items-center justify-center gap-1 text-xs font-medium"
                                                        title={t('common:button.delete')}
                                                    >
                                                        <HiTrash className="text-sm" />
                                                        {t('common:button.delete')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                ))}
                            </div>

                            {hasSelection && (
                                <div className="sticky bottom-0 left-0 right-0 border border-white/50 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-4 flex items-center justify-between">
                                    <div className="text-sm text-pastel-blue-900 font-semibold">
                                        {t('board:archivePanel.selectedCount', { count: selectedCardIds.size })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleBulkUnarchive}
                                            className="px-4 py-2 rounded-lg bg-pastel-green-500 text-white hover:bg-pastel-green-600 transition font-medium text-sm"
                                            disabled={loading}
                                        >
                                            {t('board:archivePanel.bulkRestore')}
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-medium text-sm"
                                            disabled={loading}
                                        >
                                            {t('board:archivePanel.bulkDelete')}
                                        </button>
                                        <button
                                            onClick={clearSelection}
                                            className="px-3 py-2 rounded-lg border border-pastel-blue-300 text-pastel-blue-700 hover:bg-white transition text-sm"
                                        >
                                            {t('board:archivePanel.clearSelection')}
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
