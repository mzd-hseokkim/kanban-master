import React, { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axios';
import { avatarCache } from '@/utils/avatarCache';

export interface AvatarProps {
  avatarUrl?: string | null;
  userName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',  // 20px - 리스트 뷰
  sm: 'w-7 h-7 text-xs',      // 28px - 카드
  md: 'w-10 h-10 text-sm',    // 40px - GlobalNavBar
  lg: 'w-20 h-20 text-lg',    // 80px - 사용자 검색
  xl: 'w-30 h-30 text-2xl',   // 120px - 프로필 설정
};

/**
 * 재사용 가능한 아바타 컴포넌트
 * - 프로필 사진이 있으면 이미지 표시 (인증된 요청으로 가져와서 blob URL로 변환)
 * - 프로필 사진이 없으면 그라데이션 배경 + 이름 첫 글자
 * - 이미지 로딩 실패 시 자동 fallback
 * - 동일한 URL에 대해 캐싱하여 중복 fetch 방지
 */
export const Avatar: React.FC<AvatarProps> = ({
  avatarUrl,
  userName,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // avatarUrl이 없거나 이미 blob URL인 경우 스킵
    if (!avatarUrl || avatarUrl.startsWith('blob:')) {
      setBlobUrl(null);
      setImageError(false);
      return;
    }

    // 캐시 확인
    const cachedBlobUrl = avatarCache.get(avatarUrl);
    if (cachedBlobUrl) {
      setBlobUrl(cachedBlobUrl);
      setImageError(false);
      return;
    }

    let isCancelled = false;
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        // Authorization 헤더를 포함해서 이미지 가져오기
        const response = await axiosInstance.get(avatarUrl, {
          responseType: 'blob',
        });

        if (!isCancelled) {
          // Blob을 Object URL로 변환
          objectUrl = URL.createObjectURL(response.data);
          setBlobUrl(objectUrl);
          setImageError(false);

          // 캐시에 저장
          avatarCache.set(avatarUrl, objectUrl);
        }
      } catch (error) {
        console.error('Failed to load avatar image:', error);
        if (!isCancelled) {
          setImageError(true);
        }
      }
    };

    fetchImage();

    // Cleanup: 컴포넌트 언마운트 시에는 blob URL 해제하지 않음 (캐시에서 관리)
    return () => {
      isCancelled = true;
    };
  }, [avatarUrl]);

  // 이미지가 없거나 로딩 실패 시 기본 아바타 표시
  if (!avatarUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-pastel-blue-400 to-pastel-purple-400 flex items-center justify-center text-white font-semibold flex-shrink-0`}
      >
        {userName.charAt(0).toUpperCase()}
      </div>
    );
  }

  // 이미지 로딩 중
  if (!blobUrl) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full bg-gray-200 animate-pulse flex-shrink-0`}
      />
    );
  }

  // 프로필 사진 표시
  return (
    <img
      src={blobUrl}
      alt={`${userName}의 프로필 사진`}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover flex-shrink-0`}
      onError={() => setImageError(true)}
    />
  );
};
