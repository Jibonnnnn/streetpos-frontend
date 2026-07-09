const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

const normalizedBaseUrl = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, "")
  : "http://localhost:5032";

export const REST_API_BASE_URL = normalizedBaseUrl.endsWith("/api")
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

export const SIGNALR_BASE_URL = normalizedBaseUrl.endsWith("/api")
  ? normalizedBaseUrl.replace(/\/api$/, "")
  : normalizedBaseUrl;