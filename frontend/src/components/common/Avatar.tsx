import React, { useState } from 'react';

export interface AvatarProps {
  avatarUrl?: string | null;
  userName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',      // 28px - 카드
  md: 'w-10 h-10 text-sm',    // 40px - GlobalNavBar
  lg: 'w-20 h-20 text-lg',    // 80px - 사용자 검색
  xl: 'w-30 h-30 text-2xl',   // 120px - 프로필 설정
};

/**
 * 재사용 가능한 아바타 컴포넌트
 * - 프로필 사진이 있으면 이미지 표시
 * - 프로필 사진이 없으면 그라데이션 배경 + 이름 첫 글자
 * - 이미지 로딩 실패 시 자동 fallback
 */
export const Avatar: React.FC<AvatarProps> = ({
  avatarUrl,
  userName,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

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

  // 프로필 사진 표시
  return (
    <img
      src={avatarUrl}
      alt={`${userName}의 프로필 사진`}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover flex-shrink-0`}
      onError={() => setImageError(true)}
    />
  );
};
