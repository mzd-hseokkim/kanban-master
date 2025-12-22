import type {
  ApiTokenSummaryResponse,
  CreateApiTokenRequest,
  CreateApiTokenResponse,
} from '@/types/apiToken';
import axiosInstance from '@/utils/axios';

export const apiTokenService = {
  async listTokens(): Promise<ApiTokenSummaryResponse[]> {
    const response = await axiosInstance.get<ApiTokenSummaryResponse[]>('/api-tokens');
    return response.data;
  },

  async createToken(payload: CreateApiTokenRequest): Promise<CreateApiTokenResponse> {
    const response = await axiosInstance.post<CreateApiTokenResponse>('/api-tokens', payload);
    return response.data;
  },

  async revokeToken(tokenId: number): Promise<void> {
    await axiosInstance.delete(`/api-tokens/${tokenId}`);
  },
};
