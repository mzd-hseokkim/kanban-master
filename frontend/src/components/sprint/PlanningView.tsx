import { useSprint } from '@/context/SprintContext';
import sprintService from '@/services/sprintService';
import type { Card } from '@/types/card';
import { useCallback, useEffect, useState } from 'react';
import './PlanningView.css';

interface PlanningViewProps {
  boardId: number;
  onCreateSprint: () => void;
}

export const PlanningView = ({ boardId, onCreateSprint }: PlanningViewProps) => {
  const { sprints, loadSprints } = useSprint();
  const [backlog, setBacklog] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      await loadSprints(boardId, silent);
      const backlogData = await sprintService.getBacklog(boardId);
      setBacklog(backlogData);
    } catch (error) {
      console.error('Failed to load planning data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [boardId, loadSprints]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="planning-view__loading">Loading...</div>;
  }

  return (
    <div className="planning-view">
      <BacklogPanel cards={backlog} />
      <SprintListPanel sprints={sprints} boardId={boardId} onUpdate={loadData} onCreateSprint={onCreateSprint} />
    </div>
  );
};

interface BacklogPanelProps {
  cards: Card[];
}

const BacklogPanel = ({ cards }: BacklogPanelProps) => {
  const handleDragStart = (e: React.DragEvent, card: Card) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardId', String(card.id));
    e.dataTransfer.setData('source', 'backlog');
  };

  return (
    <div className="planning-view__backlog">
      <h3 className="planning-view__panel-title">Backlog ({cards.length})</h3>
      <div className="planning-view__card-list">
        {cards.map(card => (
          <div
            key={card.id}
            className="planning-view__card"
            draggable
            onDragStart={(e) => handleDragStart(e, card)}
          >
            <span className="planning-view__card-title">{card.title}</span>
            {card.storyPoints && (
              <span className="planning-view__card-points">{card.storyPoints} pts</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface SprintListPanelProps {
  sprints: any[];
  boardId: number;
  onUpdate: (silent?: boolean) => void;
  onCreateSprint: () => void;
}

const SprintListPanel = ({ sprints, onUpdate, onCreateSprint, boardId }: SprintListPanelProps) => {
  const activeSprint = sprints.find(s => s.status === 'ACTIVE');
  const plannedSprints = sprints.filter(s => s.status === 'PLANNED');
  const completedSprints = sprints.filter(s => s.status === 'COMPLETED');
  const [startingSprintId, setStartingSprintId] = useState<number | null>(null);
  const [dragOverSprintId, setDragOverSprintId] = useState<number | null>(null);

  const handleStartSprint = async (sprintId: number) => {
      try {
        setStartingSprintId(sprintId);
        await sprintService.startSprint(sprintId);
        onUpdate(true);
      } catch (error) {
        console.error('Failed to start sprint:', error);
        alert(error instanceof Error ? error.message : 'Failed to start sprint');
      } finally {
        setStartingSprintId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, sprintId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSprintId(sprintId);
  };

  const handleDragLeave = () => {
    setDragOverSprintId(null);
  };

  const handleDrop = async (e: React.DragEvent, sprintId: number) => {
    e.preventDefault();
    setDragOverSprintId(null);

    const cardId = Number(e.dataTransfer.getData('cardId'));
    const source = e.dataTransfer.getData('source');

    if (!cardId || source !== 'backlog') return;

    try {
      // Assign card to sprint
      await sprintService.assignCardToSprint(boardId, cardId, sprintId);
      onUpdate(true);
    } catch (error) {
      console.error('Failed to assign card to sprint:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign card to sprint');
    }
  };

  return (
    <div className="planning-view__sprints">
      {/* Active Sprint Section - sticky */}
      {activeSprint && (
        <div className="planning-view__active-sprint-section planning-view__sticky">
          <h3 className="planning-view__section-title">Current Sprint</h3>
          <SprintItem
            sprint={activeSprint}
            boardId={boardId}
            isActive={true}
            isCompleted={false}
            isDragOver={dragOverSprintId === activeSprint.id}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onStartSprint={handleStartSprint}
            isStarting={false}
          />
        </div>
      )}

      <div className="planning-view__sprint-scroll">
        {/* Planned Sprints Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="planning-view__panel-title mb-0">Planned Sprints</h3>
          <button
            onClick={onCreateSprint}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-lg hover:shadow-blue-500/30"
          >
            + Create Sprint
          </button>
        </div>

        <div className="planning-view__sprint-list">
          {plannedSprints.map(sprint => (
            <SprintItem
              key={sprint.id}
              sprint={sprint}
              boardId={boardId}
              isActive={false}
              isCompleted={false}
              isDragOver={dragOverSprintId === sprint.id}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onStartSprint={handleStartSprint}
              isStarting={startingSprintId === sprint.id}
              disableStart={Boolean(activeSprint)}
            />
          ))}
          {plannedSprints.length === 0 && !activeSprint && completedSprints.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sprints planned. Create one to get started!
            </div>
          )}
        </div>

        {/* Completed Sprints Section */}
        {completedSprints.length > 0 && (
          <div className="mt-8">
            <h3 className="planning-view__panel-title mb-4">Completed Sprints</h3>
            <div className="planning-view__sprint-list">
              {completedSprints.map(sprint => (
                <SprintItem
                  key={sprint.id}
                  sprint={sprint}
                  boardId={boardId}
                  isActive={false}
                  isCompleted={true}
                  isDragOver={false}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onStartSprint={handleStartSprint}
                isStarting={false}
                disableStart={Boolean(activeSprint)}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

interface SprintItemProps {
  sprint: any;
  boardId: number;
  isActive: boolean;
  isCompleted: boolean;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent, sprintId: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, sprintId: number) => void;
  onStartSprint: (sprintId: number) => void;
  isStarting: boolean;
  disableStart?: boolean;
}

const SprintItem = ({
  sprint,
  boardId: _boardId,
  isActive,
  isCompleted,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onStartSprint,
  isStarting,
  disableStart = false
}: SprintItemProps) => {
  // cardCount는 이제 sprint 객체에서 직접 가져옴 (백엔드에서 함께 반환)

  return (
    <div
      className={`planning-view__sprint ${isActive ? 'planning-view__sprint--active' : ''} ${isCompleted ? 'planning-view__sprint--completed' : ''} ${isDragOver ? 'planning-view__sprint--drag-over' : ''}`}
      onDragOver={isCompleted ? undefined : (e) => onDragOver(e, sprint.id)}
      onDragLeave={isCompleted ? undefined : onDragLeave}
      onDrop={isCompleted ? undefined : (e) => onDrop(e, sprint.id)}
    >
      <div className="planning-view__sprint-header">
        <div className="planning-view__sprint-info">
          <h4>{sprint.name}</h4>
          <div className="planning-view__sprint-meta">
            {sprint.startDate && sprint.endDate ? (
              <span>{sprint.startDate} - {sprint.endDate}</span>
            ) : (
              <span>Dates not set</span>
            )}
            {isActive && <span className="text-blue-400 font-medium">Active</span>}
            {isCompleted && <span className="text-green-400 font-medium">Completed</span>}
            {sprint.cardCount !== undefined && (
              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                {sprint.cardCount} cards
              </span>
            )}
            {sprint.totalPoints !== undefined && sprint.completedPoints !== undefined && (
              <span className="ml-2 px-2 py-0.5 bg-slate-700 text-slate-200 rounded-full text-xs font-medium">
                {sprint.completedPoints} / {sprint.totalPoints} pts
              </span>
            )}
          </div>
        </div>
        <div className="planning-view__sprint-actions">
          {sprint.capacity && (
            <span className="planning-view__capacity">{sprint.capacity} pts capacity</span>
          )}
          {!isActive && !isCompleted && (
            <button
              className="px-3 py-1.5 text-xs font-medium text-blue-200 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onStartSprint(sprint.id)}
              disabled={isStarting || disableStart}
            >
              {isStarting ? 'Starting...' : 'Start'}
            </button>
          )}
        </div>
      </div>
      {sprint.goalText && (
        <div className="planning-view__sprint-goal">
          Goal: {sprint.goalText}
        </div>
      )}
    </div>
  );
};
