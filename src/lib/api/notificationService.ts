const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export function subscribeToNotifications(onNotification: (notification: any) => void, onError: (event: Event) => void) {
  const eventSource = new EventSource(`${API_BASE}/api/v1/notification/subscribe`);

  eventSource.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    onNotification(notification);
  };

  eventSource.onerror = (event) => {
    console.error("SSE Error:", event);
    eventSource.close();
    onError(event);
  };

  return () => {
    eventSource.close();
  };
}
