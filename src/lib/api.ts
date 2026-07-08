import axios from 'axios';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let hubConnection: HubConnection | null = null;

export const connectToDashboardHub = async (onUpdate: (data: any) => void) => {
  if (hubConnection) return hubConnection;

  hubConnection = new HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_API_BASE_URL}dashboardHub`, {
      accessTokenFactory: () => localStorage.getItem('token') || '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  hubConnection.on("ReceiveDashboardUpdate", (data) => {
    console.log("📡 Dashboard updated in real-time:", data);
    onUpdate(data);
  });

  try {
    await hubConnection.start();
    console.log("✅ Connected to Dashboard Hub");
  } catch (err) {
    console.error("❌ SignalR Connection failed:", err);
  }

  return hubConnection;
};

export default api;