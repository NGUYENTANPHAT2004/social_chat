import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@/constants';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      upgrade: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnection();
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.socket?.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat methods
  joinRoom(roomId: string) {
    this.socket?.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
  }

  leaveRoom(roomId: string) {
    this.socket?.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
  }

  sendMessage(roomId: string, content: string) {
    this.socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, { roomId, content });
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on(SOCKET_EVENTS.NEW_MESSAGE, callback);
  }

  // Game methods
  joinGame(gameId: string) {
    this.socket?.emit(SOCKET_EVENTS.JOIN_GAME, { gameId });
  }

  placeBet(gameId: string, betData: any) {
    this.socket?.emit(SOCKET_EVENTS.PLACE_BET, { gameId, ...betData });
  }

  onGameResult(callback: (result: any) => void) {
    this.socket?.on(SOCKET_EVENTS.GAME_RESULT, callback);
  }

  // Gift methods
  sendGift(roomId: string, giftId: string, recipientId: string) {
    this.socket?.emit(SOCKET_EVENTS.SEND_GIFT, { roomId, giftId, recipientId });
  }

  onGiftReceived(callback: (gift: any) => void) {
    this.socket?.on(SOCKET_EVENTS.GIFT_RECEIVED, callback);
  }

  // Generic event listener
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();
export default socketService;