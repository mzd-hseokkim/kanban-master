import React, { useState, useRef } from 'react';
import { Avatar } from './common/Avatar';
import { userService } from '@/services/userService';

export interface ProfilePhotoUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onUploadSuccess: (newAvatarUrl: string) => void;
  onDeleteSuccess: () => void;
}

/**
 * 프로필 사진 업로드/변경/삭제 컴포넌트
 */
export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentAvatarUrl,
  userName,
  onUploadSuccess,
  onDeleteSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 파일 검증
   */
  const validateFile = (file: File): string | null => {
    // 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return '파일 크기는 5MB 이하여야 합니다';
    }

    // 형식 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다 (jpg, png, gif, webp만 가능)';
    }

    return null;
  };

  /**
   * 파일 선택 핸들러
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 검증
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // 미리보기 생성
    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * 업로드 핸들러
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const newAvatarUrl = await userService.uploadAvatar(selectedFile);
      onUploadSuccess(newAvatarUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '파일 업로드에 실패했습니다';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 삭제 핸들러
   */
  const handleDelete = async () => {
    if (!confirm('프로필 사진을 삭제하시겠습니까?')) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await userService.deleteAvatar();
      onDeleteSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '프로필 사진 삭제에 실패했습니다';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 취소 핸들러
   */
  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 아바타 미리보기 */}
      <div className="flex flex-col items-center">
        <Avatar
          avatarUrl={previewUrl || currentAvatarUrl}
          userName={userName}
          size="xl"
          className="shadow-lg"
        />
        {selectedFile && (
          <p className="mt-2 text-xs text-pastel-blue-600">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="w-full max-w-md px-4 py-3 bg-pastel-pink-50 border border-pastel-pink-200 rounded-lg text-sm text-pastel-pink-700">
          ⚠️ {error}
        </div>
      )}

      {/* 파일 선택 버튼 */}
      {!selectedFile && (
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-2 bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-glass-sm"
          >
            {currentAvatarUrl ? '사진 변경' : '사진 업로드'}
          </button>

          {currentAvatarUrl && (
            <button
              onClick={handleDelete}
              disabled={isUploading}
              className="px-6 py-2 bg-pastel-pink-500 text-white rounded-lg hover:bg-pastel-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isUploading ? '삭제 중...' : '사진 삭제'}
            </button>
          )}
        </div>
      )}

      {/* 업로드/취소 버튼 */}
      {selectedFile && (
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-6 py-2 bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-glass-sm"
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </button>

          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="px-6 py-2 bg-white/30 hover:bg-white/40 backdrop-blur-sm text-pastel-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold border border-white/40"
          >
            취소
          </button>
        </div>
      )}

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
