import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoard } from '@/context/BoardContext';
import { useAuth } from '@/context/AuthContext';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import { BoardCard } from '@/components/BoardCard';
import { GlobalNavBar } from '@/components/GlobalNavBar';
import { Footer } from '@/components/Footer';
import columnService from '@/services/columnService';
import cardService from '@/services/cardService';
import type { Card } from '@/types/card';

const DashboardPage = () => {
    const { user } = useAuth();
    const { boards, loading: boardsLoading, loadBoards } = useBoard();
    const navigate = useNavigate();
    const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
    const [allCards, setAllCards] = useState<{
        [columnId: number]: {
            cards: Card[];
            boardId: number;
            boardName: string;
            workspaceId: number;
        };
    }>({});
    const [cardsLoading, setCardsLoading] = useState(false);
    type DashboardCard = Card & {
        boardId: number;
        boardName: string;
        columnId: number;
        workspaceId: number;
    };
    const [upcomingCards, setUpcomingCards] = useState<DashboardCard[]>([]);
    const [overdueCards, setOverdueCards] = useState<DashboardCard[]>([]);
    const [inProgressCards, setInProgressCards] = useState<DashboardCard[]>([]);

    // 첫 번째 워크스페이스 선택
    useEffect(() => {
        if (user?.workspaces && user.workspaces.length > 0) {
            const workspace = user.workspaces[0];
            setSelectedWorkspaceId(workspace.workspaceId);
        }
    }, [user]);

    // 보드 목록 로드
    useEffect(() => {
        if (selectedWorkspaceId) {
            loadBoards(selectedWorkspaceId);
        }
    }, [selectedWorkspaceId, loadBoards]);

    // 모든 카드 로드를 위해 먼저 모든 보드의 칼럼을 가져오기
    useEffect(() => {
        const loadAllCards = async () => {
            if (boards.length > 0 && selectedWorkspaceId) {
                setCardsLoading(true);
                try {
                    const cardsData: {
                        [columnId: number]: {
                            cards: Card[];
                            boardId: number;
                            boardName: string;
                            workspaceId: number;
                        };
                    } = {};
                    console.log('📥 Starting to load all cards for dashboard');

                    // 모든 보드의 칼럼 로드
                    for (const board of boards) {
                        // 각 보드의 칼럼 로드
                        const boardColumns = await columnService.listColumns(selectedWorkspaceId, board.id);

                        if (boardColumns.length > 0) {
                            for (const column of boardColumns) {
                                console.log(`📥 Loading cards for column ${column.id} (board ${board.id})`);
                                const columnCards = await cardService.listCards(
                                    selectedWorkspaceId,
                                    board.id,
                                    column.id
                                );
                                cardsData[column.id] = {
                                    cards: columnCards,
                                    boardId: board.id,
                                    boardName: board.name,
                                    workspaceId: board.workspaceId,
                                };
                                console.log(`📥 Loaded ${columnCards.length} cards for column ${column.id}`);
                            }
                        }
                    }

                    console.log('✅ All cards loaded:', cardsData);
                    setAllCards(cardsData);
                } catch (err) {
                    console.error('Failed to load all cards:', err);
                } finally {
                    setCardsLoading(false);
                }
            } else {
                setAllCards({});
                setCardsLoading(false);
            }
        };

        loadAllCards();
    }, [boards, selectedWorkspaceId]);

    // 임박한/지연된/진행중인 카드 계산
    useEffect(() => {
        if (boards.length > 0 && Object.keys(allCards).length > 0) {
            const allUpcomingCards: DashboardCard[] = [];
            const allOverdueCards: DashboardCard[] = [];
            const allInProgressCards: DashboardCard[] = [];

            Object.entries(allCards).forEach(([columnIdStr, columnData]) => {
                const columnCards = columnData.cards;
                columnCards.forEach((card) => {
                    // 완료된 카드는 제외
                    if (card.isCompleted) {
                        return;
                    }

                    // 진행 중인 카드 (In Progress 컬럼 기준)
                    // 실제 컬럼ID에 맞게 조정 필요
                    if (columnIdStr === '2' || columnIdStr === '3') {
                        // In Progress 컬럼이라고 가정
                        allInProgressCards.push({
                            ...card,
                            boardId: columnData.boardId,
                            boardName: columnData.boardName,
                            columnId: Number(columnIdStr),
                            workspaceId: columnData.workspaceId,
                        });
                    }

                    if (card.dueDate) {
                        const dueDate = new Date(card.dueDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        dueDate.setHours(0, 0, 0, 0);

                        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        // 지연된 카드
                        if (daysUntilDue < 0) {
                            allOverdueCards.push({
                                ...card,
                                boardId: columnData.boardId,
                                boardName: columnData.boardName,
                                columnId: Number(columnIdStr),
                                workspaceId: columnData.workspaceId,
                            });
                        }
                        // Due Date가 1일 이내인 카드
                        else if (daysUntilDue >= 0 && daysUntilDue <= 1) {
                            allUpcomingCards.push({
                                ...card,
                                boardId: columnData.boardId,
                                boardName: columnData.boardName,
                                columnId: Number(columnIdStr),
                                workspaceId: columnData.workspaceId,
                            });
                        }
                    }
                });
            });

            // Due Date로 정렬 (빠를수록 앞)
            allUpcomingCards.sort((a, b) => {
                const dateA = new Date(a.dueDate || '');
                const dateB = new Date(b.dueDate || '');
                return dateA.getTime() - dateB.getTime();
            });

            allOverdueCards.sort((a, b) => {
                const dateA = new Date(a.dueDate || '');
                const dateB = new Date(b.dueDate || '');
                return dateA.getTime() - dateB.getTime();
            });

            console.log('🔔 Upcoming cards calculated:', allUpcomingCards.length);
            console.log('⚠️ Overdue cards calculated:', allOverdueCards.length);
            console.log('🔄 In progress cards calculated:', allInProgressCards.length);
            setUpcomingCards(allUpcomingCards);
            setOverdueCards(allOverdueCards);
            setInProgressCards(allInProgressCards);
        }
    }, [boards, allCards]);

    const handleCardNavigate = (card: DashboardCard) => {
        if (!card.workspaceId) {
            return;
        }
        navigate(`/boards/${card.workspaceId}/${card.boardId}?cardId=${card.id}&columnId=${card.columnId}`);
    };

    return (
        <div className="h-screen bg-gradient-pastel flex flex-col overflow-hidden">
            <GlobalNavBar />

            <main className="flex-1 overflow-hidden flex flex-col relative">
                {cardsLoading && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-pastel-blue-800 bg-white/80 px-3 py-1.5 rounded-full shadow-glass-sm border border-pastel-blue-100 z-10">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-pastel-blue-500 border-t-transparent"></div>
                        <span>대시보드 데이터 동기화 중…</span>
                    </div>
                )}
                <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 flex-1 overflow-hidden flex flex-col py-4">
                    {boardsLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue-600"></div>
                        </div>
                    )}

                    {!boardsLoading && boards.length === 0 && upcomingCards.length === 0 && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="glass rounded-2xl p-12 shadow-glass-lg text-center max-w-2xl">
                                <h2 className="text-2xl font-bold text-pastel-blue-900 mb-2">보드가 없습니다</h2>
                                <p className="text-pastel-blue-600 mb-8">첫 번째 보드를 만들어 시작하세요.</p>
                                <button
                                    onClick={() => setShowCreateBoardModal(true)}
                                    className="px-8 py-3 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
                                >
                                    + 새 보드 만들기
                                </button>
                            </div>
                        </div>
                    )}

                    {!boardsLoading &&
                        (boards.length > 0 ||
                            upcomingCards.length > 0 ||
                            overdueCards.length > 0 ||
                            inProgressCards.length > 0) && (
                            <div className="flex-1 overflow-auto flex flex-col gap-6">
                                {/* 지연된 카드 섹션 */}
                                {overdueCards.length > 0 && (
                                    <section className="flex-shrink-0">
                                        <div className="mb-3">
                                            <h2 className="text-xl font-bold text-pastel-pink-700">
                                                지연 중인 작업 ⚠️
                                            </h2>
                                            <p className="text-xs text-pastel-pink-500 mt-1">
                                                {overdueCards.length}개의 카드
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {overdueCards.map((card) => {
                                                const dueDate = new Date(card.dueDate || '');
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                dueDate.setHours(0, 0, 0, 0);
                                                const daysOverdue = Math.floor(
                                                    (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
                                                );

                                                const dueDateStr = dueDate.toLocaleDateString('ko-KR', {
                                                    month: 'numeric',
                                                    day: 'numeric',
                                                });

                                                return (
                                                    <button
                                                        key={`${card.id}-overdue`}
                                                        type="button"
                                                        onClick={() => handleCardNavigate(card)}
                                                        className="glass rounded-lg p-4 border border-pastel-pink-200 hover:shadow-glass-lg transition bg-pastel-pink-50 text-left w-full h-full cursor-pointer flex flex-col"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-pastel-blue-900 truncate">
                                                                    {card.title}
                                                                </h3>
                                                                <p className="text-xs text-pastel-blue-600 mt-1">
                                                                    {card.boardName} / {card.description || '설명 없음'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {card.priority && (
                                                                    <span
                                                                        className={`text-xs px-2 py-1 rounded font-medium ${
                                                                            card.priority === 'HIGH'
                                                                                ? 'bg-pastel-pink-100 text-pastel-pink-700'
                                                                                : card.priority === 'MEDIUM'
                                                                                ? 'bg-pastel-yellow-100 text-pastel-yellow-700'
                                                                                : 'bg-pastel-green-100 text-pastel-green-700'
                                                                        }`}
                                                                    >
                                                                        {card.priority}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs px-2 py-1 rounded font-semibold bg-pastel-pink-100 text-pastel-pink-700">
                                                                    📅 {dueDateStr} ({daysOverdue}일 전)
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {card.assignee && (
                                                            <p className="text-xs text-pastel-blue-600 mt-2">
                                                                👤 {card.assignee}
                                                            </p>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                {/* 진행 중인 카드 섹션 */}
                                {inProgressCards.length > 0 && (
                                    <section className="flex-shrink-0">
                                        <div className="mb-3">
                                            <h2 className="text-xl font-bold text-pastel-cyan-700">
                                                진행 중인 작업 🔄
                                            </h2>
                                            <p className="text-xs text-pastel-cyan-500 mt-1">
                                                {inProgressCards.length}개의 카드
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {inProgressCards.map((card) => (
                                                <button
                                                    key={`${card.id}-inprogress`}
                                                    type="button"
                                                    onClick={() => handleCardNavigate(card)}
                                                    className="glass rounded-lg p-4 border border-pastel-cyan-200 hover:shadow-glass-lg transition text-left w-full h-full cursor-pointer flex flex-col"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-pastel-blue-900 truncate">
                                                                {card.title}
                                                            </h3>
                                                            <p className="text-xs text-pastel-blue-600 mt-1">
                                                                {card.boardName} / {card.description || '설명 없음'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {card.priority && (
                                                                <span
                                                                    className={`text-xs px-2 py-1 rounded font-medium ${
                                                                        card.priority === 'HIGH'
                                                                            ? 'bg-pastel-pink-100 text-pastel-pink-700'
                                                                            : card.priority === 'MEDIUM'
                                                                            ? 'bg-pastel-yellow-100 text-pastel-yellow-700'
                                                                            : 'bg-pastel-green-100 text-pastel-green-700'
                                                                    }`}
                                                                >
                                                                    {card.priority}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {card.assignee && (
                                                        <p className="text-xs text-pastel-blue-600 mt-2">
                                                            👤 {card.assignee}
                                                        </p>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* 마감 임박 카드 섹션 */}
                                {upcomingCards.length > 0 && (
                                    <section className="flex-shrink-0">
                                        <div className="mb-3">
                                            <h2 className="text-xl font-bold text-pastel-blue-900">
                                                마감 임박 카드 🔔
                                            </h2>
                                            <p className="text-xs text-pastel-blue-500 mt-1">
                                                {upcomingCards.length}개의 카드
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {upcomingCards.map((card) => {
                                                const dueDate = new Date(card.dueDate || '');
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                dueDate.setHours(0, 0, 0, 0);
                                                const daysUntilDue = Math.floor(
                                                    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                                                );
                                                const isToday = daysUntilDue === 0;
                                                const isTomorrow = daysUntilDue === 1;

                                                const dueDateStr = dueDate.toLocaleDateString('ko-KR', {
                                                    month: 'numeric',
                                                    day: 'numeric',
                                                });

                                                return (
                                                    <button
                                                        key={`${card.id}-upcoming`}
                                                        type="button"
                                                        onClick={() => handleCardNavigate(card)}
                                                        className="glass rounded-lg p-4 border border-pastel-blue-200 hover:shadow-glass-lg transition text-left w-full h-full cursor-pointer flex flex-col"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-pastel-blue-900 truncate">
                                                                    {card.title}
                                                                </h3>
                                                                <p className="text-xs text-pastel-blue-600 mt-1">
                                                                    {card.boardName} / {card.description || '설명 없음'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {card.priority && (
                                                                    <span
                                                                        className={`text-xs px-2 py-1 rounded font-medium ${
                                                                            card.priority === 'HIGH'
                                                                                ? 'bg-pastel-pink-100 text-pastel-pink-700'
                                                                                : card.priority === 'MEDIUM'
                                                                                ? 'bg-pastel-yellow-100 text-pastel-yellow-700'
                                                                                : 'bg-pastel-green-100 text-pastel-green-700'
                                                                        }`}
                                                                    >
                                                                        {card.priority}
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={`text-xs px-2 py-1 rounded font-semibold ${
                                                                        isToday
                                                                            ? 'bg-pastel-pink-100 text-pastel-pink-700'
                                                                            : isTomorrow
                                                                            ? 'bg-pastel-yellow-100 text-pastel-yellow-700'
                                                                            : 'bg-pastel-blue-100 text-pastel-blue-700'
                                                                    }`}
                                                                >
                                                                    📅 {dueDateStr} {isToday && '(오늘!)'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {card.assignee && (
                                                            <p className="text-xs text-pastel-blue-600 mt-2">
                                                                👤 {card.assignee}
                                                            </p>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                {/* 보드 섹션 */}
                                {boards.length > 0 && (
                                    <section className="flex-1 overflow-auto">
                                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                            <div>
                                                <h2 className="text-xl font-bold text-pastel-blue-900">내 보드</h2>
                                                <p className="text-xs text-pastel-blue-500 mt-1">
                                                    {boards.length}개의 보드
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowCreateBoardModal(true)}
                                                className="px-3 py-1.5 rounded-lg bg-pastel-blue-500 text-white text-sm font-semibold hover:bg-pastel-blue-600 transition flex-shrink-0"
                                            >
                                                + 새 보드
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                                            {boards.map((board) => (
                                                <BoardCard
                                                    key={board.id}
                                                    board={board}
                                                    workspaceId={selectedWorkspaceId!}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                </div>
            </main>

            {/* Create Board Modal */}
            {showCreateBoardModal && selectedWorkspaceId && (
                <CreateBoardModal
                    workspaceId={selectedWorkspaceId}
                    onClose={() => {
                        setShowCreateBoardModal(false);
                        loadBoards(selectedWorkspaceId);
                    }}
                />
            )}

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default DashboardPage;
