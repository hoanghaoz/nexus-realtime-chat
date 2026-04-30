export type GroupAvatar =
  | {
      id: string;
      type: "image";
      src: string;
      className: string;
    }
  | {
      id: string;
      type: "text";
      text: string;
      className: string;
    };

export interface GroupItemData {
  id: string;
  name: string;
  membersText: string;
  timeText: string;
  active?: boolean;
  avatars: GroupAvatar[];
}

export interface FriendItemData {
  id: string;
  name: string;
  subtitle: string;
  subtitleClassName: string;
  timeText: string;
  avatarSrc: string;
  avatarClassName: string;
  statusDotClassName: string;
}

export interface ChatMessageData {
  id: string;
  type: "other" | "me" | "typing";
  text?: string;
  sender?: string;
  timeText?: string;
  avatarSrc?: string;
}

export interface GroupItemProps {
  group: GroupItemData;
}

export interface FriendItemProps {
  friend: FriendItemData;
}

export interface MessageBubbleProps {
  message: ChatMessageData;
}
