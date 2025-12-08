import { BoardCard } from '@/components/BoardCard';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import { SaveAsTemplateModal } from '@/components/SaveAsTemplateModal';
import { TemplateGallery } from '@/components/TemplateGallery';
import { useAuth } from '@/context/AuthContext';
import { useBoard } from '@/context/BoardContext';
import { Board } from '@/types/board';
import { useEffect, useState } from 'react';
import { HiClipboardList, HiPlus, HiTemplate } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

export const BoardsPage = () => {
  const { t } = useTranslation(['board', 'common']);
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

  const renderBoardContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue-600"></div>
        </div>
      );
    }

    if (boards.length === 0) {
      return (
        <div className="glass rounded-2xl p-12 shadow-glass-lg text-center">
          <p className="text-xl text-pastel-blue-400 mb-6">{t('board:list.empty')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
          >
            {t('board:list.createFirst')}
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            workspaceId={selectedWorkspaceId!}
            onSaveAsTemplate={(currentBoard) => {
              setSelectedBoard(currentBoard);
              setShowSaveAsTemplate(true);
            }}
          />
        ))}
      </div>
    );
  };

  if (!selectedWorkspaceId) {
    return (
      <div className="h-full bg-gradient-pastel flex items-center justify-center">
        <p className="text-pastel-blue-400">{t('board:list.noWorkspace')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-pastel">
      {/* Header */}
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 flex-shrink-0 transition-colors duration-300">
        <div className="w-full max-w-[95vw] mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500 mb-1 font-medium">{selectedWorkspaceName}</p>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <HiClipboardList className="text-blue-600" />
              {t('board:list.title')}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplateGallery(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-600 font-semibold hover:bg-slate-50 hover:text-blue-600 transition-all border border-slate-200 shadow-sm hover:shadow-md"
            >
              <HiTemplate className="text-lg" />
              {t('board:list.template')}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-bold hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
            >
              <HiPlus className="text-lg" />
              {t('board:createButton')}
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

          {renderBoardContent()}
        </div>
      </main>

      {/* Create Board Modal */}
      {showCreateModal && Boolean(selectedWorkspaceId) && (
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
      {showTemplateGallery && Boolean(selectedWorkspaceId) && (
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
      {showSaveAsTemplate && selectedBoard && Boolean(selectedWorkspaceId) && (
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
