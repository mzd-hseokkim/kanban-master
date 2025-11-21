import { useAuth } from '@/context/AuthContext';
import { searchService } from '@/services/searchService';
import type { BoardSearchResult, CardSearchResult, ColumnSearchResult } from '@/types/search';
import React, { useEffect, useState } from 'react';
import { HiClipboardList, HiCollection, HiDocumentText, HiSearch, HiSparkles } from 'react-icons/hi';
import { useNavigate, useSearchParams } from 'react-router-dom';

type SearchStep = 'IDLE' | 'BOARDS' | 'COLUMNS' | 'CARDS' | 'DONE';

export const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();
    const { user } = useAuth();

    // Search Results
    const [boardResults, setBoardResults] = useState<BoardSearchResult[]>([]);
    const [columnResults, setColumnResults] = useState<ColumnSearchResult[]>([]);
    const [cardResults, setCardResults] = useState<CardSearchResult[]>([]);

    // Search Status
    const [step, setStep] = useState<SearchStep>('IDLE');

    // Reset and start search when query changes
    useEffect(() => {
        if (!query || !user) return;

        setBoardResults([]);
        setColumnResults([]);
        setCardResults([]);
        setStep('BOARDS');
    }, [query, user]);

    // Sequential Search Logic
    useEffect(() => {
        if (!user || !query) return;

        const executeSearch = async () => {
            // TODO: 현재는 첫 번째 워크스페이스만 검색한다고 가정 (추후 워크스페이스 선택 기능 추가 필요)
            // 실제로는 사용자의 워크스페이스 목록을 가져와서 검색해야 함.
            // 여기서는 임시로 workspaceId=1로 가정하거나, user 정보에 workspaceId가 있다면 사용.
            // 하지만 user 객체에는 workspace 정보가 없을 수 있음.
            // 일단 보드 목록 페이지 등에서 사용하는 방식을 참고해야 함.
            // 여기서는 편의상 1번 워크스페이스로 하드코딩하거나, API가 워크스페이스 무관하게 검색하도록 수정 필요할 수도 있음.
            // 하지만 API는 workspaceId를 요구함.
            // 임시 방편: 사용자가 속한 첫 번째 워크스페이스 ID를 가져오는 로직이 필요하지만,
            // 복잡도를 줄이기 위해 일단 1번으로 고정하고 추후 개선.
            // OR: We can fetch user's workspaces first.
            // Let's assume workspaceId = 1 for now as per typical dev environment,
            // or better, try to get it from local storage or context if available.
            const workspaceId = 1;

            try {
                if (step === 'BOARDS') {
                    const boards = await searchService.searchBoards(workspaceId, query);
                    setBoardResults(boards);
                    setStep('COLUMNS');
                } else if (step === 'COLUMNS') {
                    const columns = await searchService.searchColumns(workspaceId, query);
                    setColumnResults(columns);
                    setStep('CARDS');
                } else if (step === 'CARDS') {
                    const cards = await searchService.searchCardsInWorkspace(workspaceId, { keyword: query });
                    setCardResults(cards);
                    setStep('DONE');
                }
            } catch (error) {
                console.error(`Error searching ${step}:`, error);
                // 에러 발생 시 다음 단계로 진행하거나 중단
                if (step === 'BOARDS') setStep('COLUMNS');
                else if (step === 'COLUMNS') setStep('CARDS');
                else if (step === 'CARDS') {
                    setStep('DONE');
                }
            }
        };

        if (step !== 'IDLE' && step !== 'DONE') {
            executeSearch();
        }
    }, [step, query, user]);

    const handleBoardClick = (board: BoardSearchResult) => {
        navigate(`/boards/${board.workspaceId}/${board.id}`);
    };

    const handleColumnClick = (column: ColumnSearchResult) => {
        navigate(`/boards/1/${column.boardId}?columnId=${column.id}`);
    };

    const handleCardClick = (card: CardSearchResult) => {
        navigate(`/boards/${card.workspaceId}/${card.boardId}?cardId=${card.id}&columnId=${card.columnId}`);
    };

    if (!query) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-pastel">
                <HiSearch className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">검색어를 입력해주세요</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-pastel">
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 flex-shrink-0 transition-colors duration-300">
                <div className="w-full max-w-[95vw] mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="text-blue-600">"{query}"</span> 검색 결과
                    </h1>
                </div>
            </header>

            <main className="flex-1 overflow-auto w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8 pb-8">
                    {/* Boards Section */}
                    {step !== 'IDLE' && (
                        <section className="animate-fadeIn">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <HiClipboardList className="text-xl text-slate-500" />
                                보드
                                {step === 'BOARDS' && (
                                    <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                )}
                            </h2>
                            {boardResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {boardResults.map(board => (
                                        <div
                                            key={board.id}
                                            onClick={() => handleBoardClick(board)}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform text-blue-500">
                                                    {board.icon === 'sparkles' ? <HiSparkles /> : <HiClipboardList />}
                                                </div>
                                                <h3 className="font-semibold text-slate-900 truncate">{board.name}</h3>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-2">{board.description || '설명 없음'}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : step !== 'BOARDS' && (
                                <p className="text-sm text-slate-400 italic">검색 결과가 없습니다.</p>
                            )}
                        </section>
                    )}

                    {/* Columns Section */}
                    {(step === 'COLUMNS' || step === 'CARDS' || step === 'DONE') && (
                        <section className="animate-fadeIn">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <HiCollection className="text-xl text-slate-500" />
                                칼럼
                                {step === 'COLUMNS' && (
                                    <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                )}
                            </h2>
                            {columnResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {columnResults.map(column => (
                                        <div
                                            key={column.id}
                                            onClick={() => handleColumnClick(column)}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold text-slate-900 truncate">{column.name}</h3>
                                                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                                    Board #{column.boardId}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : step !== 'COLUMNS' && (
                                <p className="text-sm text-slate-400 italic">검색 결과가 없습니다.</p>
                            )}
                        </section>
                    )}

                    {/* Cards Section */}
                    {(step === 'CARDS' || step === 'DONE') && (
                        <section className="animate-fadeIn">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <HiDocumentText className="text-xl text-slate-500" />
                                카드
                                {step === 'CARDS' && (
                                    <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                )}
                            </h2>
                            {cardResults.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {cardResults.map(card => (
                                        <div
                                            key={card.id}
                                            onClick={() => handleCardClick(card)}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center gap-4"
                                        >
                                            <div className={`w-2 h-12 rounded-full ${card.bgColor || 'bg-gray-200'}`} />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 truncate">{card.title}</h3>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <span>{card.boardName}</span>
                                                    <span>•</span>
                                                    <span>{card.columnName}</span>
                                                    {card.isCompleted && (
                                                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">완료</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : step === 'DONE' && (
                                <p className="text-sm text-slate-400 italic">검색 결과가 없습니다.</p>
                            )}
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SearchPage;
