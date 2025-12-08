import type { SprintCreateRequest } from '@/types/sprint';
import { useState } from 'react';
import { HiCalendar, HiX } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

interface CreateSprintModalProps {
  isOpen: boolean;
  boardId: number;
  onClose: () => void;
  onSubmit: (data: Omit<SprintCreateRequest, 'boardId'>) => Promise<void>;
}

export const CreateSprintModal = ({
  isOpen,
  boardId: _boardId,
  onClose,
  onSubmit,
}: CreateSprintModalProps) => {
  const { t } = useTranslation(['sprint', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    capacity: '',
    goalText: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert(t('sprint:create.nameRequired'));
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        name: formData.name,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        goalText: formData.goalText || undefined,
      });

      // Reset form
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        capacity: '',
        goalText: '',
      });
      onClose();
    } catch (error) {
      alert(t('sprint:create.failed'));
      console.error('Failed to create sprint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HiCalendar className="text-xl text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              {t('sprint:create.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            disabled={isLoading}
          >
            <HiX className="text-xl text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('sprint:create.nameLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('sprint:create.namePlaceholder')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('sprint:create.startLabel')}
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('sprint:create.endLabel')}
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('sprint:create.capacityLabel')}
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder={t('sprint:create.capacityPlaceholder')}
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('sprint:create.goalLabel')}
            </label>
            <textarea
              value={formData.goalText}
              onChange={(e) => setFormData({ ...formData, goalText: e.target.value })}
              placeholder={t('sprint:create.goalPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {t('common:button.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isLoading ? t('sprint:create.submitting') : t('sprint:create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
