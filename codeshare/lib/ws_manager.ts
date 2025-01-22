export class WebSocketService {
  private socket: WebSocket | undefined;
  private onMessageCallback: ((data: any) => void) | undefined;
  private url: string;
  private maxRetries = 3;
  private retryCount = 0;
  private reconnectTimeout: number = 1000; // Start with 1 second
  private maxReconnectTimeout: number = 30000; // Max 30 seconds
  private messageQueue: { type: string; class_id: string; data: any }[] = [];
  private isConnecting: boolean = false;
  private pingInterval: NodeJS.Timeout | undefined;
  private readonly PING_INTERVAL = 30000; // 30 seconds

  constructor(url: string) {
    this.url = url;
    this.initializeConnection();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleVisibilityChange();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Handle page refresh/close
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  private initializeConnection() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    this.socket = new WebSocket(this.url);
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log("WebSocket connected successfully");
      this.isConnecting = false;
      this.retryCount = 0;
      this.reconnectTimeout = 1000;
      this.startPingInterval();
      this.processMessageQueue();
    };

    this.socket.onclose = (event) => {
      this.handleClose(event);
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      this.handleError();
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.PING_INTERVAL);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  private sendPing() {
    this.sendMessage('ping', 'system', { timestamp: Date.now() });
  }

  private handleClose(event: CloseEvent) {
    this.stopPingInterval();
    this.isConnecting = false;

    if (!event.wasClean) {
      console.warn(`WebSocket connection closed unexpectedly. Code: ${event.code}`);
      this.attemptReconnect();
    }
  }

  private handleError() {
    if (this.socket?.readyState !== WebSocket.CLOSED) {
      this.socket?.close();
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') {
        return;
      }
      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
    }
  }

  private attemptReconnect() {
    if (this.retryCount >= this.maxRetries) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.retryCount++;
    const timeout = Math.min(this.reconnectTimeout * Math.pow(2, this.retryCount - 1), this.maxReconnectTimeout);

    console.log(`Attempting to reconnect (${this.retryCount}/${this.maxRetries}) in ${timeout}ms...`);
    
    setTimeout(() => {
      this.initializeConnection();
    }, timeout);
  }

  private handleVisibilityChange() {
    if (this.socket?.readyState === WebSocket.CLOSED || this.socket?.readyState === WebSocket.CLOSING) {
      this.retryCount = 0;
      this.initializeConnection();
    }
  }

  private handleOnline() {
    this.retryCount = 0;
    this.initializeConnection();
  }

  private handleOffline() {
    this.cleanup();
  }

  private cleanup() {
    this.stopPingInterval();
    if (this.socket) {
      this.socket.close(1000, 'Client closing connection');
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message.type, message.class_id, message.data);
      }
    }
  }

  public sendMessage(type: string, class_id: string, data: any) {
    const message = { type, class_id, data };

    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending message:", error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
      if (this.socket?.readyState === WebSocket.CLOSED) {
        this.initializeConnection();
      }
    }
  }

  public onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  public getConnectionState(): string {
    if (!this.socket) return 'DISCONNECTED';
    const states: Record<number, string> = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };
    return states[this.socket.readyState];
  }
}


export const webSocketService = new WebSocketService(
  `${process.env.NEXT_PUBLIC_API_URL_WS || "ws://localhost:8080"}/ws/connect`
);


export default webSocketService;