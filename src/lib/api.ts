import api from "@/services/api";
import {
    HubConnectionBuilder,
    HubConnection,
    LogLevel
} from "@microsoft/signalr";
import { SIGNALR_BASE_URL } from "@/app/config/api";
import type { DashboardResponse } from "@/types";

const DASHBOARD_HUB_URL =
    `${SIGNALR_BASE_URL}/dashboardHub`;

let hubConnection: HubConnection | null = null;

export async function connectToDashboardHub(
    onUpdate: (data: DashboardResponse) => void,
) {

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

export async function disconnectFromDashboardHub() {
    if (!hubConnection) return;

    await hubConnection.stop();
    hubConnection = null;
}

export default api;