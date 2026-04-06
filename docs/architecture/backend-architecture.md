# 🏛️ Backend System Architecture

This project implements the **Clean Architecture** pattern, ensuring separation of concerns, scalability, and maintainability. The backend is divided into 4 distinct layers:

## 1. 🧱 Domain Layer (`NexusChat.Domain`)
- The core of the system. Contains entities (e.g., `User`, `Message`, `ChatRoom`) and enums.
- **Rule:** Does not depend on any other layers.

## 2. 💼 Application Layer (`NexusChat.Application`)
- Contains `Interfaces`, `Services`, `DTOs`, and `Validators`.
- Implements the core business logic and messaging workflows.
- **Rule:** Depends only on the **Domain Layer**.

## 3. 🛠️ Infrastructure Layer (`NexusChat.Infrastructure`)
- Implements the interfaces defined in the Application layer (e.g., **Repository Interfaces**).
- Connects to the Database through **Entity Framework Core**.
- Handles external integrations such as Identity providers, JWT Generation, and Caching.
- **Rule:** Depends on the **Application** and **Domain** layers.

## 4. 🌐 API Layer (`NexusChat.Api`)
- The entry point of the system. Contains RESTful endpoints and Real-time `Hubs` (SignalR).
- Manages `Middleware` (Error handling, Authentication) and Dependency Injection in `Program.cs`.
- Integrates API Documentation (**Swagger/Scalar**).
- **Rule:** Depends on the **Infrastructure** and **Application** layers.

---

## 🧰 Tech Stack & Patterns
- **Framework:** .NET 10 Web API
- **Real-time Communication:** SignalR (WebSockets)
- **ORM:** Entity Framework Core
- **Database:** SQL Server / PostgreSQL
- **Design Patterns:** Clean Architecture, Dependency Injection, Repository Pattern, DTO Pattern.

---

## 🔄 Data Flow (Request Lifecycle)
How data moves through the system:

1. **REST API Request:** `Client` ➔ `API Endpoint` ➔ `Service (Application)` ➔ `Repository (Infrastructure)` ➔ `Database`.
2. **Real-time Message:** `Client` ➔ `SignalR Hub (API)` ➔ `Service (Application)` ➔ `Broadcast to connected Clients`.

---

## 📂 Directory Structure

```text
.
└── 📂 Backend/
    └── src/
        ├── NexusChat.sln
        ├── 🐳 compose.yaml
        ├── 📂 NexusChat.Api/
        │   ├── 📂 Properties/
        │   ├── 📂 Controllers/        
        │   ├── 📂 Hubs/               <-- Real-time WebSockets/SignalR
        │   ├── 📂 Middleware/
        │   ├── 🐳 Dockerfile
        │   ├── 🚫 .dockerignore
        │   ├── 📄 Program.cs
        │   └── ⚙️ appsettings.json
        ├── 📂 NexusChat.Domain/
        │   ├── 📂 Entities/
        │   └── 📂 Common/
        ├── 📂 NexusChat.Application/
        │   ├── 📂 DependencyInjection/
        │   ├── 📂 Interfaces/
        │   ├── 📂 DTOs/
        │   ├── 📂 Services/
        │   ├── 📂 Mapping/
        │   └── 📂 Validations/
        └── 📂 NexusChat.Infrastructure/
            ├── 📂 Data/
            │   ├── 📂 Configurations/
            │   └── 📄 AppDbContext.cs
            ├── 📂 Repositories/
            ├── 📂 Migrations/
            └── 📂 DependencyInjection/
                └── 📄 DependencyInjection.cs
