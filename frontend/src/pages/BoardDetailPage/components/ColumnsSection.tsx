import { ColumnCard } from '@/components/ColumnCard';
import type { Column } from '@/types/column';

type ColumnsSectionProps = {
  columns: Column[];
  columnsLoading: boolean;
  workspaceId: number;
  boardId: number;
  boardOwnerId: number;
  canEdit: boolean;
  onCreateColumn: () => void;
  autoOpenCardId: number | null;
  autoOpenColumnId: number | null;
  onAutoOpenHandled: () => void;
};

export const ColumnsSection = ({
  columns,
  columnsLoading,
  workspaceId,
  boardId,
  boardOwnerId,
  canEdit,
  onCreateColumn,
  autoOpenCardId,
  autoOpenColumnId,
  onAutoOpenHandled,
}: ColumnsSectionProps) => {
  if (columnsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue-600" />
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="glass rounded-2xl p-8 shadow-glass-lg text-center max-w-md">
          <p className="text-lg text-pastel-blue-600 mb-4">칼럼이 없습니다</p>
          <p className="text-sm text-pastel-blue-500 mb-6">
            {canEdit ? '첫 번째 칼럼을 만들어 시작하세요' : '아직 칼럼이 생성되지 않았습니다'}
          </p>
          {canEdit && (
            <button
              onClick={onCreateColumn}
              className="px-6 py-2 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
            >
              + 칼럼 생성
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto h-full">
      <div className="flex gap-4 pb-4 min-h-full h-full items-stretch">
        {columns
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((column) => {
            const shouldRespectColumnConstraint = autoOpenColumnId && autoOpenColumnId !== column.id;
            const cardIdForColumn = shouldRespectColumnConstraint ? null : autoOpenCardId;

            return (
              <ColumnCard
                key={column.id}
                column={column}
                workspaceId={workspaceId}
                boardId={boardId}
                boardOwnerId={boardOwnerId}
                canEdit={canEdit}
                autoOpenCardId={cardIdForColumn}
                onAutoOpenHandled={onAutoOpenHandled}
              />
            );
          })}

        {canEdit && (
          <button
            onClick={onCreateColumn}
            className="flex-shrink-0 w-80 min-h-28 rounded-2xl border-4 border-dashed border-white/70 bg-white/10 flex items-center justify-center text-pastel-blue-800 font-semibold text-base hover:bg-white/20 hover:border-black transition"
          >
            + 칼럼 추가
          </button>
        )}
      </div>
    </div>
  );
};
