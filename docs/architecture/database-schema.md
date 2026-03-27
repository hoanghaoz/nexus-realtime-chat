# 🗄️ Database Architecture & Schema Design

**Project:** NexusChat
**Technology Stack:** MongoDB, ASP.NET Core Web API
**Last Updated:** March 27, 2026

---

## 1. Why Choose MongoDB for a Real-time Chat System?

Real-time messaging systems have specific characteristics that make NoSQL databases like MongoDB a significantly better fit compared to traditional SQL (RDBMS) databases:

* **Schema-less Flexibility:** Message structures are highly dynamic. A message might only contain `text` today, but could easily evolve to include `attachments` (files, images) or `reactions` (hearts, likes) tomorrow. Document-based storage (JSON/BSON) allows adding these fields effortlessly without complex `ALTER TABLE` migrations or excessive JOINs.
* **Query Optimization via Embedded Documents:** Tightly coupled data, such as `participants` and the `lastMessage`, are embedded directly into the `Conversations` collection. When loading the chat list, the system only needs a single query instead of executing expensive JOIN operations across multiple tables.
* **High Write Performance:** Chat applications generate a massive and continuous volume of Insert operations (new messages). MongoDB is renowned for handling write-heavy workloads with extremely low latency, making it the perfect companion for SignalR.
* **Easy Scalability:** Chat data grows exponentially. MongoDB's distributed architecture natively supports Sharding, allowing the system to scale horizontally when user traffic spikes.

---

## 2. Schema Diagram

<img width="1536" height="606" alt="image" src="https://github.com/user-attachments/assets/64f4e25c-5a9e-4f18-8a23-cb60dfda3950" />


---

## 3. Collections Detail

Below is the detailed specification of the 4 core collections in the system.

### 3.1. Users
Stores user identity information and current status.
* `_id` (string): Primary key (ObjectId).
* `username` (string): Login name (Unique).
* `password_hash` (string): Hashed password.
* `avatar` (string): URL path to the user's avatar image.
* `status` (string): Display status (e.g., Online, Offline, Busy).
* `friendIds` (array of strings): List of friend IDs (References `Users._id`).
* `createdAt` (datetime): Account creation timestamp.
* `updatedAt` (datetime): Last profile update timestamp.

### 3.2. Conversations
Manages chat sessions (Direct Messages or Group Chats).
* `_id` (string): Primary key.
* `type` (string): Type of conversation (e.g., `direct`, `group`).
* `name` (string): Group name (Can be null for 1-1 chats).
* `createdBy` (string): ID of the user who created the group (References `Users._id`).
* `participants` (array of objects): List of members. Object structure: `{ userId, role, joinedAt }`.
* `lastMessage` (object): Denormalized last message to optimize loading the chat list without querying the Messages collection. Structure: `{ content, senderId, createdAt }`.
* `unreadCounts` (array of objects): Tracks unread messages for each member. Structure: `{ userId, count }`.
* `createdAt` (datetime): Conversation creation timestamp.
* `updatedAt` (datetime): Timestamp of the latest activity.

### 3.3. Messages
Stores the actual communication data. The structure is optimized for high-frequency writes.
* `_id` (string): Primary key.
* `conversationId` (string): ID of the conversation (References `Conversations._id`).
* `fromUserId` (string): ID of the sender (References `Users._id`).
* `content` (string): Text content of the message.
* `attachments` (array of objects): Array of attached files. Structure: `{ fileUrl, fileName, fileType, fileSize }`.
* `reactions` (array of objects): Array of message reactions. Structure: `{ userId, emoji, createdAt }`.
* `isDeleted` (boolean): Flag indicating if the message was recalled/deleted (Default: `false`).
* `createdAt` (datetime): Timestamp when the message was sent.

### 3.4. FriendRequests
Handles friend request logic independently to prevent the Users collection from bloating.
* `_id` (string): Primary key.
* `fromUserId` (string): ID of the sender (References `Users._id`).
* `toUserId` (string): ID of the receiver (References `Users._id`).
* `status` (string): Request status (e.g., `pending`, `accepted`, `rejected`).
* `createdAt` (datetime): Timestamp when the request was sent.
