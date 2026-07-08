import api from '@/services/api';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5032';
const DASHBOARD_HUB_URL = `${BASE_URL}/hubs/dashboard`;

let hubConnection: HubConnection | null = null;

export async function connectToDashboardHub(onUpdate: (data: any) => void) {
	if (hubConnection) return;

	const connection = new HubConnectionBuilder()
		.withUrl(DASHBOARD_HUB_URL)
		.withAutomaticReconnect()
		.configureLogging(LogLevel.Information)
		.build();

	connection.on('DashboardUpdated', (payload) => {
		try {
			onUpdate(payload);
		} catch (e) {
			console.error('Dashboard update handler error:', e);
		}
	});

	await connection.start();
	hubConnection = connection;
	return connection;
}

export default api;
