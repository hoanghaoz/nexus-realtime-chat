import api from "./api";

export interface UserProfileResponse {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
}

export interface UserSearchResponse {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface UserUpdateDto {
  displayName?: string;
  bio?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

/**
 * userService – tầng gọi API thuần cho User.
 * Tuân thủ cấu trúc của Moji_RealtimeChatApp/services/userService.ts
 *
 * Nexus API:
 *   GET  /api/users/{id}/profile  → UserProfileResponse
 *   GET  /api/users/search?name=  → UserSearchResponse[]
 *   PUT  /api/users/update        → { message: string }
 */
export const userService = {
  getProfile: async (userId: string): Promise<UserProfileResponse> => {
    const res = await api.get(`/users/${userId}/profile`);
    const data = res.data;
    // Map backend DTO sang frontend DTO
    return {
      id: data.id || userId,
      username: data.username,
      displayName: data.username, // Backend UserName is used as display name
      avatarUrl: data.avatar || data.avatarUrl || null,
      bio: data.bio,
      email: data.email,
      phone: data.phone,
      createdAt: data.createdAt
    };
  },

  /** Tìm kiếm user theo tên/username */
  searchUsers: async (name: string): Promise<UserSearchResponse[]> => {
    const res = await api.get(`/users/search`, { params: { name } });
    return res.data;
  },

  /** Cập nhật thông tin cá nhân của user đang đăng nhập */
  updateProfile: async (dto: UserUpdateDto): Promise<{ message: string }> => {
    const payload = {
      username: dto.displayName,
      avatar: dto.avatarUrl,
      status: 0 // Default
    };
    const res = await api.put(`/users/update`, payload);
    return res.data;
  },
};
