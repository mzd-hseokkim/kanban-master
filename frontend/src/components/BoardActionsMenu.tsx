import { useState } from 'react';
import { Board } from '@/types/board';
import { useBoard } from '@/context/BoardContext';
import { HiPencil, HiArchive, HiDocumentDuplicate, HiTrash } from 'react-icons/hi';

interface BoardActionsMenuProps {
  board: Board;
  workspaceId: number;
  onClose: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onSaveAsTemplateClick: () => void;
}

export const BoardActionsMenu = ({
  board,
  workspaceId,
  onClose,
  onEditClick,
  onDeleteClick,
  onSaveAsTemplateClick,
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
    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-glass-lg z-50 border border-pastel-blue-200 py-1">
      <button
        onClick={() => {
          onEditClick();
          onClose();
        }}
        disabled={loading}
        className="w-full text-left px-4 py-2 text-sm text-pastel-blue-700 hover:bg-pastel-blue-100 transition disabled:opacity-50 flex items-center gap-2"
      >
        <HiPencil className="text-base" />
        <span>Edit</span>
      </button>
      <button
        onClick={handleArchive}
        disabled={loading}
        className="w-full text-left px-4 py-2 text-sm text-pastel-blue-700 hover:bg-pastel-blue-100 transition disabled:opacity-50 flex items-center gap-2"
      >
        <HiArchive className="text-base" />
        <span>{board.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}</span>
      </button>
      <button
        onClick={() => {
          onClose();
          onSaveAsTemplateClick();
        }}
        disabled={loading}
        className="w-full text-left px-4 py-2 text-sm text-pastel-blue-700 hover:bg-pastel-blue-100 transition disabled:opacity-50 flex items-center gap-2"
      >
        <HiDocumentDuplicate className="text-base" />
        <span>템플릿으로 저장</span>
      </button>
      <button
        onClick={() => {
          onClose();
          onDeleteClick();
        }}
        disabled={loading}
        className="w-full text-left px-4 py-2 text-sm text-pastel-pink-600 hover:bg-pastel-pink-100 transition disabled:opacity-50 border-t border-pastel-blue-200 flex items-center gap-2"
      >
        <HiTrash className="text-base" />
        <span>Delete</span>
      </button>
    </div>
  );
};
