
import { useAuth } from '@/context/AuthContext';
import { useDidYouKnowModal } from '@/hooks/useDidYouKnowModal';
import { usePresenceTransition } from '@/hooks/usePresenceTransition';
import { NotificationPreference, notificationService } from '@/services/notificationService';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiBell, HiLightBulb, HiUser, HiX } from 'react-icons/hi';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenDidYouKnow?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenDidYouKnow }) => {
    const { shouldRender, stage } = usePresenceTransition(isOpen, 320);
    const { user, updateAvatar, removeAvatar } = useAuth();
    const { toggleAutoShow, isAutoShowEnabled, lastShownTime } = useDidYouKnowModal();

    const [activeTab, setActiveTab] = useState<'profile' | 'notification' | 'tips'>('profile');
    const [preference, setPreference] = useState<NotificationPreference>({
        notifyDueDate: true,
        dueDateBeforeMinutes: 60
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && activeTab === 'notification') {
            loadPreference();
        }
    }, [isOpen, activeTab]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, onClose]);

    const loadPreference = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getMyPreference();
            setPreference(data);
        } catch (error) {
            console.error('Failed to load notification preference:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await notificationService.updateMyPreference(preference);
            onClose();
        } catch (error) {
            console.error('Failed to update notification preference:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!shouldRender || !user) return null;

    const modalContent = (
        <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-300 ${
                stage === 'enter' ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-2xl bg-slate-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 ${
                    stage === 'enter' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {activeTab === 'profile' ? (
                            <>
                                <HiUser className="text-blue-400" />
                                프로필 설정
                            </>
                        ) : activeTab === 'notification' ? (
                            <>
                                <HiBell className="text-blue-400" />
                                알림 설정
                            </>
                        ) : (
                            <>
                                <HiLightBulb className="text-yellow-400" />
                                팁 설정
                            </>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <HiX className="text-xl" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'profile'
                                ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <HiUser className="text-lg" />
                        프로필
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'notification'
                                ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => setActiveTab('notification')}
                    >
                        <HiBell className="text-lg" />
                        알림
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'tips'
                                ? 'text-yellow-400 border-b-2 border-yellow-400 bg-white/5'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => setActiveTab('tips')}
                    >
                        <HiLightBulb className="text-lg" />
                        팁
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'profile' ? (
                        <div className="space-y-6">
                            {/* 프로필 사진 섹션 */}
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-4">프로필 사진</h3>
                                <ProfilePhotoUpload
                                    currentAvatarUrl={user.avatarUrl}
                                    userName={user.name}
                                    onUploadSuccess={updateAvatar}
                                    onDeleteSuccess={removeAvatar}
                                />
                            </div>

                            {/* 기본 정보 섹션 */}
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-sm font-semibold text-white mb-4">기본 정보</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">
                                            이름
                                        </label>
                                        <div className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white">
                                            {user.name}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">
                                            이메일
                                        </label>
                                        <div className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'notification' ? (
                        loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Due Date Notification Toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-white block">
                                            마감일 알림
                                        </label>
                                        <p className="text-xs text-slate-400 mt-1">
                                            마감일이 임박했을 때 알림을 받습니다.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setPreference(prev => ({ ...prev, notifyDueDate: !prev.notifyDueDate }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                                            preference.notifyDueDate ? 'bg-blue-500' : 'bg-slate-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                preference.notifyDueDate ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Notification Time Select */}
                                {preference.notifyDueDate && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white block">
                                            알림 시점
                                        </label>
                                        <select
                                            value={preference.dueDateBeforeMinutes}
                                            onChange={(e) => setPreference(prev => ({ ...prev, dueDateBeforeMinutes: Number(e.target.value) }))}
                                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value={30}>30분 전</option>
                                            <option value={60}>1시간 전</option>
                                            <option value={120}>2시간 전</option>
                                            <option value={1440}>24시간 전 (1일 전)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="space-y-6">
                            {/* Auto Show Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-white block">
                                        로그인 시 Did You Know 팁 표시
                                    </label>
                                    <p className="text-xs text-slate-400 mt-1">
                                        로그인할 때마다 유용한 팁을 확인하세요.
                                    </p>
                                </div>
                                <button
                                    onClick={toggleAutoShow}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                                        isAutoShowEnabled ? 'bg-yellow-500' : 'bg-slate-600'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            isAutoShowEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* View Tips Button */}
                            <div className="pt-4 border-t border-white/10">
                                <button
                                    onClick={() => {
                                        if (onOpenDidYouKnow) {
                                            onOpenDidYouKnow();
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/20"
                                >
                                    <HiLightBulb className="text-xl" />
                                    💡 팁 다시 보기
                                </button>
                            </div>

                            {/* Last Shown Time */}
                            {lastShownTime && (
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-xs text-slate-400">
                                        마지막 표시: {lastShownTime}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-900/50 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {activeTab === 'profile' ? '닫기' : '취소'}
                    </button>
                    {activeTab === 'notification' && (
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? '저장 중...' : '저장'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
