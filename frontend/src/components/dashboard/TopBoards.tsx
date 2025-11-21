import { BoardOverdueSummary } from '@/types/dashboard';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TopBoardsProps {
  boards: BoardOverdueSummary[];
  workspaceId: number;
}

export const TopBoards: React.FC<TopBoardsProps> = ({ boards, workspaceId }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Boards with Most Overdue Cards</h3>
      <div className="space-y-3">
        {boards.map((board) => (
          <div
            key={board.boardId}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
            onClick={() => navigate(`/workspaces/${workspaceId}/boards/${board.boardId}`)}
          >
            <span className="font-medium text-gray-700">{board.boardName}</span>
            <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
              {board.overdue} Overdue
            </span>
          </div>
        ))}
        {boards.length === 0 && (
          <p className="text-gray-500 text-sm">No overdue cards in any board.</p>
        )}
      </div>
    </div>
  );
};
