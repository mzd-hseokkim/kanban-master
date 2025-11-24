import { LabelSelector } from '@/components/label/LabelSelector';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
    modalOverlayClass,
    modalPanelClass,
} from '@/styles/modalStyles';

interface LabelSelectionModalProps {
  boardId: number;
  selectedLabelIds: number[];
  onChange: (labelIds: number[]) => void;
  onClose: () => void;
}

export const LabelSelectionModal = ({
  boardId,
  selectedLabelIds,
  onChange,
  onClose,
}: LabelSelectionModalProps) => {
  const { stage, close } = useModalAnimation(onClose);

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
        className={modalPanelClass({
          stage,
          maxWidth: 'max-w-md',
          scrollable: false,
        })}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">라벨 편집</h3>
          <button
            onClick={close}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <LabelSelector
            boardId={boardId}
            selectedLabelIds={selectedLabelIds}
            onChange={onChange}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={close}
            className="px-4 py-2 bg-pastel-blue-500 text-white rounded-lg hover:bg-pastel-blue-600 transition-colors font-medium"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};
