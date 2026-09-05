/**
 * Safe API Base configuration.
 * Always resolves to relative '/api' unless an explicit, non-localhost external URL is configured.
 */
export function getApiBase(): string {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();
  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1") || envUrl === "/api") {
    return "/api";
  }
  return envUrl.replace(/\/$/, "");
}

export const API_BASE = getApiBase();
export default API_BASE;
