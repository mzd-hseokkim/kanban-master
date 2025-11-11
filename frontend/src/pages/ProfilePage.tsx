import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';

const ProfilePage: React.FC = () => {
  const { user, updateAvatar, removeAvatar } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="h-full bg-gradient-pastel flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-pastel-blue-900">프로필 설정</h1>
            <p className="text-sm text-pastel-blue-600 mt-2">
              프로필 사진과 개인 정보를 관리하세요
            </p>
          </div>

          {/* 프로필 사진 섹션 */}
          <section className="glass-light rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-pastel-blue-900 mb-6">프로필 사진</h2>
            <ProfilePhotoUpload
              currentAvatarUrl={user.avatarUrl}
              userName={user.name}
              onUploadSuccess={updateAvatar}
              onDeleteSuccess={removeAvatar}
            />
          </section>

          {/* 기본 정보 섹션 */}
          <section className="glass-light rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-pastel-blue-900 mb-6">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pastel-blue-700 mb-2">
                  이름
                </label>
                <div className="px-4 py-3 bg-pastel-blue-50 border border-pastel-blue-200 rounded-lg text-pastel-blue-900">
                  {user.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-pastel-blue-700 mb-2">
                  이메일
                </label>
                <div className="px-4 py-3 bg-pastel-blue-50 border border-pastel-blue-200 rounded-lg text-pastel-blue-900">
                  {user.email}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
