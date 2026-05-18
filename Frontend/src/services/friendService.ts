import api from "./api";
import type { FriendRequest } from "@/types/user";

export interface FriendResponseDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
}

export interface PendingRequestDto {
  id: string;           // requestId
  senderId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  sentAt: string;
}

export interface FriendshipStatusResponse {
  status: "None" | "Pending" | "Friend";
}

/**
 * friendService – tầng gọi API thuần cho Friend.
 * Tuân thủ cấu trúc của Moji_RealtimeChatApp/services/friendService.ts
 *
 * Nexus API:
 *   GET  /api/friends-list                    → FriendResponseDto[]
 *   GET  /api/friends-list/search?keyword=    → FriendResponseDto[]
 *   GET  /api/friend-requests/status/{id}     → { status }
 *   GET  /api/friend-requests/pending         → PendingRequestDto[]
 *   POST /api/friend-requests                 → { message }
 *   PUT  /api/friend-requests/{id}/accept     → { message }
 *   PUT  /api/friend-requests/{id}/decline    → { message }
 */
export const friendService = {
  /** Lấy danh sách bạn bè của user đang đăng nhập */
  getFriendList: async (): Promise<FriendResponseDto[]> => {
    const res = await api.get("/friends-list");
    return res.data.map((item: any) => ({
      id: item.id,
      username: item.userName || item.username,
      displayName: item.userName || item.username,
      avatarUrl: item.avatar || item.avatarUrl,
      isOnline: item.isOnline,
    }));
  },

  /** Tìm kiếm trong danh sách bạn bè theo keyword */
  searchFriends: async (keyword: string): Promise<FriendResponseDto[]> => {
    const res = await api.get("/friends-list/search", { params: { keyword } });
    return res.data.map((item: any) => ({
      id: item.id,
      username: item.userName || item.username,
      displayName: item.userName || item.username,
      avatarUrl: item.avatar || item.avatarUrl,
      isOnline: item.isOnline,
    }));
  },

  /** Kiểm tra trạng thái quan hệ với user khác */
  getFriendshipStatus: async (
    receiverId: string
  ): Promise<FriendshipStatusResponse> => {
    const res = await api.get(`/friend-requests/status/${receiverId}`);
    return res.data;
  },

  /** Gửi yêu cầu kết bạn tới receiverId */
  sendFriendRequest: async (receiverId: string): Promise<{ message: string }> => {
    const res = await api.post("/friend-requests", { toUserId: receiverId });
    return res.data;
  },

  /** Lấy danh sách lời mời kết bạn đang chờ (received) */
  getPendingRequests: async (): Promise<PendingRequestDto[]> => {
    const res = await api.get("/friend-requests/pending");
    return res.data.map((item: any) => ({
      id: item.id,
      senderId: item.fromUserId,
      username: item.fromName,
      displayName: item.fromName,
      avatarUrl: item.fromAvatar,
      sentAt: item.createdAt,
    }));
  },

  /** Đồng ý kết bạn */
  acceptRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await api.put(`/friend-requests/${requestId}/accept`);
    return res.data;
  },

  /** Từ chối kết bạn */
  declineRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await api.put(`/friend-requests/${requestId}/decline`);
    return res.data;
  },
};
