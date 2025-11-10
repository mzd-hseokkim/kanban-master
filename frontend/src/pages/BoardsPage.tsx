import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBoard } from '@/context/BoardContext';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import { BoardCard } from '@/components/BoardCard';
import { TemplateGallery } from '@/components/TemplateGallery';
import { SaveAsTemplateModal } from '@/components/SaveAsTemplateModal';
import { Board } from '@/types/board';

export const BoardsPage = () => {
  const { user } = useAuth();
  const { boards, loading, error, loadBoards, clearError } = useBoard();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState<string>('');

  // 첫 번째 워크스페이스 선택
  useEffect(() => {
    if (user?.workspaces && user.workspaces.length > 0) {
      const workspace = user.workspaces[0];
      setSelectedWorkspaceId(workspace.workspaceId);
      setSelectedWorkspaceName(workspace.workspaceName);
    }
  }, [user]);

  // 보드 목록 로드
  useEffect(() => {
    if (selectedWorkspaceId) {
      loadBoards(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, loadBoards]);

  if (!selectedWorkspaceId) {
    return (
      <div className="h-full bg-gradient-pastel flex items-center justify-center">
        <p className="text-pastel-blue-400">워크스페이스를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-pastel">
      {/* Header */}
      <header className="glass-light shadow-glass flex-shrink-0">
        <div className="w-full max-w-[95vw] mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <p className="text-sm text-pastel-blue-500 mb-1">{selectedWorkspaceName}</p>
            <h1 className="text-3xl font-bold text-pastel-blue-900">
              보드 관리
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplateGallery(true)}
              className="px-4 py-2 rounded-lg bg-white text-pastel-blue-600 font-semibold hover:bg-pastel-blue-50 transition border border-pastel-blue-200"
            >
              📋 템플릿
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
            >
              + 새 보드
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="w-full max-w-[95vw] mx-auto">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-pastel-pink-100 text-pastel-pink-700 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={clearError} className="text-lg">×</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue-600"></div>
            </div>
          ) : boards.length === 0 ? (
            <div className="glass rounded-2xl p-12 shadow-glass-lg text-center">
              <p className="text-xl text-pastel-blue-400 mb-6">아직 보드가 없습니다</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
              >
                첫 보드 만들기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map(board => (
                <BoardCard
                  key={board.id}
                  board={board}
                  workspaceId={selectedWorkspaceId}
                  onSaveAsTemplate={(board) => {
                    setSelectedBoard(board);
                    setShowSaveAsTemplate(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Board Modal */}
      {showCreateModal && selectedWorkspaceId && (
        <CreateBoardModal
          workspaceId={selectedWorkspaceId}
          onClose={() => {
            setShowCreateModal(false);
            // 보드 목록 새로고침
            loadBoards(selectedWorkspaceId);
          }}
        />
      )}

      {/* Template Gallery */}
      {showTemplateGallery && selectedWorkspaceId && (
        <TemplateGallery
          workspaceId={selectedWorkspaceId}
          onClose={() => setShowTemplateGallery(false)}
          onApply={() => {
            setShowTemplateGallery(false);
            // 보드 목록 새로고침
            loadBoards(selectedWorkspaceId);
          }}
        />
      )}

      {/* Save As Template Modal */}
      {showSaveAsTemplate && selectedBoard && selectedWorkspaceId && (
        <SaveAsTemplateModal
          workspaceId={selectedWorkspaceId}
          boardId={selectedBoard.id}
          boardName={selectedBoard.name}
          onClose={() => {
            setShowSaveAsTemplate(false);
            setSelectedBoard(null);
          }}
          onSuccess={() => {
            setShowSaveAsTemplate(false);
            setSelectedBoard(null);
          }}
        />
      )}
    </div>
  );
};

export default BoardsPage;
