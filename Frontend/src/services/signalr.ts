import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export function createChatConnection() {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  return new HubConnectionBuilder()
    .withUrl(`${base}/hubs/chat`, {
      accessTokenFactory: () => localStorage.getItem("accessToken") || "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();
}
