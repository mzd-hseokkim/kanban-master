/**
 * 라벨 타입 정의
 */
export interface Label {
  id: number;
  boardId: number;
  name: string;
  colorToken: string;
  description?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 라벨 생성 요청
 */
export interface CreateLabelRequest {
  name: string;
  colorToken: string;
  description?: string;
}

/**
 * 라벨 수정 요청
 */
export interface UpdateLabelRequest {
  name: string;
  colorToken: string;
  description?: string;
}

/**
 * 라벨 순서 변경 요청
 */
export interface ReorderLabelsRequest {
  labelIds: number[];
}

/**
 * 카드-라벨 관계
 */
export interface CardLabel {
  id: number;
  cardId: number;
  labelId: number;
  createdAt: string;
  updatedAt: string;
}
