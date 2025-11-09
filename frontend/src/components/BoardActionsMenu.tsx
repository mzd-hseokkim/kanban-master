import { useState } from 'react';
import { Board } from '@/types/board';
import { useBoard } from '@/context/BoardContext';

interface BoardActionsMenuProps {
  board: Board;
  workspaceId: number;
  onClose: () => void;
  onDeleteClick: () => void;
}

export const BoardActionsMenu = ({
  board,
  workspaceId,
  onClose,
  onDeleteClick,
}: BoardActionsMenuProps) => {
  const { archiveBoard } = useBoard();
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    try {
      setLoading(true);
      await archiveBoard(workspaceId, board.id);
      onClose();
    } catch (err) {
      console.error('Failed to archive board:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-48 glass-light rounded-xl shadow-glass-lg z-50 border border-white/30 py-1">
      <button
        onClick={() => {
          onClose();
        }}
        disabled={loading}
        className="w-full text-left px-4 py-2 text-sm text-pastel-blue-700 hover:bg-white/30 transition disabled:opacity-50"
      >
        ✏️ Edit
      </button>
      <button
        onClick={handleArchive}
        disabled={loading}
        className="w-full text-left px-4 py-2 text-sm text-pastel-blue-700 hover:bg-white/30 transition disabled:opacity-50"
      >
        📦 {board.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
      </button>
      <button
        onClick={() => {
          onClose();
          onDeleteClick();
        }}
        disabled={loading}
        className="w-full text-left px-4 py-2 text-sm text-pastel-pink-600 hover:bg-white/30 transition disabled:opacity-50 border-t border-white/20"
      >
        🗑️ Delete
      </button>
    </div>
  );
};
