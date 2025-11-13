const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export function subscribeToNotifications(onNotification: (notification: any) => void, onError: (error: Error) => void) {
  const accessToken = localStorage.getItem("accessToken"); // AccessToken 가져오기
  if (!accessToken) {
    onError(new Error("Access token not found for SSE subscription."));
    return () => {}; // No-op cleanup
  }

  const controller = new AbortController();
  const signal = controller.signal;

  const connect = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/notification/subscribe`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`SSE network response was not ok: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get readable stream for SSE.");
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("SSE stream closed.");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const notification = JSON.parse(line.substring(5));
              onNotification(notification);
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          } else if (line === '') {
            // Heartbeat or empty line
          }
        }
      }
    } catch (err) {
      if (signal.aborted) {
        console.log("SSE connection aborted.");
      } else {
        console.error("SSE fetch error:", err);
        onError(err as Error);
      }
    }
  };

  connect();

  return () => {
    controller.abort(); // Cleanup: abort the fetch request
  };
}
