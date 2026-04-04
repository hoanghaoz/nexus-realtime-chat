![.NET 10](https://img.shields.io/badge/.NET%2010-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%2347A248.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 👥 Authors

- [Nguyễn Lê Hoàng Hảo](https://github.com/hoanghaoz)
- [Trần Quang Hạ](https://github.com/tqha1011)
- [Phan Cao Minh Hiếu](https://github.com/hieupcm03)
- [Tăng Chấn Hồng](https://github.com/24520579)
- [Nguyễn Hoàn Hải](https://github.com/Haibrosh)

## 🛠️ Tech Stack

**Frontend:** ReactJS, Vite

**Backend:** ASP.NET Core 10 Web API, SignalR (Real-time Communication)

**Database:** PostgreSQL


## 🚀 Deployment

### 1. 🐳 Deploy Backend (ASP.NET Core API)
If you don't have `Docker`, get it from the [official website](https://www.docker.com/) to install `Docker`.

Open your terminal and navigate to the `Backend` folder. Run the below command:
```bash
  docker compose up -d --build
```
Navigate to `http://localhost:<port>/scalar/v1` to see the **API Docs (Scalar)**.

### 2. ⚛️ Deploy Frontend (ReactJS Web App)
**Requirement:** Install [Node.js](https://nodejs.org/) (v18 or newer recommended).

#### Step 1: Install Dependencies
Open your terminal and navigate to the `Frontend` folder:
```bash
  cd Frontend
  npm install
```

#### Step 2: Configure & Run
- If you have an environment variables file, ensure the backend API URL is configured correctly (e.g., in `.env` or `vite.config.js`).
- Start the development server:
```bash
  npm run dev
```
The app will normally run at `http://localhost:5173`.


## 📚 Documentation

- [Backend Architecture](docs/architecture/backend-architecture.md)

- [Frontend Architecture](docs/architecture/frontend-architecture.md)

- [Database Design](docs/architecture/database-schema.md)

- [CI/CD Pipeline Guidelines](docs/infrastructure/ci-cd.md)

- [Conventional Commit Guidelines](docs/guildlines/conventional-commit.md)
