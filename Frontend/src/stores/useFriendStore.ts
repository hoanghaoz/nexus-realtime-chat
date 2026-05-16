import { create } from "zustand";
import { toast } from "sonner";
import { friendService } from "@/services/friendService";
import type {
  FriendResponseDto,
  PendingRequestDto,
  FriendshipStatusResponse,
} from "@/services/friendService";

interface FriendStoreState {
  friends: FriendResponseDto[];
  pendingRequests: PendingRequestDto[];
  loading: boolean;

  /** Lấy danh sách bạn bè */
  getFriends: () => Promise<void>;
  /** Tìm kiếm bạn bè theo keyword */
  searchFriends: (keyword: string) => Promise<FriendResponseDto[]>;
  /** Kiểm tra trạng thái quan hệ với user khác */
  getFriendshipStatus: (receiverId: string) => Promise<FriendshipStatusResponse | null>;
  /** Gửi yêu cầu kết bạn */
  sendFriendRequest: (receiverId: string) => Promise<void>;
  /** Lấy danh sách lời mời kết bạn đang chờ */
  getPendingRequests: () => Promise<void>;
  /** Đồng ý kết bạn */
  acceptRequest: (requestId: string) => Promise<void>;
  /** Từ chối kết bạn */
  declineRequest: (requestId: string) => Promise<void>;
}

/**
 * useFriendStore – quản lý state bạn bè.
 * Tuân thủ kiến trúc của Moji_RealtimeChatApp/stores/useFriendStore.ts
 *
 * Khác biệt Nexus vs Moji:
 * - Nexus: PUT /friend-requests/{id}/accept|decline (không phải POST)
 * - Nexus: POST /friend-requests với { receiverId } (không phải { to, message })
 * - Nexus: GET /friends-list (không phải /friends)
 * - PendingRequests: chỉ lấy received (Nexus không trả về sent list)
 */
export const useFriendStore = create<FriendStoreState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  loading: false,

  getFriends: async () => {
    try {
      set({ loading: true });
      const friends = await friendService.getFriendList();
      set({ friends });
    } catch (error) {
      console.error("Lỗi khi getFriends:", error);
      set({ friends: [] });
      toast.error("Không thể tải danh sách bạn bè.");
    } finally {
      set({ loading: false });
    }
  },

  searchFriends: async (keyword) => {
    try {
      set({ loading: true });
      return await friendService.searchFriends(keyword);
    } catch (error) {
      console.error("Lỗi khi searchFriends:", error);
      return [];
    } finally {
      set({ loading: false });
    }
  },

  getFriendshipStatus: async (receiverId) => {
    try {
      return await friendService.getFriendshipStatus(receiverId);
    } catch (error) {
      console.error("Lỗi khi getFriendshipStatus:", error);
      return null;
    }
  },

  sendFriendRequest: async (receiverId) => {
    try {
      set({ loading: true });
      const data = await friendService.sendFriendRequest(receiverId);
      toast.success(data.message || "Đã gửi lời mời kết bạn!");
    } catch (error: any) {
      console.error("Lỗi khi sendFriendRequest:", error);
      const status = error?.response?.status;
      if (status === 409) {
        toast.error("Bạn đã gửi lời mời kết bạn rồi.");
      } else {
        toast.error("Gửi lời mời kết bạn thất bại. Vui lòng thử lại!");
      }
    } finally {
      set({ loading: false });
    }
  },

  getPendingRequests: async () => {
    try {
      set({ loading: true });
      const requests = await friendService.getPendingRequests();
      set({ pendingRequests: requests });
    } catch (error) {
      console.error("Lỗi khi getPendingRequests:", error);
    } finally {
      set({ loading: false });
    }
  },

  acceptRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.acceptRequest(requestId);
      // Xóa khỏi danh sách pending
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
      }));
      // Refresh danh sách bạn bè
      await get().getFriends();
      toast.success("Đã chấp nhận lời mời kết bạn!");
    } catch (error) {
      console.error("Lỗi khi acceptRequest:", error);
      toast.error("Chấp nhận thất bại. Vui lòng thử lại!");
    } finally {
      set({ loading: false });
    }
  },

  declineRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.declineRequest(requestId);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
      }));
      toast.success("Đã từ chối lời mời kết bạn.");
    } catch (error) {
      console.error("Lỗi khi declineRequest:", error);
      toast.error("Từ chối thất bại. Vui lòng thử lại!");
    } finally {
      set({ loading: false });
    }
  },
}));
