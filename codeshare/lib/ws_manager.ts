const WS_URL = "http://localhost:8080"

export class WebSocketService {
  private socket: WebSocket | undefined;
  private onMessageCallback: ((chatHistory: string[]) => void) | undefined;
  private url: string;
  private maxRetries = 3;
  private retryCount = 0;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket(this.url);

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
      const data = JSON.parse(event.data);
      if (this.onMessageCallback) {
        this.onMessageCallback(data.history);
      }
    };
  }

  private handleRetry() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(
        `Retrying connection (${this.retryCount}/${this.maxRetries})...`
      );
      setTimeout(() => this.connect(), 1000);
    } else {
      console.error("Max retries reached.");
    }
  }

  sendMessage(type: string, data: any) {
    this.socket?.send(
      JSON.stringify({
        type,
        data
      })
    );
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }
}

const webSocketService = new WebSocketService(`${WS_URL}/ws/connect`);
export default webSocketService;