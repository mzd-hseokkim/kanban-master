import { useAuth } from '@/context/AuthContext';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { NotificationPreference, notificationService } from '@/services/notificationService';
import { modalOverlayClass, modalPanelClass } from '@/styles/modalStyles';
import React, { useEffect, useState } from 'react';
import { HiBell, HiX } from 'react-icons/hi';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { stage, close } = useModalAnimation(onClose);
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'notification'>('notification');
    const [preference, setPreference] = useState<NotificationPreference>({
        notifyDueDate: true,
        dueDateBeforeMinutes: 60
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPreference();
        }
    }, [isOpen]);

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
            // Show success toast (optional)
            close();
        } catch (error) {
            console.error('Failed to update notification preference:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen && stage !== 'exit') return null;

    return (
        <div className={modalOverlayClass(stage)}>
            <div className={`${modalPanelClass({ stage })} w-full max-w-md bg-slate-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <HiBell className="text-blue-400" />
                        설정
                    </h2>
                    <button
                        onClick={close}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <HiX className="text-xl" />
                    </button>
                </div>

                {/* Tabs (Currently only Notification is active for this task) */}
                <div className="flex border-b border-white/10">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'notification'
                                ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => setActiveTab('notification')}
                    >
                        알림 설정
                    </button>
                    {/* Add Profile tab later if needed */}
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
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
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-900/50 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={close}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};
