import api from "@/services/api";
import {
    HubConnectionBuilder,
    HubConnection,
    LogLevel
} from "@microsoft/signalr";

const BASE_URL =
    import.meta.env.VITE_API_URL ?? "https://localhost:7289";

const DASHBOARD_HUB_URL =
    `${BASE_URL.replace("/api", "")}/dashboardHub`;

let hubConnection: HubConnection | null = null;

export async function connectToDashboardHub(onUpdate: (data: any) => void) {

    if (hubConnection) return hubConnection;

    const connection = new HubConnectionBuilder()
        .withUrl(DASHBOARD_HUB_URL)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

    connection.on("ReceiveDashboardUpdate", (payload) => {
        onUpdate(payload);
    });

    await connection.start();

    hubConnection = connection;

    return connection;
}

export default api;