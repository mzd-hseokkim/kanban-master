/**
 * 검색 서비스
 */

import type { CardSearchRequest, CardSearchResult } from '@/types/search';
import axiosInstance from '@/utils/axios';

export const searchService = {
  /**
   * 보드 내 카드 검색
   */
  async searchCardsInBoard(
    boardId: number,
    request: CardSearchRequest
  ): Promise<CardSearchResult[]> {
    const params = new URLSearchParams();

    if (request.keyword) params.append('keyword', request.keyword);
    if (request.priorities?.length) {
      request.priorities.forEach(p => params.append('priorities', p));
    }
    if (request.assigneeIds?.length) {
      request.assigneeIds.forEach(id => params.append('assigneeIds', id.toString()));
    }
    if (request.labelIds?.length) {
      request.labelIds.forEach(id => params.append('labelIds', id.toString()));
    }
    if (request.isCompleted !== undefined) {
      params.append('isCompleted', request.isCompleted.toString());
    }
    if (request.dueDateFrom) params.append('dueDateFrom', request.dueDateFrom);
    if (request.dueDateTo) params.append('dueDateTo', request.dueDateTo);
    if (request.overdue !== undefined) {
      params.append('overdue', request.overdue.toString());
    }

    const response = await axiosInstance.get<CardSearchResult[]>(
      `/search/boards/${boardId}/cards?${params.toString()}`
    );
    return response.data;
  },

  /**
   * 워크스페이스 내 카드 검색
   */
  async searchCardsInWorkspace(
    workspaceId: number,
    request: CardSearchRequest
  ): Promise<CardSearchResult[]> {
    const params = new URLSearchParams();

    if (request.keyword) params.append('keyword', request.keyword);
    if (request.priorities?.length) {
      request.priorities.forEach(p => params.append('priorities', p));
    }
    if (request.assigneeIds?.length) {
      request.assigneeIds.forEach(id => params.append('assigneeIds', id.toString()));
    }
    if (request.labelIds?.length) {
      request.labelIds.forEach(id => params.append('labelIds', id.toString()));
    }
    if (request.isCompleted !== undefined) {
      params.append('isCompleted', request.isCompleted.toString());
    }
    if (request.dueDateFrom) params.append('dueDateFrom', request.dueDateFrom);
    if (request.dueDateTo) params.append('dueDateTo', request.dueDateTo);
    if (request.overdue !== undefined) {
      params.append('overdue', request.overdue.toString());
    }

    const response = await axiosInstance.get<CardSearchResult[]>(
      `/search/workspaces/${workspaceId}/cards?${params.toString()}`
    );
    return response.data;
  },

  /**
   * 워크스페이스 내 보드 검색
   */
  async searchBoards(
    workspaceId: number,
    keyword: string
  ): Promise<import('@/types/search').BoardSearchResult[]> {
    const response = await axiosInstance.get<import('@/types/search').BoardSearchResult[]>(
      `/search/workspaces/${workspaceId}/boards`,
      { params: { keyword } }
    );
    return response.data;
  },

  /**
   * 워크스페이스 내 칼럼 검색
   */
  async searchColumns(
    workspaceId: number,
    keyword: string
  ): Promise<import('@/types/search').ColumnSearchResult[]> {
    const response = await axiosInstance.get<import('@/types/search').ColumnSearchResult[]>(
      `/search/workspaces/${workspaceId}/columns`,
      { params: { keyword } }
    );
    return response.data;
  },
};
