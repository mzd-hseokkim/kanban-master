import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { memberService } from '@/services/memberService';
import { InvitationResponseModal } from './InvitationResponseModal';
import { Avatar } from './common/Avatar';
import type { BoardMember } from '@/types/member';
import { usePresenceTransition } from '@/hooks/usePresenceTransition';

export const GlobalNavBar: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showMenu, setShowMenu] = React.useState(false);
    const [showInvitations, setShowInvitations] = useState(false);
    const [pendingInvitations, setPendingInvitations] = useState<BoardMember[]>([]);
    const [loadingInvitations, setLoadingInvitations] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState<BoardMember | null>(null);
    const [showInvitationModal, setShowInvitationModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const invitationsRef = useRef<HTMLDivElement>(null);
    const menuTransition = usePresenceTransition(showMenu, 220);
    const invitationsTransition = usePresenceTransition(showInvitations, 220);

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

    const loadPendingInvitations = async () => {
        try {
            setLoadingInvitations(true);
            const invitations = await memberService.getPendingInvitations();
            setPendingInvitations(invitations);
        } catch (error) {
            console.error('Failed to load pending invitations:', error);
        } finally {
            setLoadingInvitations(false);
        }
    };

    const handleInvitationsClick = async () => {
        if (!showInvitations) {
            await loadPendingInvitations();
        }
        setShowInvitations(!showInvitations);
    };

    // 화면 로드 시 초대 개수 조회
    useEffect(() => {
        loadPendingInvitations();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
            if (invitationsRef.current && !invitationsRef.current.contains(event.target as Node)) {
                setShowInvitations(false);
            }
        };

        if (showMenu || showInvitations) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showMenu, showInvitations]);

    return (
        <nav className="glass-light shadow-glass sticky top-0 z-50">
            <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Home */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleHome}
                            className="text-2xl font-bold text-pastel-blue-900 hover:text-pastel-blue-700 transition"
                        >
                            Kanban Master
                        </button>
                    </div>

                    {/* Navigation Links */}
                    {user && (
                        <div className="hidden md:flex items-center gap-6">
                            <button
                                onClick={handleHome}
                                className="text-pastel-blue-700 hover:text-pastel-blue-900 font-medium transition"
                            >
                                대시보드
                            </button>
                            <button
                                onClick={handleBoards}
                                className="text-pastel-blue-700 hover:text-pastel-blue-900 font-medium transition"
                            >
                                보드
                            </button>
                        </div>
                    )}

                    {/* User Menu */}
                    {user && (
                        <div className="flex items-center gap-4">
                            {/* Invitations Button */}
                            <div className="relative" ref={invitationsRef}>
                                <button
                                    onClick={handleInvitationsClick}
                                    className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/20 transition relative"
                                    title="초대 목록"
                                >
                                    <span className="text-xl">📬</span>
                                    {pendingInvitations.length > 0 && (
                                        <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-pastel-pink-500 text-white text-xs font-bold rounded-full">
                                            {pendingInvitations.length}
                                        </span>
                                    )}
                                </button>

                                {/* Invitations Dropdown */}
                                {invitationsTransition.shouldRender && (
                                    <div
                                        className={`dropdown-panel dropdown-panel-${invitationsTransition.stage} absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-pastel-blue-200`}
                                    >
                                        <div className="px-4 py-3 border-b border-pastel-blue-100">
                                            <p className="text-sm font-semibold text-pastel-blue-900">초대 목록</p>
                                        </div>

                                        {loadingInvitations ? (
                                            <div className="px-4 py-8 flex items-center justify-center">
                                                <div className="animate-spin h-5 w-5 border-2 border-pastel-blue-500 border-t-transparent rounded-full" />
                                            </div>
                                        ) : pendingInvitations.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-pastel-blue-500 text-sm">
                                                받은 초대가 없습니다
                                            </div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto">
                                                {pendingInvitations.map((invitation) => (
                                                    <div
                                                        key={`${invitation.boardId}-${invitation.userId}`}
                                                        className="px-4 py-3 border-b border-pastel-blue-50 hover:bg-pastel-blue-50 transition cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedInvitation(invitation);
                                                            setShowInvitationModal(true);
                                                        }}
                                                    >
                                                        <p className="text-sm font-semibold text-pastel-blue-900">
                                                            {invitation.boardName}
                                                        </p>
                                                        <p className="text-xs text-pastel-blue-600 mt-1">
                                                            {invitation.invitedByName}님으로부터 초대
                                                        </p>
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
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/20 transition"
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
                    setShowInvitations(false);
                }}
                onSuccess={() => {
                    loadPendingInvitations();
                }}
            />
        </nav>
    );
};
