# 🎨 Frontend System Architecture

This project is built using **ReactJS** and **Vite**, following a **Modular/Feature-based Architecture**. This structure ensures that the UI is highly reusable, easy to maintain, and scales well as the application grows.

## 🏗️ Architectural Core Concepts

1. **🧩 User Interface (`components` & `pages`)**
- `components`: Reusable, "dumb" UI elements (e.g., Buttons, Inputs, ChatBubbles) that only rely on props.
- `pages`: "Smart" container components representing full screens (e.g., `ChatPage`, `LoginPage`). They manage state and fetch data.

2. **⚙️ Services & API (`services`)**
- Handles all external communications.
- `api`: Axios/Fetch configurations for calling RESTful endpoints from the .NET Backend.
- `signalr`: WebSocket client connections for real-time messaging using `@microsoft/signalr`.

3. **🧠 State Management (`contexts` / `store`)**
- Manages global state across the application without prop-drilling.
- Handles User Authentication state, Active Chat Room, and Real-time Message synchronization.

4. **🪝 Custom Logic (`hooks` & `utils`)**
- `hooks`: Reusable React Hooks (e.g., `useChat`, `useAuth`) to separate business logic from UI components.
- `utils`: Pure helper functions (e.g., date formatting, validation).

---

## 🧰 Tech Stack
- **Framework:** ReactJS 18+ (via Vite for lightning-fast HMR)
- **Real-time Client:** SignalR JavaScript Client
- **Routing:** React Router DOM
- **Styling:** CSS / Tailwind CSS (Optional)
- **HTTP Client:** Axios / Native Fetch

---

## 🔄 Data Flow (Real-time Chat Lifecycle)
How data moves through the React application:

1. **Sending a Message:** `User Input` ➔ `ChatComponent` ➔ `useChat(Hook)` ➔ `SignalR Service` ➔ `Backend`.
2. **Receiving a Message:** `Backend (SignalR)` ➔ `SignalR Service (Listener)` ➔ `Global State / Context` ➔ `UI Auto-updates`.

---

## 📂 Directory Structure

```text
.
└── 📂 Frontend/
    ├── 📂 public/               <-- Static assets (favicon, etc.)
    ├── 📂 src/
    │   ├── 📂 assets/           <-- Images, fonts, global CSS
    │   ├── 📂 components/       <-- Reusable UI components (Buttons, Modals)
    │   ├── 📂 contexts/         <-- Global state (AuthContext, ChatContext)
    │   ├── 📂 hooks/            <-- Custom React Hooks
    │   ├── 📂 pages/            <-- Page components (Login, Chat, Profile)
    │   ├── 📂 services/         <-- API calls & SignalR connection setup
    │   ├── 📂 utils/            <-- Helper functions (e.g., formatTime.js)
    │   ├── 📄 App.jsx           <-- Root component & Routing setup
    │   ├── 📄 main.jsx          <-- React entry point
    │   └── 📄 index.css         <-- Global styles
    ├── 🚫 .gitignore
    ├── ⚙️ eslint.config.js      <-- Linter config
    ├── 📄 index.html            <-- Vite HTML template
    ├── 📦 package.json          <-- Dependencies & Scripts
    └── ⚙️ vite.config.js        <-- Vite configuration
