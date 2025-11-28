import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { usePresenceTransition } from '@/hooks/usePresenceTransition';
import { notificationService } from '@/services/notificationService';
import { watchService } from '@/services/watchService';
import type { BoardMember } from '@/types/member';
import type { InboxItem } from '@/types/notification';
import type { WatchedCard } from '@/types/watch';
import React, { useEffect, useRef, useState } from 'react';
import { HiClipboardList, HiEye, HiInbox, HiShieldCheck, HiViewGrid } from 'react-icons/hi';
import { useLocation, useNavigate } from 'react-router-dom';
import { DidYouKnowModal } from './DidYouKnowModal';
import { InvitationResponseModal } from './InvitationResponseModal';
import { SettingsModal } from './SettingsModal';
import { Avatar } from './common/Avatar';

// NavButton 컴포넌트
interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-lg
            font-semibold text-sm
            transition-all duration-300
            ${isActive
                ? 'text-blue-400 bg-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }
        `}
    >
        {icon}
        <span>{label}</span>
    </button>
);

interface Toast {
    id: number;
    notificationId: string;
    message: string;
    type: string;
    actionUrl?: string;
}

const ToastMessage: React.FC<{ toast: Toast; onClose: () => void; onClick: () => void }> = ({ toast, onClose, onClick }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className="fixed top-20 right-4 z-[60] animate-slide-in-right cursor-pointer"
            onClick={onClick}
        >
            <div className="bg-slate-800/90 backdrop-blur-md border border-white/10 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md hover:bg-slate-800 transition-colors">
                <div className="flex-shrink-0 text-2xl">
                    {toast.type === 'INVITATION' ? '💌' : '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{toast.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">지금 확인하기</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export const GlobalNavBar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [showMenu, setShowMenu] = React.useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
    const [loadingInbox, setLoadingInbox] = useState(false);
    const [showWatchList, setShowWatchList] = useState(false);
    const [watchedCards, setWatchedCards] = useState<WatchedCard[]>([]);
    const [loadingWatchList, setLoadingWatchList] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState<BoardMember | null>(null);
    const [showInvitationModal, setShowInvitationModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showDidYouKnowModal, setShowDidYouKnowModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const inboxRef = useRef<HTMLDivElement>(null);
    const watchListRef = useRef<HTMLDivElement>(null);
    const menuTransition = usePresenceTransition(showMenu, 220);
    const inboxTransition = usePresenceTransition(showInbox, 220);
    const watchListTransition = usePresenceTransition(showWatchList, 220);
    const { client, isConnected } = useWebSocket();

    const [toast, setToast] = useState<Toast | null>(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleHome = () => {
        navigate('/');
    };

    const handleBoards = () => {
        navigate('/boards');
    };

    // Shift+T : Open Did You Know Modal
    useKeyboardShortcut('shift+t', (e: KeyboardEvent) => {
        e.preventDefault();
        setShowDidYouKnowModal(true);
    }, { preventDefault: true });

    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadInbox = async () => {
        try {
            setLoadingInbox(true);
            const items = await notificationService.getInbox();
            console.log('Loaded inbox items:', items.map(i => ({ id: i.id, isRead: i.isRead, type: i.type })));
            setInboxItems(items);
        } catch (error) {
            console.error('Failed to load inbox:', error);
        } finally {
            setLoadingInbox(false);
        }
    };

    const handleInboxClick = async () => {
        if (!showInbox) {
            await loadInbox();
        }
        setShowInbox(!showInbox);
    };

    const loadWatchList = async () => {
        try {
            setLoadingWatchList(true);
            const cards = await watchService.getWatchList();
            setWatchedCards(cards);
        } catch (error) {
            console.error('Failed to load watch list:', error);
        } finally {
            setLoadingWatchList(false);
        }
    };

    const handleWatchListClick = async () => {
        if (!showWatchList) {
            await loadWatchList();
        }
        setShowWatchList(!showWatchList);
    };

    const handleWatchedCardClick = (watchedCard: WatchedCard) => {
        // 현재 보드 페이지에 있는지 확인
        const currentPath = location.pathname;
        const targetBoardPath = `/boards/${watchedCard.workspaceId}/${watchedCard.boardId}`;

        if (currentPath === targetBoardPath) {
            // 같은 보드에 있으면 URL 파라미터만 업데이트 (페이지 리로드 없이)
            navigate(`${targetBoardPath}?cardId=${watchedCard.card.id}&columnId=${watchedCard.columnId}`, { replace: true });
        } else {
            // 다른 보드로 이동
            navigate(`${targetBoardPath}?cardId=${watchedCard.card.id}&columnId=${watchedCard.columnId}`);
        }
        setShowWatchList(false);
    };

    const handleNotificationClick = async (item: InboxItem) => {
        if (item.type === 'INVITATION') {
            // Convert InboxItem to BoardMember for modal
            const invitation: BoardMember = {
                boardId: 0, // Not needed for modal display if payload has info
                userId: 0,
                userEmail: '',
                userName: '',
                role: 'MEMBER', // Default
                invitationStatus: 'PENDING',
                invitedAt: item.createdAt,
                boardName: item.payload?.boardName || '',
                invitationToken: item.payload?.invitationToken || '',
                invitedByName: item.payload?.invitedByName || '',
                ...item.payload
            } as any; // Type assertion for simplified conversion
            setSelectedInvitation(invitation);
            setShowInvitationModal(true);
        } else if (item.type === 'NOTIFICATION') {
            if (!item.isRead) {
                await notificationService.markAsRead(item.id);
                // Update local state to mark as read
                setInboxItems(prev => prev.map(i => i.id === item.id ? { ...i, isRead: true } : i));
            }
            if (item.actionUrl) {
                navigate(item.actionUrl);
                setShowInbox(false);
            }
        }
    };

    // 화면 로드 시 인박스 조회
    useEffect(() => {
        loadInbox();
    }, []);

    useEffect(() => {
        if (!client || !isConnected || !user) return;

        const subscription = client.subscribe('/user/queue/notifications', async (message) => {
            try {
                const event = JSON.parse(message.body);
                console.log('Received notification:', event);

                // BOARD_INVITATION 타입은 무시 (인박스 API에서 BoardMember로 이미 표시됨)
                if (event.type === 'BOARD_INVITATION') {
                    console.log('Skipping BOARD_INVITATION notification (already shown as invitation in inbox)');
                    // 인박스를 새로고침하여 새 초대를 표시
                    await loadInbox();
                    return;
                }

                // INVITATION_CANCELLED 타입은 인박스를 새로고침해서 취소된 초대를 제거
                if (event.type === 'INVITATION_CANCELLED') {
                    console.log('Invitation cancelled - refreshing inbox to remove cancelled invitation');
                    await loadInbox();
                    // 토스트는 표시
                    setToast({
                        id: Date.now(),
                        notificationId: `cancel-${Date.now()}`,
                        message: event.message,
                        type: 'INVITATION_CANCELLED',
                        actionUrl: undefined
                    });
                    return;
                }

                // Create new InboxItem from event
                const newItem: InboxItem = {
                    id: `notif-${event.id}`,
                    type: 'NOTIFICATION',
                    title: '알림',
                    message: event.message,
                    actionUrl: event.actionUrl,
                    createdAt: event.createdAt,
                    isRead: false,
                    payload: { type: event.type }
                };

                setInboxItems(prev => [newItem, ...prev]);

                // Show toast
                setToast({
                    id: Date.now(),
                    notificationId: newItem.id,
                    message: event.message,
                    type: event.type || 'NOTIFICATION',
                    actionUrl: event.actionUrl
                });
            } catch (error) {
                console.error('Failed to process notification:', error);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [client, isConnected, user]);

    // Watch list 초기 로드 및 이벤트 리스너 설정
    useEffect(() => {
        const fetchWatchList = async () => {
            if (user) {
                try {
                    const cards = await watchService.getWatchList();
                    setWatchedCards(cards);
                } catch (error) {
                    console.error('Failed to load watch list:', error);
                }
            }
        };

        fetchWatchList();

        // 다른 컴포넌트에서 watch 상태 변경 시 목록 갱신
        const handleWatchUpdate = () => {
            fetchWatchList();
        };

        window.addEventListener('watch-updated', handleWatchUpdate);

        return () => {
            window.removeEventListener('watch-updated', handleWatchUpdate);
        };
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
            if (inboxRef.current && !inboxRef.current.contains(event.target as Node)) {
                setShowInbox(false);
            }
            if (watchListRef.current && !watchListRef.current.contains(event.target as Node)) {
                setShowWatchList(false);
            }
        };

        if (showMenu || showInbox || showWatchList) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showMenu, showInbox, showWatchList]);

    const renderWatchListContent = () => {
        if (loadingWatchList) {
            return (
                <div className="px-4 py-8 flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            );
        }

        if (watchedCards.length === 0) {
            return (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    관심 카드가 없습니다
                </div>
            );
        }

        return (
            <div className="max-h-80 overflow-y-auto">
                {watchedCards.map((watchedCard) => (
                    <div
                        key={watchedCard.watchId}
                        className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                        onClick={() => handleWatchedCardClick(watchedCard)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <HiEye className="text-xl text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {watchedCard.card.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {watchedCard.boardName} • {watchedCard.columnName}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    {new Date(watchedCard.watchedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderInboxContent = () => {
        if (loadingInbox) {
            return (
                <div className="px-4 py-8 flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            );
        }

        if (inboxItems.length === 0) {
            return (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    새로운 알림이 없습니다
                </div>
            );
        }

        return (
            <div className="max-h-80 overflow-y-auto">
                {inboxItems.map((item) => (
                    <div
                        key={item.id}
                        className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!item.isRead ? 'bg-blue-500/10' : ''}`}
                        onClick={() => handleNotificationClick(item)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                {item.type === 'INVITATION' ? '💌' : '🔔'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {item.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                    {item.message}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    {new Date(item.createdAt).toLocaleString()}
                                </p>
                            </div>
                            {!item.isRead && (
                                <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-2" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <nav className="backdrop-blur-xl bg-slate-900/80 shadow-lg sticky top-0 z-[300] border-b border-white/5 transition-colors duration-300">
            <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* 좌측: 로고 + 네비게이션 탭 */}
                    <div className="flex items-center gap-6">
                        {/* 로고 */}
                        <button
                            onClick={handleHome}
                            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent hover:from-blue-300 hover:to-cyan-200 transition-all whitespace-nowrap"
                        >
                            Kanban Master
                        </button>

                        {/* 세로 구분선 + 네비게이션 탭 */}
                        {user && (
                            <>
                                <div className="h-8 w-px bg-white/10 hidden lg:block" />

                                <div className="hidden lg:flex items-center gap-2">
                                    <NavButton
                                        icon={<HiViewGrid className="text-xl" />}
                                        label="대시보드"
                                        onClick={handleHome}
                                        isActive={location.pathname === '/'}
                                    />
                                    <NavButton
                                        icon={<HiClipboardList className="text-xl" />}
                                        label="보드"
                                        onClick={handleBoards}
                                        isActive={location.pathname.startsWith('/boards')}
                                    />
                                    <NavButton
                                        icon={<HiShieldCheck className="text-xl" />}
                                        label="감사 로그"
                                        onClick={() => navigate('/audit-logs')}
                                        isActive={location.pathname.startsWith('/audit-logs')}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* 중앙: 통합 검색 영역 */}
                    <div className="flex-1 max-w-2xl mx-4 hidden md:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="검색"
                                className="block w-full pl-10 pr-3 py-2.5 rounded-lg !bg-white/90 !text-slate-900 !placeholder-slate-500 border border-white/20 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 !focus:bg-white shadow-lg shadow-black/20 transition-all duration-200"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                        const target = e.target as HTMLInputElement;
                                        if (target.value.trim()) {
                                            navigate(`/search?q=${encodeURIComponent(target.value.trim())}`);
                                            target.blur();
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* 우측: Inbox + Watch List + 유저 메뉴 */}
                    {user && (
                        <div className="flex items-center gap-3">
                            {/* Watch List Button */}
                            <div className="relative z-[310]" ref={watchListRef}>
                                <button
                                    onClick={handleWatchListClick}
                                    className="relative w-10 h-10 hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center group"
                                    title="관심 카드 목록"
                                >
                                    <HiEye className="text-2xl text-slate-300 group-hover:text-white transition-colors" />
                                    {watchedCards.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-cyan-500 text-white text-xs font-bold rounded-full shadow-sm ring-2 ring-slate-900">
                                            {watchedCards.length}
                                        </span>
                                    )}
                                </button>

                                {/* Watch List Dropdown */}
                                {watchListTransition.shouldRender && (
                                    <div
                                        className={`dropdown-panel dropdown-panel-${watchListTransition.stage} absolute right-0 top-[calc(100%+0.5rem)] w-96 bg-slate-800 rounded-lg shadow-xl border border-white/10 text-slate-200 z-[320]`}
                                    >
                                        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                                            <p className="text-sm font-semibold text-white">관심 카드 목록</p>
                                        </div>

                                        {renderWatchListContent()}
                                    </div>
                                )}
                            </div>

                            {/* Inbox Button */}
                            <div className="relative z-[310]" ref={inboxRef}>
                                <button
                                    onClick={handleInboxClick}
                                    className="relative w-10 h-10 hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center group"
                                    title="알림함"
                                >
                                    <HiInbox className="text-2xl text-slate-300 group-hover:text-white transition-colors" />
                                    {inboxItems.filter(i => !i.isRead).length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full shadow-sm ring-2 ring-slate-900">
                                            {inboxItems.filter(i => !i.isRead).length}
                                        </span>
                                    )}
                                </button>

                                {/* Inbox Dropdown */}
                                {inboxTransition.shouldRender && (
                                    <div
                                        className={`dropdown-panel dropdown-panel-${inboxTransition.stage} absolute right-0 top-[calc(100%+0.5rem)] w-96 bg-slate-800 rounded-lg shadow-xl border border-white/10 text-slate-200 z-[320]`}
                                    >
                                        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                                            <p className="text-sm font-semibold text-white">알림함</p>
                                        </div>

                                        {renderInboxContent()}
                                    </div>
                                )}
                            </div>

                            {/* User Menu Button */}
                            <div className="relative z-[310]" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-all duration-200"
                                >
                                    <Avatar
                                        avatarUrl={user.avatarUrl}
                                        userName={user.name}
                                        size="md"
                                    />
                                    <span className="text-sm font-semibold text-slate-200 hidden sm:inline whitespace-nowrap">
                                        {user.name}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {menuTransition.shouldRender && (
                                    <div
                                        className={`dropdown-panel dropdown-panel-${menuTransition.stage} absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-white/10 py-1 text-slate-200 z-[320]`}
                                    >
                                        <div className="px-4 py-2 border-b border-white/10">
                                            <p className="text-xs text-slate-400">로그인 정보</p>
                                            <p className="text-sm font-semibold text-white truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleHome();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition md:hidden"
                                        >
                                            대시보드
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleBoards();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition md:hidden"
                                        >
                                            보드
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                setShowSettingsModal(true);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition border-t border-white/10"
                                        >
                                            프로필 설정
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleLogout();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition border-t border-white/10"
                                        >
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Invitation Response Modal */}
            <InvitationResponseModal
                invitation={selectedInvitation}
                isOpen={showInvitationModal}
                onClose={() => {
                    setShowInvitationModal(false);
                    setSelectedInvitation(null);
                    setShowInbox(false);
                }}
                onSuccess={() => {
                    loadInbox();
                }}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                onOpenDidYouKnow={() => {
                    setShowDidYouKnowModal(true);
                    setShowSettingsModal(false);
                }}
            />

            {/* Did You Know Modal */}
            <DidYouKnowModal
                isOpen={showDidYouKnowModal}
                onClose={() => setShowDidYouKnowModal(false)}
            />

            {/* Toast Notification */}
            {toast && (
                <ToastMessage
                    toast={toast}
                    onClose={() => setToast(null)}
                    onClick={async () => {
                        // Mark as read
                        if (toast.notificationId) {
                            try {
                                await notificationService.markAsRead(toast.notificationId);
                                // Update local state to mark as read
                                setInboxItems(prev => prev.map(i => i.id === toast.notificationId ? { ...i, isRead: true } : i));
                            } catch (error) {
                                console.error('Failed to mark notification as read:', error);
                            }
                        }
                        // Navigate
                        if (toast.actionUrl) {
                            navigate(toast.actionUrl);
                            setToast(null);
                        }
                    }}
                />
            )}
        </nav>
    );
};
