import { useAuth } from '@/context/AuthContext';
import { useBoard } from '@/context/BoardContext';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { modalOverlayClass, modalPanelClass, modalSecondaryButtonClass } from '@/styles/modalStyles';
import { Board } from '@/types/board';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiDotsVertical } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { BoardActionsMenu } from './BoardActionsMenu';

interface BoardCardProps {
    board: Board;
    workspaceId: number;
    onSaveAsTemplate?: (board: Board) => void;
}

interface DeleteBoardConfirmModalProps {
    onCancel: () => void;
    onConfirm: () => Promise<void>;
}

const DeleteBoardConfirmModal = ({ onCancel, onConfirm }: DeleteBoardConfirmModalProps) => {
    const { t } = useTranslation(['board', 'common']);
    const { stage, close } = useModalAnimation(onCancel);
    const [loading, setLoading] = useState(false);

    const handleConfirmClick = async () => {
        try {
            setLoading(true);
            await onConfirm();
            close();
        } catch (err) {
            console.error('Failed to delete board:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={modalOverlayClass(stage)}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    close();
                }
            }}
        >
            <div className={modalPanelClass({ stage, maxWidth: 'max-w-sm' })} onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-pastel-blue-900 mb-2">{t('board:deleteConfirm.title')}</h2>
                <p className="text-pastel-blue-600 mb-6 text-sm">{t('board:deleteConfirm.subtitle')}</p>
                <div className="flex gap-3">
                    <button onClick={close} disabled={loading} className={`flex-1 ${modalSecondaryButtonClass}`}>
                        {t('common:button.cancel')}
                    </button>
                    <button
                        onClick={handleConfirmClick}
                        disabled={loading}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pastel-pink-400 to-pastel-pink-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50 shadow-glass-sm"
                    >
                        {loading ? t('board:deleteConfirm.deleting') : t('board:deleteConfirm.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const BoardCard = ({ board, workspaceId, onSaveAsTemplate }: BoardCardProps) => {
    const { t } = useTranslation(['board', 'common']);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { deleteBoard } = useBoard();
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 현재 사용자가 보드의 소유자인지 확인
    const isOwner = user?.id === board.ownerId;

    const handleDelete = async () => {
        try {
            await deleteBoard(workspaceId, board.id);
        } catch (err) {
            console.error('Failed to delete board:', err);
            throw err;
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showMenu]);

    const formattedDate = new Date(board.updatedAt).toLocaleDateString('ko-KR');

    const handleCardClick = (e: React.MouseEvent) => {
        // 메뉴나 삭제 버튼 클릭 시 네비게이션 무시
        if ((e.target as HTMLElement).closest('.menu-button, .delete-button')) {
            return;
        }
        navigate(`/boards/${workspaceId}/${board.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="glass rounded-xl p-6 shadow-glass hover:shadow-glass-lg hover:scale-105 transition border border-pastel-blue-200 cursor-pointer relative"
        >
            {/* 우측 상단 메뉴 버튼 */}
            <div className="absolute top-6 right-6 flex items-center gap-1">
                <div className="relative menu-button" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-2 hover:bg-pastel-blue-200 rounded-full transition"
                    >
                        <HiDotsVertical className="text-pastel-blue-600 text-xl" />
                    </button>
                    {showMenu && (
                        <BoardActionsMenu
                            board={board}
                            workspaceId={workspaceId}
                            onClose={() => setShowMenu(false)}
                            onDeleteClick={() => {
                                setShowMenu(false);
                                setShowDeleteConfirm(true);
                            }}
                            onSaveAsTemplateClick={() => {
                                setShowMenu(false);
                                onSaveAsTemplate?.(board);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* 보드 정보 */}
            <div className="mb-4 pr-20">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-pastel-blue-900">{board.name}</h3>
                </div>
                {board.description && <p className="text-sm text-pastel-blue-600 line-clamp-2">{board.description}</p>}
            </div>

            <div className="flex items-center justify-between text-xs text-pastel-blue-500">
                <span>{board.ownerName}</span>
                <span>{formattedDate}</span>
            </div>

            {showDeleteConfirm && (
                <DeleteBoardConfirmModal onCancel={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} />
            )}
        </div>
    );
};
