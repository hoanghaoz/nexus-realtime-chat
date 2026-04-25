# SignalR Integration Guide (Frontend)

This document explains exactly how Frontend (Web/Mobile) integrates with backend SignalR for chat realtime features.

## 1) Endpoint and Authentication

- Hub URL: `/hubs/chat`
- Auth: JWT required (`[Authorize]` on `ChatHub`)
- Backend extracts token from **query string `access_token`** for this hub.

### IMPORTANT: Token must be sent via Query Parameter

For this backend, SignalR JWT is read from:

- `GET /hubs/chat?access_token=<jwt>`

Do **not** rely on normal HTTP `Authorization` header for WebSocket handshake here.

Use URL query parameter `access_token`.

Example full URL:

```text
https://your-api-domain.com/hubs/chat?access_token=eyJhbGciOi...
```

### JavaScript/TypeScript connection example

```ts
import * as signalR from "@microsoft/signalr";

const token = getJwtToken();
const baseUrl = "https://your-api-domain.com";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${baseUrl}/hubs/chat?access_token=${encodeURIComponent(token)}`)
  .withAutomaticReconnect()
  .build();

await connection.start();
```

### Mobile note

If you use a mobile SignalR client, ensure the connection URL still includes:

- `?access_token=<jwt>`

---

## 2) BIG NOTE: Case Sensitivity (Read Carefully)

> IMPORTANT
>
> Backend C# models use **PascalCase** (`MessageId`, `ConversationId`, `CreatedAt`).
> But JSON payload received by Frontend should be treated as **camelCase** (`messageId`, `conversationId`, `createdAt`).
>
> All payload examples in this document are intentionally written in **camelCase**.

---

## 3) Two Integration Flows

### Flow 1: Server -> Client (`connection.on`)

Frontend listens for server-pushed events.

### Flow 2: Client -> Server (`connection.invoke`)

Frontend calls hub methods explicitly.

---

## 4) Flow 1 - Server -> Client Events (`connection.on`)

## Event: `ReceiveMessage`

- When: new message is created and broadcast to conversation members.
- Listen:

```ts
connection.on("ReceiveMessage", (message) => {
  // update message list
});
```

Mock payload:

```json
{
  "messageId": "msg_9f3d1",
  "userId": "user_001",
  "content": "Hello team",
  "conversationId": "conv_123",
  "createdAt": "2026-04-23T09:15:00Z",
  "attachments": [
    {
      "attachmentType": "file",
      "fileUrl": "https://cdn.example.com/files/spec.pdf",
      "fileName": "spec.pdf",
      "fileSize": 120034,
      "type": 4,
      "createdAt": "2026-04-23T09:15:00Z"
    },
    {
      "attachmentType": "link_preview",
      "type": 5,
      "previewLinkUrl": "https://example.com/article",
      "title": "Example Article",
      "description": "Quick summary",
      "imageUrl": "https://example.com/cover.jpg",
      "createdAt": "2026-04-23T09:15:00Z"
    }
  ],
  "reactions": [
    {
      "fromUserId": "user_010",
      "emoji": ":fire:"
    }
  ],
  "mentionUser": ["user_002", "user_003"],
  "isDeleted": false,
  "isEdited": false,
  "deletedAt": null,
  "editedAt": null
}
```

## Event: `NotifyUserJoined`

- When: a user invokes `JoinGroup`.
- Listen:

```ts
connection.on("NotifyUserJoined", (userId, conversationId) => {
  // show joined status
});
```

Mock payload:

```json
{
  "userId": "user_002",
  "conversationId": "conv_123"
}
```

## Event: `NotifyUserLeft`

- When: a user invokes `LeaveGroup`.

```ts
connection.on("NotifyUserLeft", (userId, conversationId) => {
  // show left status
});
```

Mock payload:

```json
{
  "userId": "user_002",
  "conversationId": "conv_123"
}
```

## Event: `UserTypingNotify`

- When: a user invokes `SendTypingIndicator`.

```ts
connection.on("UserTypingNotify", (userId, conversationId, isTyping) => {
  // typing indicator UI
});
```

Mock payload:

```json
{
  "userId": "user_002",
  "conversationId": "conv_123",
  "isTyping": true
}
```

## Event: `UserGotTaggedNotify`

- When: sender mentions users in `SendMessage` (`mentionedUsersId`).

```ts
connection.on("UserGotTaggedNotify", (message) => {
  // personal mention alert
});
```

Mock payload:

```json
{
  "messageId": "msg_mention_01",
  "userId": "user_001",
  "content": "@john please review",
  "conversationId": "conv_123",
  "createdAt": "2026-04-23T09:16:00Z",
  "attachments": [],
  "reactions": [],
  "mentionUser": ["user_002"],
  "isDeleted": false,
  "isEdited": false,
  "deletedAt": null,
  "editedAt": null
}
```

## Event: `ReceiveFriendRequest`

- When: backend pushes friend request notification.

```ts
connection.on("ReceiveFriendRequest", (request) => {
  // friend request badge
});
```

Mock payload:

```json
{
  "id": "fr_001",
  "fromUserId": "user_050",
  "fromName": "Alice",
  "fromAvatar": "https://cdn.example.com/avatar/alice.jpg",
  "createdAt": "2026-04-23T08:00:00Z"
}
```

## Event: `ReceiveAcceptFriendNotification`

- When: friend request is accepted.

```ts
connection.on("ReceiveAcceptFriendNotification", (payload) => {
  // friend list update
});
```

Mock payload:

```json
{
  "acceptorId": "user_050",
  "acceptorName": "Alice",
  "acceptorAvatar": "https://cdn.example.com/avatar/alice.jpg",
  "acceptedAt": "2026-04-23T08:10:00Z"
}
```

## Event: `ReceiveErrorMessage`

- When: hub-side validation/business error during invoke (for example send message fails).

```ts
connection.on("ReceiveErrorMessage", (message) => {
  // show error toast
});
```

Mock payload:

```json
{
  "message": "Conversation not found"
}
```

## Event: `MessageUpdateNotify`

- When: message edited.

```ts
connection.on("MessageUpdateNotify", (conversationId, messageId, newContent) => {
  // patch message content
});
```

Mock payload:

```json
{
  "conversationId": "conv_123",
  "messageId": "msg_9f3d1",
  "newContent": "Updated message content"
}
```

## Event: `MessageDeleteNotify`

- When: message deleted.

```ts
connection.on("MessageDeleteNotify", (conversationId, messageId) => {
  // mark message as deleted
});
```

Mock payload:

```json
{
  "conversationId": "conv_123",
  "messageId": "msg_9f3d1"
}
```

## Event: `MessageReactNotify`

- When: anyone reacts to a message in a conversation.

```ts
connection.on("MessageReactNotify", (conversationId, messageId, emoji, fromUserId) => {
  // append/update reaction
});
```

Mock payload:

```json
{
  "conversationId": "conv_123",
  "messageId": "msg_9f3d1",
  "emoji": ":heart:",
  "fromUserId": "user_020"
}
```

## Event: `ReceiveToastNotification`

- When: message owner receives reaction toast (not sent to self-react).

```ts
connection.on("ReceiveToastNotification", (fromUserId, messageId, emoji) => {
  // toast: someone reacted to your message
});
```

Mock payload:

```json
{
  "fromUserId": "user_020",
  "messageId": "msg_9f3d1",
  "emoji": ":heart:"
}
```

## Event: `ReceiveAddedToGroupNotification`

- When: backend creates group / adds users and pushes group info.

```ts
connection.on("ReceiveAddedToGroupNotification", (group) => {
  // add group to sidebar
});
```

Mock payload:

```json
{
  "id": "group_001",
  "name": "Backend Team",
  "roomType": 2,
  "createdBy": "user_001",
  "createdAt": "2026-04-23T07:45:00Z"
}
```

## Event: `UpdateLinkPreview`

- When: worker resolves link metadata and pushes back to conversation.

```ts
connection.on("UpdateLinkPreview", (payload) => {
  // replace link preview attachment in a message
});
```

Mock payload:

```json
{
  "messageId": "msg_200",
  "attachment": {
    "url": "https://example.com/article",
    "title": "Example Article",
    "description": "Detailed description",
    "imageUrl": "https://example.com/preview.jpg",
    "siteName": "Example",
    "favicon": "https://example.com/favicon.ico"
  }
}
```

---

## 5) Flow 2 - Client -> Server Methods (`connection.invoke`)

## Method: `JoinGroup`

```ts
await connection.invoke("JoinGroup", "conv_123");
```

Mock argument payload:

```json
{
  "groupName": "conv_123"
}
```

## Method: `LeaveGroup`

```ts
await connection.invoke("LeaveGroup", "conv_123");
```

Mock argument payload:

```json
{
  "groupName": "conv_123"
}
```

## Method: `SendMessage`

```ts
await connection.invoke("SendMessage", {
  conversationId: "conv_123",
  content: "Hello from FE",
  attachments: [],
  mentionedUsersId: ["user_002"]
});
```

Mock argument payload:

```json
{
  "conversationId": "conv_123",
  "content": "Hello from FE",
  "attachments": [
    {
      "attachmentType": "file",
      "fileUrl": "https://cdn.example.com/files/report.docx",
      "fileName": "report.docx",
      "fileSize": 523000,
      "type": 4,
      "createdAt": "2026-04-23T09:20:00Z"
    },
    {
      "attachmentType": "link_preview",
      "previewLinkUrl": "https://example.com/docs",
      "title": "Docs",
      "description": "Project docs",
      "imageUrl": "https://example.com/docs-cover.png",
      "createdAt": "2026-04-23T09:20:00Z"
    }
  ],
  "mentionedUsersId": ["user_002", "user_003"]
}
```

## Method: `TagAllMemberInGroup`

Use same payload schema as `SendMessage`.

```ts
await connection.invoke("TagAllMemberInGroup", {
  conversationId: "conv_123",
  content: "@all Standup in 5 minutes",
  attachments: [],
  mentionedUsersId: null
});
```

Mock argument payload:

```json
{
  "conversationId": "conv_123",
  "content": "@all Standup in 5 minutes",
  "attachments": [],
  "mentionedUsersId": null
}
```

## Method: `SendTypingIndicator`

```ts
await connection.invoke("SendTypingIndicator", "conv_123", true);
```

Mock argument payload:

```json
{
  "conversationId": "conv_123",
  "isTyping": true
}
```

---

## 6) DTO Reference (Quick Mapping)

### SendMessageRequestDto (invoke input)

```json
{
  "conversationId": "string",
  "content": "string | null",
  "attachments": "attachmentBaseDto[] | null",
  "mentionedUsersId": "string[] | null"
}
```

### MessageResponseDto (server event payload)

```json
{
  "messageId": "string",
  "userId": "string",
  "content": "string | null",
  "conversationId": "string",
  "createdAt": "ISO datetime",
  "attachments": "attachmentBaseDto[]",
  "reactions": "reactionDto[]",
  "mentionUser": "string[]",
  "isDeleted": "boolean",
  "isEdited": "boolean",
  "deletedAt": "ISO datetime | null",
  "editedAt": "ISO datetime | null"
}
```

### AttachmentBaseDto polymorphism

- `attachmentType: "file"` => file attachment shape
- `attachmentType: "link_preview"` => link preview attachment shape

### Enum hints

- `roomType`: `1 = direct`, `2 = group`
- `type` (file type): `1 = image`, `2 = video`, `3 = audio`, `4 = document`, `5 = linkPreview`

---

## 7) Frontend Implementation Checklist

- Connect to `/hubs/chat` with `?access_token=<jwt>`.
- Register all `connection.on(...)` listeners before `connection.start()`.
- After connected, call `JoinGroup(conversationId)` before expecting group events.
- Use exact method names/events (case-sensitive): `SendMessage`, `ReceiveMessage`, etc.
- Keep all payload handling in **camelCase**.
- Gracefully handle reconnect and re-join active conversation groups.

This contract is enough for Frontend to integrate SignalR chat without additional backend clarification.


