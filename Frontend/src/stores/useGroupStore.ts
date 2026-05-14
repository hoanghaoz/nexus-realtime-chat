import { create } from "zustand";
import { toast } from "sonner";
import { groupService } from "@/services/groupService";
import type {
  CreateGroupDto,
  UpdateGroupDto,
  AddMemberDto,
  GroupResponse,
} from "@/services/groupService";
import { useChatStore } from "./useChatStore";

function getResponseStatus(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { status?: unknown } }).response?.status === "number"
    ? (error as { response: { status: number } }).response.status
    : undefined;
}

interface GroupStoreState {
  loading: boolean;

  /** Tạo nhóm mới */
  createGroup: (dto: CreateGroupDto) => Promise<GroupResponse | null>;
  /** Sửa tên nhóm */
  updateGroup: (groupId: string, dto: UpdateGroupDto) => Promise<void>;
  /** Xóa nhóm */
  deleteGroup: (groupId: string) => Promise<void>;
  /** Thêm thành viên */
  addMembers: (groupId: string, dto: AddMemberDto) => Promise<void>;
  /** Xóa thành viên */
  removeMember: (groupId: string, targetUserId: string) => Promise<boolean>;
}

/**
 * useGroupStore – quản lý CRUD nhóm.
 * Tuân thủ pattern của Moji_RealtimeChatApp (không có group store riêng ở Moji,
 * nhưng createConversation nằm trong useChatStore).
 *
 * Nexus tách riêng GroupController với API:
 *   POST   /api/groups/create
 *   PUT    /api/groups/{groupId}/edit name group
 *   DELETE /api/groups/{groupId}/delete group
 *   POST   /api/groups/{groupId}/AddMember
 *   DELETE /api/groups/{groupId}/IdMemberRemove
 *
 * Sau khi tạo nhóm, backend gửi SignalR ReceiveAddedToGroupNotification
 * → useSignalRStore sẽ gọi useChatStore.addConversation()
 */
export const useGroupStore = create<GroupStoreState>((set) => ({
  loading: false,

  createGroup: async (dto) => {
    try {
      set({ loading: true });
      const group = await groupService.createGroup(dto);
      toast.success(`Đã tạo nhóm "${dto.name}" thành công!`);
      return group;
    } catch (error: unknown) {
      console.error("Lỗi khi createGroup:", error);
      const status = getResponseStatus(error);
      if (status === 400) {
        toast.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
      } else {
        toast.error("Tạo nhóm thất bại. Vui lòng thử lại!");
      }
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateGroup: async (groupId, dto) => {
    try {
      set({ loading: true });
      await groupService.updateGroup(groupId, dto);
      // Đồng bộ tên nhóm vào useChatStore ngay lập tức
      useChatStore.setState((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === groupId
            ? { ...c, group: { ...c.group, name: dto.name } }
            : c
        ),
      }));
      toast.success("Cập nhật tên nhóm thành công!");
    } catch (error) {
      console.error("Lỗi khi updateGroup:", error);
      toast.error("Cập nhật nhóm thất bại. Vui lòng thử lại!");
    } finally {
      set({ loading: false });
    }
  },

  deleteGroup: async (groupId) => {
    try {
      set({ loading: true });
      await groupService.deleteGroup(groupId);
      // Xóa cuộc hội thoại khỏi chat store
      useChatStore.setState((state) => ({
        conversations: state.conversations.filter((c) => c._id !== groupId),
        activeConversationId:
          state.activeConversationId === groupId
            ? null
            : state.activeConversationId,
      }));
      toast.success("Đã xóa nhóm thành công!");
    } catch (error) {
      console.error("Lỗi khi deleteGroup:", error);
      toast.error("Xóa nhóm thất bại. Vui lòng thử lại!");
    } finally {
      set({ loading: false });
    }
  },

  addMembers: async (groupId, dto) => {
    try {
      set({ loading: true });
      await groupService.addMembers(groupId, dto);
      // Re-fetch để sync participants mới + giữ nguyên createdBy (role admin)
      await useChatStore.getState().fetchConversations();
      toast.success(`Đã thêm ${dto.participantIds.length} thành viên vào nhóm!`);
    } catch (error: unknown) {
      console.error("Lỗi khi addMembers:", error);
      const status = getResponseStatus(error);
      if (status === 404) {
        toast.error("Không tìm thấy nhóm hoặc thành viên.");
      } else {
        toast.error("Thêm thành viên thất bại. Vui lòng thử lại!");
      }
    } finally {
      set({ loading: false });
    }
  },

  removeMember: async (groupId, targetUserId) => {
    try {
      set({ loading: true });
      await groupService.removeMember(groupId, targetUserId);
      // Xóa participant khỏi conversation trong useChatStore
      useChatStore.setState((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === groupId
            ? { ...c, participants: c.participants.filter((p) => p._id !== targetUserId) }
            : c
        ),
      }));
      toast.success("Đã xóa thành viên khỏi nhóm!");
      return true;
    } catch (error: unknown) {
      console.error("Lỗi khi removeMember:", error);
      const status = getResponseStatus(error);
      if (status === 400) {
        toast.error("Bạn không có quyền xóa thành viên này.");
      } else if (status === 404) {
        toast.error("Không tìm thấy nhóm hoặc thành viên.");
      } else {
        toast.error("Xóa thành viên thất bại. Vui lòng thử lại!");
      }
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
