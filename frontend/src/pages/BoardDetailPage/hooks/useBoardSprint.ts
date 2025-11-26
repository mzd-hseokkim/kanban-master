import { useSprint } from '@/context/SprintContext';
import { boardService } from '@/services/boardService';
import type { Board } from '@/types/board';
import { useCallback, useState } from 'react';

export const useBoardSprint = (
  hasValidNumericIds: boolean,
  workspaceNumericId: number,
  boardNumericId: number,
  board: Board | null,
  updateBoardLocally: ((updatedBoard: Board) => void) | undefined,
  alert: (message: string) => Promise<void>
) => {
  const { createSprint } = useSprint();
  const [sprintRefreshTrigger, setSprintRefreshTrigger] = useState(0);

  const handleEnableSprint = useCallback(async () => {
    if (!hasValidNumericIds || !board) return;

    try {
      // Optimistic update - update UI immediately
      updateBoardLocally?.({ ...board, mode: 'SPRINT' });

      // Then sync with server in background
      const updatedBoard = await boardService.enableSprint(workspaceNumericId, boardNumericId);
      console.log('Sprint activated successfully:', updatedBoard);

      // Update with server response to ensure consistency
      updateBoardLocally?.(updatedBoard);
    } catch (error) {
      console.error('Sprint activation error:', error);
      // Rollback on error
      updateBoardLocally?.(board);
      await alert(`Sprint 활성화에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      throw error; // Propagate to prevent modal opening
    }
  }, [hasValidNumericIds, workspaceNumericId, boardNumericId, alert, board, updateBoardLocally]);

  const handleCreateSprint = useCallback(async (data: any) => {
    if (!hasValidNumericIds) return;

    try {
      await createSprint(boardNumericId, data);
      await alert('Sprint가 생성되었습니다!');
    } catch (error) {
      throw error; // Propagate to modal
    }
  }, [hasValidNumericIds, boardNumericId, createSprint, alert]);

  return {
    sprintRefreshTrigger,
    setSprintRefreshTrigger,
    handleEnableSprint,
    handleCreateSprint,
  };
};
