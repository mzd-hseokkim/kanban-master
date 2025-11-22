import axiosInstance from '@/utils/axios';

export interface ChecklistItem {
  id: number;
  cardId: number;
  content: string;
  position: number;
  isChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistProgress {
  cardId: number;
  totalCount: number;
  checkedCount: number;
  progressPercentage: number;
}

export interface CreateChecklistItemRequest {
  content: string;
}

export interface UpdateChecklistItemRequest {
  content?: string;
  isChecked?: boolean;
}

export interface ReorderChecklistItemRequest {
  newPosition: number;
}

const checklistService = {
  /**
   * 카드의 체크리스트 항목 조회
   */
  async getChecklistItems(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number
  ): Promise<ChecklistItem[]> {
    const response = await axiosInstance.get<ChecklistItem[]>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklist`
    );
    return response.data;
  },

  /**
   * 체크리스트 진행률 조회
   */
  async getChecklistProgress(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number
  ): Promise<ChecklistProgress> {
    const response = await axiosInstance.get<ChecklistProgress>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklist/progress`
    );
    return response.data;
  },

  /**
   * 체크리스트 항목 생성
   */
  async createChecklistItem(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number,
    request: CreateChecklistItemRequest
  ): Promise<ChecklistItem> {
    const response = await axiosInstance.post<ChecklistItem>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklist`,
      request
    );
    return response.data;
  },

  /**
   * 체크리스트 항목 수정 (내용 또는 체크 상태)
   */
  async updateChecklistItem(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number,
    itemId: number,
    request: UpdateChecklistItemRequest
  ): Promise<ChecklistItem> {
    const response = await axiosInstance.put<ChecklistItem>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklist/${itemId}`,
      request
    );
    return response.data;
  },

  /**
   * 체크리스트 항목 삭제
   */
  async deleteChecklistItem(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number,
    itemId: number
  ): Promise<void> {
    await axiosInstance.delete(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklist/${itemId}`
    );
  },

  /**
   * 체크리스트 항목 순서 변경
   */
  async reorderChecklistItem(
    workspaceId: number,
    boardId: number,
    columnId: number,
    cardId: number,
    itemId: number,
    request: ReorderChecklistItemRequest
  ): Promise<ChecklistItem> {
    const response = await axiosInstance.put<ChecklistItem>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards/${cardId}/checklist/${itemId}/position`,
      request
    );
    return response.data;
  },
};

export default checklistService;
