import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";


export function trimTrailingSlashes(s: string) {
  // Avoid regular expressions to eliminate any risk of catastrophic backtracking.
  let end = s.length;
  while (end > 0 && s.charAt(end - 1) === "/") {
    end--;
  }
  return s.slice(0, end);
}

export async function createChatConnection() {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const base = trimTrailingSlashes(apiUrl);

  // Dynamically import SignalR using a variable to avoid Vite's static import
  // analysis during tests when the package may not be installed. Callers
  // should await this function.
  const pkgName = "@microsoft/signalr";
  const signalr = await import(pkgName as any);

  return new signalr.HubConnectionBuilder()
    .withUrl(`${base}/hubs/chat`, {
      accessTokenFactory: () => globalThis.localStorage?.getItem("accessToken") || "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalr.LogLevel.Information)
    .build();
}
