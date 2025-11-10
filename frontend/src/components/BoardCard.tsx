import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '@/types/board';
import { useBoard } from '@/context/BoardContext';
import { BoardActionsMenu } from './BoardActionsMenu';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
  modalOverlayClass,
  modalPanelClass,
  modalSecondaryButtonClass,
  modalPrimaryButtonClass,
} from '@/styles/modalStyles';

interface BoardCardProps {
  board: Board;
  workspaceId: number;
}

interface DeleteBoardConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteBoardConfirmModal = ({ onCancel, onConfirm }: DeleteBoardConfirmModalProps) => {
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
      <div
        className={modalPanelClass({ stage, maxWidth: 'max-w-sm' })}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-pastel-blue-900 mb-2">보드를 삭제하시겠어요?</h2>
        <p className="text-pastel-blue-600 mb-6 text-sm">30일 이내에 복구할 수 있습니다.</p>
        <div className="flex gap-3">
          <button
            onClick={close}
            disabled={loading}
            className={`flex-1 ${modalSecondaryButtonClass}`}
          >
            취소
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pastel-pink-400 to-pastel-pink-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50 shadow-glass-sm"
          >
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const BoardCard = ({ board, workspaceId }: BoardCardProps) => {
  const navigate = useNavigate();
  const { deleteBoard } = useBoard();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    if ((e.target as HTMLElement).closest('.menu-button')) {
      return;
    }
    navigate(`/boards/${workspaceId}/${board.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="glass rounded-xl p-6 shadow-glass hover:shadow-glass-lg hover:scale-105 transition border border-pastel-blue-200 cursor-pointer relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-pastel-blue-900">
              {board.name}
            </h3>
          </div>
          {board.description && (
            <p className="text-sm text-pastel-blue-600 line-clamp-2">
              {board.description}
            </p>
          )}
        </div>
        <div className="relative menu-button" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 hover:bg-pastel-blue-200 rounded-full transition"
          >
            ...
          </button>
          {showMenu && (
            <BoardActionsMenu
              board={board}
              workspaceId={workspaceId}
              onClose={() => setShowMenu(false)}
              onDeleteClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-pastel-blue-500">
        <span>{board.ownerName}</span>
        <span>{formattedDate}</span>
      </div>

      {showDeleteConfirm && (
        <DeleteBoardConfirmModal
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
