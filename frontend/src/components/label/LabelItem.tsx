import type { Label } from '@/types/label';

interface ColorToken {
  value: string;
  label: string;
  color: string;
}

interface LabelItemProps {
  label: Label;
  colorTokens: ColorToken[];
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 라벨 아이템 컴포넌트
 * 개별 라벨 표시 및 수정/삭제 버튼
 */
export const LabelItem = ({
  label,
  colorTokens,
  onEdit,
  onDelete,
}: LabelItemProps) => {
  const colorToken = colorTokens.find((c) => c.value === label.colorToken);
  const bgColor = colorToken?.color || '#8fb3ff';

  return (
    <div className="glass-light rounded-xl p-4 border border-white/30 flex items-center justify-between">
      <div className="flex items-center space-x-3 flex-1">
        <div
          className="w-12 h-8 rounded-lg border-2 border-white/50 shadow-sm"
          style={{ backgroundColor: bgColor }}
        ></div>
        <div className="flex-1">
          <div className="font-semibold text-pastel-blue-900">{label.name}</div>
          {label.description && (
            <div className="text-sm text-pastel-blue-600 mt-1">
              {label.description}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-pastel-blue-700 hover:bg-pastel-blue-100/50 transition"
        >
          수정
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-pastel-pink-700 hover:bg-pastel-pink-100/50 transition"
        >
          삭제
        </button>
      </div>
    </div>
  );
};
