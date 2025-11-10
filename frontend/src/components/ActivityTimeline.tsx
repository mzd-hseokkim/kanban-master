import { useEffect, useState } from "react";
import { activityService } from "@/services/activityService";
import type { Activity } from "@/types/activity";

interface ActivityTimelineProps {
  boardId: number;
  cardId?: number;
  userId?: number;
  maxHeight?: string;
}

const getActivityIcon = (eventType: string): string => {
  const iconMap: Record<string, string> = {
    BOARD_CREATED: "✨",
    BOARD_UPDATED: "📝",
    BOARD_DELETED: "🗑️",
    COLUMN_CREATED: "➕",
    COLUMN_UPDATED: "📝",
    COLUMN_DELETED: "🗑️",
    COLUMN_REORDERED: "🔄",
    CARD_CREATED: "📌",
    CARD_UPDATED: "✏️",
    CARD_DELETED: "🗑️",
    CARD_MOVED: "↔️",
    MEMBER_INVITED: "👤",
    MEMBER_ROLE_CHANGED: "👑",
    MEMBER_REMOVED: "❌",
    COMMENT_ADDED: "💬",
    COMMENT_DELETED: "🗑️",
  };
  return iconMap[eventType] || "📌";
};

const getActivityColor = (eventType: string): string => {
  if (eventType.includes("DELETED")) return "red";
  if (eventType.includes("CREATED") || eventType.includes("ADDED"))
    return "green";
  if (eventType.includes("MEMBER") || eventType.includes("ROLE")) return "blue";
  if (eventType.includes("MOVED") || eventType.includes("REORDERED"))
    return "purple";
  return "gray";
};

export const ActivityTimeline = ({
  boardId,
  cardId,
  userId,
  maxHeight = "max-h-96",
}: ActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const loadActivities = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (cardId) {
        response = await activityService.getCardActivities(
          cardId,
          page,
          pageSize,
          userId,
        );
      } else if (userId) {
        response = await activityService.getUserActivities(
          userId,
          page,
          pageSize,
        );
      } else {
        response = await activityService.getBoardActivities(
          boardId,
          page,
          pageSize,
        );
      }

      if (page === 0) {
        setActivities(response.content);
      } else {
        setActivities((prev) => [...prev, ...response.content]);
      }

      setCurrentPage(page);
      setHasMore(page < response.totalPages - 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load activities";
      setError(errorMessage);
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(0);
  }, [boardId, cardId, userId]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadActivities(currentPage + 1);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<
      string,
      { bg: string; text: string; border: string }
    > = {
      red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
      green: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      },
      gray: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      },
    };
    return colorMap[color] || colorMap.gray;
  };

  if (error && activities.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-red-600">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${maxHeight} overflow-hidden`}>
      {/* Activities List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">활동 이력이 없습니다</p>
          </div>
        ) : (
          activities.map((activity) => {
            const color = getActivityColor(activity.eventType);
            const colorClasses = getColorClasses(color);
            const icon = getActivityIcon(activity.eventType);

            return (
              <div
                key={activity.id}
                className={`border-l-4 ${colorClasses.border} pl-3 py-2`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${colorClasses.text}`}>
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">{activity.actorName}</span>
                      <span className="mx-1">•</span>
                      <span>{activity.relativeTime}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More Button */}
      {hasMore && activities.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/20">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full px-3 py-2 text-sm font-medium text-pastel-blue-600 hover:bg-white/20 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading ? "로딩 중…" : "이전 활동 보기"}
          </button>
        </div>
      )}
    </div>
  );
};
