/**
 * 템플릿 관련 타입 정의
 */

export interface TemplateColumn {
  id?: number;
  name: string;
  description?: string;
  position: number;
  bgColor?: string;
}

export interface BoardTemplate {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  workspaceId?: number;
  columns: TemplateColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  columns?: TemplateColumn[];
}

export interface ApplyTemplateRequest {
  templateId: number;
  boardName: string;
  boardDescription?: string;
}
