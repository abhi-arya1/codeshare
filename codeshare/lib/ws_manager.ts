const WS_URL = "ws://localhost:8080";

export class WebSocketService {
  private socket: WebSocket | undefined;
  private onMessageCallback: ((data: any) => void) | undefined;
  private url: string;
  private maxRetries = 3;
  private retryCount = 0;

  constructor(url: string) {
    this.url = url;
    this.connect();

    // Handle page refresh
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('wasRefreshed', 'true');
      this.socket?.close(1000, 'Client is closing the connection.');
    });
  }

  private connect() {
    const wasRefreshed = sessionStorage.getItem('wasRefreshed');
    if (wasRefreshed) {
      this.retryCount = 0; // Reset retry count on refresh
      sessionStorage.removeItem('wasRefreshed');
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("WebSocket connected.");
      this.retryCount = 0;
      sessionStorage.removeItem('wsRetryCount'); // Reset retry count on success
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      this.handleRetry();
    };

    this.socket.onclose = (event) => {
      if (!event.wasClean) {
        console.error("WebSocket connection closed unexpectedly:", event);
        this.handleRetry();
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", event.data, err);
      }
    };
  }

  private handleRetry() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      sessionStorage.setItem('wsRetryCount', this.retryCount.toString());
      console.log(
        `Retrying connection (${this.retryCount}/${this.maxRetries})...`
      );
      setTimeout(() => this.connect(), 500);
    } else {
      console.error("Max retries reached.");
    }
  }

  sendMessage(type: string, class_id: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type,
          class_id,
          data,
        })
      );
    } else {
      console.error("Cannot send message. WebSocket is not connected.");
    }
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }
}

const webSocketService = new WebSocketService(`${WS_URL}/ws/connect`);
export default webSocketService;
