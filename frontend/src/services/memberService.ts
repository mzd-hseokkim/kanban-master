import axiosInstance from '@/utils/axios';
import type { BoardMember, InviteMemberRequest, ChangeRoleRequest } from '@/types/member';

export const memberService = {
  /**
   * 보드의 모든 멤버 조회
   */
  async getBoardMembers(boardId: number): Promise<BoardMember[]> {
    const response = await axiosInstance.get(`/boards/${boardId}/members`);
    return response.data;
  },

  /**
   * 보드의 멤버 페이지네이션 조회
   */
  async getBoardMembersPage(
    boardId: number,
    page: number = 0,
    size: number = 20
  ): Promise<{ content: BoardMember[]; totalElements: number; totalPages: number }> {
    const response = await axiosInstance.get(
      `/boards/${boardId}/members/page`,
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * 멤버 초대
   */
  async inviteMember(boardId: number, data: InviteMemberRequest): Promise<BoardMember> {
    const response = await axiosInstance.post(`/boards/${boardId}/members`, data);
    return response.data;
  },

  /**
   * 멤버 권한 변경
   */
  async changeMemberRole(
    boardId: number,
    memberId: number,
    data: ChangeRoleRequest
  ): Promise<BoardMember> {
    const response = await axiosInstance.patch(
      `/boards/${boardId}/members/${memberId}`,
      undefined,
      { params: { role: data.role } }
    );
    return response.data;
  },

  /**
   * 멤버 제거
   */
  async removeMember(boardId: number, memberId: number): Promise<void> {
    await axiosInstance.delete(`/boards/${boardId}/members/${memberId}`);
  },

  /**
   * 초대 수락
   */
  async acceptInvitation(token: string): Promise<BoardMember> {
    const response = await axiosInstance.post(
      `/members/invitations/accept`,
      undefined,
      { params: { token } }
    );
    return response.data;
  },

  /**
   * 초대 거절
   */
  async declineInvitation(token: string): Promise<void> {
    await axiosInstance.post(
      `/members/invitations/decline`,
      undefined,
      { params: { token } }
    );
  },

  /**
   * 멤버 정보 조회
   */
  async getMember(boardId: number, memberId: number): Promise<BoardMember> {
    const response = await axiosInstance.get(`/boards/${boardId}/members/${memberId}`);
    return response.data;
  },

  /**
   * 현재 사용자의 대기 중인 초대 조회
   */
  async getPendingInvitations(): Promise<BoardMember[]> {
    const response = await axiosInstance.get('/members/invitations/pending');
    return response.data;
  },
};
