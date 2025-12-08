import { useDialog } from '@/context/DialogContext';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { templateService } from '@/services/templateService';
import {
    modalInputClass,
    modalLabelClass,
    modalOverlayClass,
    modalPanelClass,
    modalPrimaryButtonClass,
    modalSecondaryButtonClass,
} from '@/styles/modalStyles';
import type { ApplyTemplateRequest, BoardTemplate } from '@/types/template';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TemplateGalleryProps {
  workspaceId: number;
  onClose: () => void;
  onApply: (board: any) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  workspaceId,
  onClose,
  onApply,
}) => {
  const { t } = useTranslation(['board', 'common']);
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const { stage, close } = useModalAnimation(onClose);
  const { alert } = useDialog();

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, categoriesData] = await Promise.all([
        templateService.getTemplatesByWorkspace(workspaceId),
        templateService.getAllCategories(),
      ]);
      setTemplates(templatesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  const handleTemplateClick = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    setBoardName(t('board:template.copySuffix', { name: template.name, defaultValue: `${template.name} 복사본` }));
    setBoardDescription(template.description || '');
    setShowApplyModal(true);
  };

  const handleApply = async () => {
    if (!selectedTemplate || !boardName.trim()) return;

    try {
      setApplying(true);
      const request: ApplyTemplateRequest = {
        templateId: selectedTemplate.id,
        boardName: boardName.trim(),
        boardDescription: boardDescription.trim() || undefined,
      };
      const board = await templateService.applyTemplate(workspaceId, request);
      onApply(board);
      close();
    } catch (err) {
      console.error('Failed to apply template:', err);
      await alert(t('board:template.applyFailed'));
    } finally {
      setApplying(false);
    }
  };

  if (showApplyModal && selectedTemplate) {
    return (
      <div className={modalOverlayClass(stage)} onClick={(e) => e.target === e.currentTarget && setShowApplyModal(false)}>
        <div
          className={modalPanelClass({
            stage,
            maxWidth: 'max-w-lg',
            extra: 'bg-gradient-to-b from-white via-pastel-blue-50 to-white',
          })}
        >
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-pastel-blue-500 font-semibold">
              {t('board:template.applySection')}
            </p>
            <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">
              {t('board:template.applyTitle', { name: selectedTemplate.name })}
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className={modalLabelClass}>{t('board:template.boardName')}</label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className={modalInputClass}
                placeholder={t('board:template.boardNamePlaceholder')}
              />
            </div>

            <div>
              <label className={modalLabelClass}>{t('board:template.boardDescription')}</label>
              <textarea
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                className={modalInputClass}
                rows={3}
                placeholder={t('board:template.boardDescriptionPlaceholder')}
              />
            </div>

            <div className="p-4 rounded-xl bg-pastel-blue-50 border border-pastel-blue-100">
              <p className="text-sm font-semibold text-pastel-blue-900 mb-2">
                {t('board:template.columnsIncluded', { count: selectedTemplate.columns.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.columns.map((col) => (
                  <span
                    key={col.id}
                    className="text-xs px-3 py-1.5 rounded-full bg-white text-pastel-blue-700 font-medium border border-pastel-blue-200"
                  >
                    {col.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowApplyModal(false)}
              className={modalSecondaryButtonClass}
              disabled={applying}
            >
              {t('common:button.cancel')}
            </button>
            <button
              onClick={handleApply}
              disabled={applying || !boardName.trim()}
              className={modalPrimaryButtonClass}
            >
              {applying ? t('board:template.applying') : t('board:template.apply')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={modalOverlayClass(stage)}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
        <div
          className={modalPanelClass({
            stage,
            maxWidth: 'max-w-6xl',
            padding: 'p-0',
          extra: 'max-h-[85vh] flex flex-col overflow-hidden bg-gradient-to-b from-pastel-blue-50 via-white to-pastel-blue-100/60',
        })}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/40 bg-gradient-to-r from-white via-pastel-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-pastel-blue-500 font-semibold">
                {t('board:template.gallerySection')}
              </p>
              <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">{t('board:template.galleryTitle')}</h2>
            </div>
            <button
              onClick={close}
              className="w-10 h-10 rounded-full hover:bg-pastel-blue-100 text-xl text-pastel-blue-600 transition flex items-center justify-center"
              aria-label={t('common:button.close')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="px-6 py-4 border-b border-white/30 bg-white/80 flex-shrink-0">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  selectedCategory === null
                    ? 'bg-pastel-blue-500 text-white shadow-sm'
                    : 'bg-white text-pastel-blue-600 border border-pastel-blue-200 hover:bg-pastel-blue-50'
                }`}
              >
                {t('board:template.categoryAll')}
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    selectedCategory === category
                      ? 'bg-pastel-blue-500 text-white shadow-sm'
                      : 'bg-white text-pastel-blue-600 border border-pastel-blue-200 hover:bg-pastel-blue-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin inline-block h-8 w-8 border-4 border-pastel-blue-500 border-t-transparent rounded-full" />
              <p className="text-pastel-blue-600 mt-4">{t('board:template.loading')}</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-pastel-blue-600">{t('board:template.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className="text-left rounded-2xl border border-pastel-blue-200 bg-white/90 shadow-sm hover:shadow-glass hover:border-pastel-blue-500 transition p-5 flex flex-col gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-pastel-blue-900">{template.name}</h3>
                      {template.isPublic && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pastel-green-100 text-pastel-green-700">
                          {t('board:template.public')}
                        </span>
                      )}
                    </div>
                    {template.category && (
                      <p className="text-xs text-pastel-blue-500 mb-2">📂 {template.category}</p>
                    )}
                    {template.description && (
                      <p className="text-sm text-pastel-blue-600 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-pastel-blue-100">
                    <span className="text-xs text-pastel-blue-500">
                      {t('board:template.columnCount', { count: template.columns.length })}
                    </span>
                    <span className="text-xs font-semibold text-pastel-blue-600">
                      {t('board:template.applyCta')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
