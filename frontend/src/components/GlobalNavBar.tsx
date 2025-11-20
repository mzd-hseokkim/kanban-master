import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { usePresenceTransition } from '@/hooks/usePresenceTransition';
import { notificationService } from '@/services/notificationService';
import { watchService } from '@/services/watchService';
import type { BoardMember } from '@/types/member';
import type { InboxItem } from '@/types/notification';
import type { WatchedCard } from '@/types/watch';
import React, { useEffect, useRef, useState } from 'react';
import { HiClipboardList, HiEye, HiInbox, HiViewGrid } from 'react-icons/hi';
import { useLocation, useNavigate } from 'react-router-dom';
import { InvitationResponseModal } from './InvitationResponseModal';
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
                ? 'text-pastel-blue-900 border-b-2 border-pastel-blue-500'
                : 'text-pastel-blue-600 hover:text-pastel-blue-900'
            }
        `}
    >
        {icon}
        <span>{label}</span>
    </button>
);

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
    const menuRef = useRef<HTMLDivElement>(null);
    const inboxRef = useRef<HTMLDivElement>(null);
    const watchListRef = useRef<HTMLDivElement>(null);
    const menuTransition = usePresenceTransition(showMenu, 220);
    const inboxTransition = usePresenceTransition(showInbox, 220);
    const watchListTransition = usePresenceTransition(showWatchList, 220);
    const { client, isConnected } = useWebSocket();

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

        const subscription = client.subscribe('/user/queue/notifications', (message) => {
            try {
                const event = JSON.parse(message.body);
                console.log('Received notification:', event);

                // Create new InboxItem from event
                const newItem: InboxItem = {
                    id: `notif-${event.id}`,
                    type: 'NOTIFICATION', // Currently only handling notifications via WS
                    title: '알림', // You might want to make this dynamic based on event type
                    message: event.message,
                    actionUrl: event.actionUrl,
                    createdAt: event.createdAt, // Ensure this matches format
                    isRead: false,
                    payload: { type: event.type }
                };

                setInboxItems(prev => [newItem, ...prev]);

                // Optional: Show toast or visual cue
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

    return (
        <nav className="backdrop-blur-xl bg-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] sticky top-0 z-50 border-b border-white/40">
            <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* 좌측: 로고 + 네비게이션 탭 */}
                    <div className="flex items-center gap-6">
                        {/* 로고 */}
                        <button
                            onClick={handleHome}
                            className="text-2xl font-bold bg-gradient-to-r from-pastel-blue-700 to-pastel-cyan-600 bg-clip-text text-transparent hover:from-pastel-blue-800 hover:to-pastel-cyan-700 transition-all"
                        >
                            Kanban Master
                        </button>

                        {/* 세로 구분선 + 네비게이션 탭 */}
                        {user && (
                            <>
                                <div className="h-8 w-px bg-white/30 hidden lg:block" />

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
                                </div>
                            </>
                        )}
                    </div>

                    {/* 중앙: 통합 검색 영역 (향후 추가 예정) */}
                    <div className="flex-1 max-w-2xl mx-4 hidden md:block">
                        {/* 통합 검색창은 향후 추가 예정 */}
                    </div>

                    {/* 우측: Inbox + Watch List + 유저 메뉴 */}
                    {user && (
                        <div className="flex items-center gap-3">
                            {/* Watch List Button */}
                            <div className="relative" ref={watchListRef}>
                                <button
                                    onClick={handleWatchListClick}
                                    className="relative w-10 h-10 hover:bg-pastel-blue-100 rounded-lg transition-all duration-200 flex items-center justify-center"
                                    title="관심 카드 목록"
                                >
                                    <HiEye className="text-2xl text-pastel-blue-600" />
                                    {watchedCards.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-pastel-cyan-500 text-white text-xs font-bold rounded-full shadow-glass-sm">
                                            {watchedCards.length}
                                        </span>
                                    )}
                                </button>

                                {/* Watch List Dropdown */}
                                {watchListTransition.shouldRender && (
                                    <div
                                        className={`dropdown-panel dropdown-panel-${watchListTransition.stage} absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-pastel-blue-200`}
                                    >
                                        <div className="px-4 py-3 border-b border-pastel-blue-100 flex justify-between items-center">
                                            <p className="text-sm font-semibold text-pastel-blue-900">관심 카드 목록</p>
                                        </div>

                                        {loadingWatchList ? (
                                            <div className="px-4 py-8 flex items-center justify-center">
                                                <div className="animate-spin h-5 w-5 border-2 border-pastel-blue-500 border-t-transparent rounded-full" />
                                            </div>
                                        ) : watchedCards.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-pastel-blue-500 text-sm">
                                                관심 카드가 없습니다
                                            </div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto">
                                                {watchedCards.map((watchedCard) => (
                                                    <div
                                                        key={watchedCard.watchId}
                                                        className="px-4 py-3 border-b border-pastel-blue-50 hover:bg-pastel-blue-50 transition cursor-pointer"
                                                        onClick={() => handleWatchedCardClick(watchedCard)}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 mt-1">
                                                                <HiEye className="text-xl text-pastel-blue-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-pastel-blue-900 truncate">
                                                                    {watchedCard.card.title}
                                                                </p>
                                                                <p className="text-xs text-pastel-blue-600 mt-1">
                                                                    {watchedCard.boardName} • {watchedCard.columnName}
                                                                </p>
                                                                <p className="text-[10px] text-pastel-blue-400 mt-1">
                                                                    {new Date(watchedCard.watchedAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Inbox Button */}
                            <div className="relative" ref={inboxRef}>
                                <button
                                    onClick={handleInboxClick}
                                    className="relative w-10 h-10 hover:bg-pastel-blue-100 rounded-lg transition-all duration-200 flex items-center justify-center"
                                    title="알림함"
                                >
                                    <HiInbox className="text-2xl text-pastel-blue-600" />
                                    {inboxItems.filter(i => !i.isRead).length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-pastel-pink-500 text-white text-xs font-bold rounded-full shadow-glass-sm">
                                            {inboxItems.filter(i => !i.isRead).length}
                                        </span>
                                    )}
                                </button>

                                {/* Inbox Dropdown */}
                                {inboxTransition.shouldRender && (
                                    <div
                                        className={`dropdown-panel dropdown-panel-${inboxTransition.stage} absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-pastel-blue-200`}
                                    >
                                        <div className="px-4 py-3 border-b border-pastel-blue-100 flex justify-between items-center">
                                            <p className="text-sm font-semibold text-pastel-blue-900">알림함</p>
                                        </div>

                                        {loadingInbox ? (
                                            <div className="px-4 py-8 flex items-center justify-center">
                                                <div className="animate-spin h-5 w-5 border-2 border-pastel-blue-500 border-t-transparent rounded-full" />
                                            </div>
                                        ) : inboxItems.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-pastel-blue-500 text-sm">
                                                새로운 알림이 없습니다
                                            </div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto">
                                                {inboxItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`px-4 py-3 border-b border-pastel-blue-50 hover:bg-pastel-blue-50 transition cursor-pointer \${!item.isRead ? 'bg-pastel-blue-50/50' : ''}`}
                                                        onClick={() => handleNotificationClick(item)}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 mt-1">
                                                                {item.type === 'INVITATION' ? '💌' : '🔔'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-pastel-blue-900 truncate">
                                                                    {item.title}
                                                                </p>
                                                                <p className="text-xs text-pastel-blue-600 mt-1 line-clamp-2">
                                                                    {item.message}
                                                                </p>
                                                                <p className="text-[10px] text-pastel-blue-400 mt-1">
                                                                    {new Date(item.createdAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            {!item.isRead && (
                                                                <div className="w-2 h-2 rounded-full bg-pastel-pink-500 flex-shrink-0 mt-2" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* User Menu Button */}
                            <div className="relative z-50" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="flex items-center gap-3 px-3 py-2 hover:opacity-80 transition-all duration-200"
                                >
                                    <Avatar
                                        avatarUrl={user.avatarUrl}
                                        userName={user.name}
                                        size="md"
                                    />
                                    <span className="text-sm font-semibold text-pastel-blue-900 hidden sm:inline">
                                        {user.name}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {menuTransition.shouldRender && (
                                    <div
                                        className={`dropdown-panel dropdown-panel-${menuTransition.stage} absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-pastel-blue-200 py-1`}
                                    >
                                        <div className="px-4 py-2 border-b border-pastel-blue-100">
                                            <p className="text-xs text-pastel-blue-600">로그인 정보</p>
                                            <p className="text-sm font-semibold text-pastel-blue-900 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleHome();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-pastel-blue-700 hover:bg-pastel-blue-50 transition md:hidden"
                                        >
                                            대시보드
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleBoards();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-pastel-blue-700 hover:bg-pastel-blue-50 transition md:hidden"
                                        >
                                            보드
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                navigate('/profile');
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-pastel-blue-700 hover:bg-pastel-blue-50 transition border-t border-pastel-blue-100"
                                        >
                                            프로필 설정
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleLogout();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-pastel-pink-700 hover:bg-pastel-pink-50 transition border-t border-pastel-blue-100"
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
        </nav>
    );
};
