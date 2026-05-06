import {
  HubConnectionBuilder,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";

export function trimTrailingSlashes(s: string) {
  let end = s.length;
  while (end > 0 && s.charAt(end - 1) === "/") {
    end--;
  }
  return s.slice(0, end);
}

/**
 * Tạo kết nối tới ChatHub của Nexus.
 * JWT token được đính kèm qua accessTokenFactory (SignalR đọc từ query string).
 * Ref: Program.cs → app.MapHub<ChatHub>("/hubs/chat")
 */
export async function createChatConnection() {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const base = trimTrailingSlashes(apiUrl);

  return new HubConnectionBuilder()
    .withUrl(`${base}/hubs/chat`, {
      accessTokenFactory: () =>
        globalThis.localStorage?.getItem("accessToken") ?? "",
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(
      import.meta.env.DEV ? LogLevel.Information : LogLevel.Error
    )
    .build();
}

/**
 * Tạo kết nối tới PresenceHub của Nexus.
 * Ref: Program.cs → app.MapHub<PresenceHub>("/hubs/presence")
 */
export async function createPresenceConnection() {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const base = trimTrailingSlashes(apiUrl);

  return new HubConnectionBuilder()
    .withUrl(`${base}/hubs/presence`, {
      accessTokenFactory: () =>
        globalThis.localStorage?.getItem("accessToken") ?? "",
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(
      import.meta.env.DEV ? LogLevel.Information : LogLevel.Error
    )
    .build();
}
