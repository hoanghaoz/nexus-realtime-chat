import api from "./api";

export interface CreateGroupDto {
  name: string;
  participantIds: string[];
}

export interface UpdateGroupDto {
  name: string;
}

export interface AddMemberDto {
  participantIds: string[];
}

export interface GroupResponse {
  id: string;
  name: string;
  participantIds: string[];
  createdBy: string;
  createdAt?: string;
}

function readString(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
  }
  return "";
}

function readStringArray(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function normalizeGroupResponse(data: unknown): GroupResponse {
  const source = typeof data === "object" && data !== null ? data as Record<string, unknown> : {};

  return {
    id: readString(source, "id", "Id", "_id"),
    name: readString(source, "name", "Name"),
    participantIds: readStringArray(source, "participantIds", "ParticipantIds"),
    createdBy: readString(source, "createdBy", "CreatedBy"),
    createdAt: readString(source, "createdAt", "CreatedAt") || undefined,
  };
}

/**
 * groupService – tầng gọi API thuần cho Group.
 * Tuân thủ cấu trúc pattern của Moji_RealtimeChatApp.
 *
 * Nexus API:
 *   POST   /api/groups/create                        → GroupResponse
 *   PUT    /api/groups/{groupId}/edit name group     → GroupResponse
 *   DELETE /api/groups/{groupId}/delete group        → { message }
 *   POST   /api/groups/{groupId}/AddMember           → GroupResponse
 *   DELETE /api/groups/{groupId}/IdMemberRemove      → { message }
 *
 * Lưu ý: Backend GroupController gửi SignalR notification ReceiveAddedToGroupNotification
 * sau khi tạo nhóm thành công → Frontend cần lắng nghe qua useSignalRStore.
 */
export const groupService = {
  /** Tạo nhóm mới */
  createGroup: async (dto: CreateGroupDto): Promise<GroupResponse> => {
    const res = await api.post("/groups/create", dto);
    return normalizeGroupResponse(res.data);
  },

  /** Sửa tên nhóm */
  updateGroup: async (
    groupId: string,
    dto: UpdateGroupDto
  ): Promise<GroupResponse> => {
    const res = await api.put(`/groups/${groupId}/edit name group`, dto);
    return normalizeGroupResponse(res.data);
  },

  /** Xóa nhóm */
  deleteGroup: async (groupId: string): Promise<{ message: string }> => {
    const res = await api.delete(`/groups/${groupId}/delete group`);
    return res.data;
  },

  /** Thêm thành viên vào nhóm */
  addMembers: async (
    groupId: string,
    dto: AddMemberDto
  ): Promise<GroupResponse> => {
    const res = await api.post(`/groups/${groupId}/AddMember`, dto);
    return normalizeGroupResponse(res.data);
  },

  /** Xóa thành viên khỏi nhóm */
  removeMember: async (
    groupId: string,
    targetUserId: string
  ): Promise<{ message: string }> => {
    const res = await api.delete(
      `/groups/${groupId}/IdMemberRemove`,
      { params: { targetUserId } }
    );
    return res.data;
  },
};
