<p align="center">
  <a href="https://nexus-realtime-chat-yayj.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/🚀_LIVE_DEMO-Nexus_Chat-007bff?style=flat&logo=vercel&logoColor=white">
  </a>
  <br><br>
  
  <img src="https://img.shields.io/badge/.NET_10-512BD4?style=flat&logo=dotnet&logoColor=white">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white">
  <img src="https://img.shields.io/badge/AI_Integration-000000?style=flat&logo=github&logoColor=white">
</p>

## 👥 Authors

- [Nguyễn Lê Hoàng Hảo](https://github.com/hoanghaoz)
- [Trần Quang Hạ](https://github.com/tqha1011)
- [Phan Cao Minh Hiếu](https://github.com/hieupcm03)
- [Tăng Chấn Hồng](https://github.com/24520579)
- [Nguyễn Hoàn Hải](https://github.com/Haibrosh)

## 🛠️ Tech Stack

**Frontend:**
<br>
<a href="https://react.dev/" target="_blank"><img src="https://skillicons.dev/icons?i=react" alt="react" width="45" height="45"/></a>
<a href="https://www.typescriptlang.org/" target="_blank"><img src="https://skillicons.dev/icons?i=ts" alt="typescript" width="45" height="45"/></a>
<a href="https://vitejs.dev/" target="_blank"><img src="https://skillicons.dev/icons?i=vite" alt="vite" width="45" height="45"/></a>

**Backend:**
<br>
<a href="https://dotnet.microsoft.com/" target="_blank"><img src="https://skillicons.dev/icons?i=dotnet" alt="dotnet" width="45" height="45"/></a>
<a href="https://learn.microsoft.com/en-us/dotnet/csharp/" target="_blank"><img src="https://skillicons.dev/icons?i=cs" alt="csharp" width="45" height="45"/></a>

**Database & Cloud:**
<br>
<a href="https://www.mongodb.com/" target="_blank"><img src="https://skillicons.dev/icons?i=mongodb" alt="mongodb" width="45" height="45"/></a>
<a href="https://azure.microsoft.com/" target="_blank"><img src="https://skillicons.dev/icons?i=azure" alt="azure" width="45" height="45"/></a>
<a href="https://vercel.com/" target="_blank"><img src="https://skillicons.dev/icons?i=vercel" alt="vercel" width="45" height="45"/></a>

**DevOps & AI Integration:**
<br>
<a href="https://www.docker.com/" target="_blank"><img src="https://skillicons.dev/icons?i=docker" alt="docker" width="45" height="45"/></a>
<a href="https://git-scm.com/" target="_blank"><img src="https://skillicons.dev/icons?i=git" alt="git" width="45" height="45"/></a>
<a href="https://ollama.com/" target="_blank">
  <img src="https://cdn.simpleicons.org/ollama/FFFFFF" alt="ollama" width="45" height="45"/>
</a>
<a href="https://github.com/features/models" target="_blank"><img src="https://skillicons.dev/icons?i=github" alt="github" width="45" height="45"/></a>

<details>
<summary><b>✨ Key Features & Technical Highlights </b></summary>
<br>
⚡ Ultra-Low Latency Real-time Core:

- Powered by **SignalR** over **WebSockets** to ensure instant message delivery across Direct and Group chats.

- Features an optimized, in-memory Presence Tracker to broadcast exact Online/Offline user statuses system-wide without overloading the database.

🤖 AI-Powered Chat Assistant:

- Deeply integrated with LLMs via **Semantic Kernel** and **GitHub Models**.

- Capabilities include automatic thread summarization and smart intent detection for task reminders.

- AI processing is intelligently offloaded to Background Workers utilizing **the Producer-Consumer pattern**, ensuring the main chat flow remains unblocked and highly responsive.

📂 Asynchronous Media & Hybrid Upload Flow:

- Seamless **Cloudinary** integration for resilient media storage.

- Implements a stream-based upload mechanism to prevent server memory bloat, combined with an optimistic UI update strategy (Hybrid Flow) for instantaneous user feedback.

- Includes a dedicated **Background Worker** for asynchronous URL scraping to generate rich **Link Previews**.

🏛️ High-Performance Enterprise Architecture:

- Strictly adheres to Clean Architecture principles, perfectly isolating the Core Domain from Infrastructure concerns in the **ASP.NET Core 10 ecosystem**.

- Database interactions are heavily optimized using **MongoDB Compound Indexes** strictly following the E-S-R (Equality-Sort-Range) rule.

- Implements **Cursor-based Pagination and Batch Fetching** to completely eliminate N+1 query bottlenecks when loading massive chat histories.

🛡️ Automated Quality Assurance & DevOps:

- Secured by robust **JWT authentication** and **Role-Based Access Control (RBAC)**.

- Maintained by a fully automated CI/CD pipeline using **GitHub Actions**, integrating **SonarCloud** for continuous code inspection and vulnerability scanning.

- Fully containerized using Docker for consistent and reliable deployments.

</details>

## 💻 Visual Showcase

| **Login screen** | **Chat screen** |
| :---: | :---: |
| <img width="1914" height="954" alt="image" src="https://github.com/user-attachments/assets/188c6cd6-0cdc-459e-b7d7-21594b93499c" /> | <img width="1914" height="954" alt="image" src="https://github.com/user-attachments/assets/9b32ca14-9c56-4559-a178-cb0e64d29f01" />|
| Screen đăng nhập | Khung chat |


## 🚀 Deployment

### ⚙️ Prerequisites
> [!NOTE]
> Requirements:
> - .NET 10 SDK
> - Node.js 18+
> - MongoDB 7.0+
> - Docker Desktop

### 1. 🐳 Deploy Backend (ASP.NET Core API)
If you don't have `Docker`, get it from the [official website](https://www.docker.com/) to install `Docker`.

Open your terminal and navigate to the `Backend` folder. Run the below command:
```bash
  docker compose up -d --build
```
Navigate to `http://localhost:<port>/scalar/v1` to see the **API Docs (Scalar)**.

### 2. ⚛️ Deploy Frontend (ReactJS Web App)
The nexus team deploy the website on [vercel](https://vercel.com)

You can visit via this link: [Nexus Chat](https://nexus-realtime-chat-yayj.vercel.app/)


## 📚 Documentation

- [Backend Architecture](docs/architecture/backend-architecture.md)

- [Frontend Architecture](docs/architecture/frontend-architecture.md)

- [Database Design](docs/architecture/database-schema.md)

- [CI/CD Pipeline Guidelines](docs/infrastructure/ci-cd.md)

- [Conventional Commit Guidelines](docs/guildlines/conventional-commit.md)
