/**
 * 템플릿 서비스
 */

import axiosInstance from '@/utils/axios';
import type {
  BoardTemplate,
  CreateTemplateRequest,
  ApplyTemplateRequest,
} from '@/types/template';
import type { Board } from '@/types/board';

export const templateService = {
  /**
   * 공개 템플릿 목록 조회
   */
  async getPublicTemplates(): Promise<BoardTemplate[]> {
    const response = await axiosInstance.get<BoardTemplate[]>('/templates/public');
    return response.data;
  },

  /**
   * 카테고리별 공개 템플릿 조회
   */
  async getPublicTemplatesByCategory(category: string): Promise<BoardTemplate[]> {
    const response = await axiosInstance.get<BoardTemplate[]>(
      `/templates/public/category/${category}`
    );
    return response.data;
  },

  /**
   * 워크스페이스의 템플릿 목록 조회 (공개 + private)
   */
  async getTemplatesByWorkspace(workspaceId: number): Promise<BoardTemplate[]> {
    const response = await axiosInstance.get<BoardTemplate[]>(
      `/templates/workspaces/${workspaceId}`
    );
    return response.data;
  },

  /**
   * 템플릿 상세 조회
   */
  async getTemplate(templateId: number): Promise<BoardTemplate> {
    const response = await axiosInstance.get<BoardTemplate>(`/templates/${templateId}`);
    return response.data;
  },

  /**
   * 기존 보드를 템플릿으로 저장
   */
  async saveAsTemplate(
    workspaceId: number,
    boardId: number,
    request: CreateTemplateRequest
  ): Promise<BoardTemplate> {
    const response = await axiosInstance.post<BoardTemplate>(
      `/templates/workspaces/${workspaceId}/boards/${boardId}`,
      request
    );
    return response.data;
  },

  /**
   * 커스텀 템플릿 생성 (보드 없이 직접 생성)
   */
  async createCustomTemplate(
    workspaceId: number,
    request: CreateTemplateRequest
  ): Promise<BoardTemplate> {
    const response = await axiosInstance.post<BoardTemplate>(
      `/templates/workspaces/${workspaceId}`,
      request
    );
    return response.data;
  },

  /**
   * 템플릿 적용 (템플릿으로부터 새 보드 생성)
   */
  async applyTemplate(
    workspaceId: number,
    request: ApplyTemplateRequest
  ): Promise<Board> {
    const response = await axiosInstance.post<Board>(
      `/templates/workspaces/${workspaceId}/apply`,
      request
    );
    return response.data;
  },

  /**
   * 템플릿 삭제
   */
  async deleteTemplate(templateId: number, workspaceId: number): Promise<void> {
    await axiosInstance.delete(`/templates/${templateId}/workspaces/${workspaceId}`);
  },

  /**
   * 모든 카테고리 목록 조회
   */
  async getAllCategories(): Promise<string[]> {
    const response = await axiosInstance.get<string[]>('/templates/categories');
    return response.data;
  },
};
