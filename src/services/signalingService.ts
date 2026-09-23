export type SignalMessage =
  | { type: 'join' | 'leave' | 'typing' | 'reaction'; roomId: string; peerId: string; payload?: unknown }
  | { type: 'offer' | 'answer' | 'candidate'; roomId: string; peerId: string; payload: unknown };

export class SignalingService {
  private socket?: WebSocket;

  connect(url: string, onMessage: (message: SignalMessage) => void) {
    this.socket = new WebSocket(url);
    this.socket.onmessage = (event) => onMessage(JSON.parse(event.data) as SignalMessage);
    return () => this.disconnect();
  }

  send(message: SignalMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  disconnect() {
    this.socket?.close();
    this.socket = undefined;
  }
}
