import { useDialog } from '@/context/DialogContext';
import attachmentService, { Attachment } from '@/services/attachmentService';
import { useEffect, useRef, useState } from 'react';
import { HiDocument, HiDownload, HiPaperClip, HiPlus, HiTrash } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

interface AttachmentSectionProps {
  cardId: number;
  workspaceId: number;
  boardId: number;
  columnId: number;
  canEdit: boolean;
}

const AttachmentThumbnail: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadThumbnail = async () => {
      if (attachment.contentType.startsWith('image/')) {
        try {
          setLoading(true);
          const blob = await attachmentService.downloadAttachment(attachment.id);
          const url = window.URL.createObjectURL(blob);
          setImageUrl(url);
        } catch (error) {
          console.error('Failed to load thumbnail:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
  }, [attachment.id, attachment.contentType]);

  if (!attachment.contentType.startsWith('image/')) {
    return (
      <div className="w-10 h-10 rounded-lg bg-pastel-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <HiDocument className="text-pastel-blue-500 text-xl" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-pastel-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
      {loading ? (
        <div className="w-4 h-4 border-2 border-pastel-blue-500 border-t-transparent rounded-full animate-spin" />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={attachment.originalFileName}
          className="w-full h-full object-cover"
        />
      ) : (
        <HiDocument className="text-pastel-blue-500 text-xl" />
      )}
    </div>
  );
};

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  cardId,
  workspaceId,
  boardId,
  columnId,
  canEdit,
}) => {
  const { alert, confirm } = useDialog();
  const { t } = useTranslation(['card', 'common']);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAttachments = async () => {
    try {
      const data = await attachmentService.getAttachments(workspaceId, boardId, columnId, cardId);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [cardId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (file: File) => {
    if (uploading) return;

    // 10MB 제한
    if (file.size > 10 * 1024 * 1024) {
      await alert(t('card:attachment.sizeLimit'));
      return;
    }

    try {
      setUploading(true);
      await attachmentService.uploadAttachment(workspaceId, boardId, columnId, cardId, file);
      await loadAttachments();
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      await alert(t('card:attachment.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!(await confirm(t('card:attachment.deleteConfirm'), { isDestructive: true, confirmText: t('common:button.delete'), cancelText: t('common:button.cancel') }))) return;

    try {
      await attachmentService.deleteAttachment(attachmentId);
      await loadAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      await alert(t('card:attachment.deleteFailed'));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-pastel-blue-900 flex items-center gap-2">
          <HiPaperClip className="text-pastel-blue-500" />
          {t('card:attachment.title')}
        </h3>
      </div>

      {/* 파일 목록 */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/40 hover:bg-white/60 transition group"
            >
              {/* 썸네일 또는 아이콘 */}
              <AttachmentThumbnail attachment={attachment} />

              {/* 파일 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-pastel-blue-900 truncate">
                  {attachment.originalFileName}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(attachment.createdAt).toLocaleDateString()} • {formatFileSize(attachment.fileSize)}
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={async () => {
                    try {
                      const blob = await attachmentService.downloadAttachment(attachment.id);
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = attachment.originalFileName;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error) {
                      console.error('Download failed:', error);
                      await alert(t('card:attachment.downloadFailed'));
                    }
                  }}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-pastel-blue-600 transition"
                  title={t('card:attachment.download')}
                >
                  <HiDownload className="text-lg" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-red-500 transition"
                    title={t('common:button.delete')}
                  >
                    <HiTrash className="text-lg" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 버튼 */}
      {canEdit && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-2 rounded-xl border-2 border-dashed border-pastel-blue-200 text-pastel-blue-500 hover:border-pastel-blue-400 hover:bg-pastel-blue-50/50 transition flex items-center justify-center gap-2 text-sm font-medium"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-pastel-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <HiPlus className="text-lg" />
            )}
            {uploading ? t('card:attachment.uploading') : t('card:attachment.addFile')}
          </button>
        </div>
      )}
    </div>
  );
};

// HiPlus 아이콘이 없어서 추가 import 필요할 수 있음
