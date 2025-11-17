// src/lib/websocket/chatWebSocket.ts
import { Client, type Message, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { ChatMessage, ChatMessageResponse } from "../api/chatApi";
import { transformChatMessage } from "../api/chatApi";

type MessageHandler = (message: ChatMessage, chatRoomId: number) => void;
type ErrorHandler = (error: Event | string) => void;
type CloseHandler = () => void;

/**
 * 채팅 STOMP WebSocket 연결 관리 클래스
 * 
 * 백엔드 스펙:
 * - 엔드포인트: /ws-stomp
 * - 발행 경로: /pub/chat.message
 * - 구독 경로: /sub/chatroom/{chatRoomId}
 * 
 * 사용 예시:
 * ```ts
 * const ws = new ChatWebSocket();
 * ws.onMessage((message, chatRoomId) => {
 *   // 새 메시지 수신 처리
 * });
 * ws.connect();
 * ws.subscribeToRoom(123); // 채팅방 구독
 * ws.sendMessage(123, "OWNER", "user123", "안녕하세요");
 * ```
 */
export class ChatWebSocket {
  private client: Client | null = null;
  private subscriptions: Map<number, StompSubscription> = new Map();
  private reconnectDelay = 3000; // 3초
  private messageHandlers: MessageHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private closeHandlers: CloseHandler[] = [];
  private currentUserId: string | null = null;
  private currentUserRole: "CUSTOMER" | "OWNER" | null = null;

  constructor() {
    // WebSocket URL 구성 (백엔드 API 주소 기반)
    const apiBase = import.meta.env.VITE_API_BASE_URL as string;
    if (!apiBase) {
      throw new Error("VITE_API_BASE_URL is not defined");
    }

    // HTTP/HTTPS를 WS/WSS로 변환
    const wsProtocol = apiBase.startsWith("https") ? "https" : "http";
    const wsBase = apiBase.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProtocol}://${wsBase}/ws-stomp`;

    // STOMP 클라이언트 생성
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // 개발 환경에서만 로그 출력
        if (import.meta.env.DEV) {
          console.log("[STOMP]", str);
        }
      },
      onConnect: () => {
        console.log("[ChatWebSocket] STOMP Connected");
      },
      onStompError: (frame) => {
        console.error("[ChatWebSocket] STOMP Error:", frame);
        this.errorHandlers.forEach((handler) => handler(frame.headers["message"] || "STOMP Error"));
      },
      onWebSocketError: (event) => {
        console.error("[ChatWebSocket] WebSocket Error:", event);
        this.errorHandlers.forEach((handler) => handler(event));
      },
      onDisconnect: () => {
        console.log("[ChatWebSocket] STOMP Disconnected");
        this.subscriptions.clear();
        this.closeHandlers.forEach((handler) => handler());
      },
    });
  }

  /**
   * 사용자 정보 설정 (메시지 변환 시 필요)
   */
  setUserInfo(userId: string, userRole: "CUSTOMER" | "OWNER") {
    this.currentUserId = userId;
    this.currentUserRole = userRole;
  }

  /**
   * 메시지 수신 핸들러 등록
   */
  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  /**
   * 에러 핸들러 등록
   */
  onError(handler: ErrorHandler) {
    this.errorHandlers.push(handler);
  }

  /**
   * 연결 종료 핸들러 등록
   */
  onClose(handler: CloseHandler) {
    this.closeHandlers.push(handler);
  }

  /**
   * STOMP WebSocket 연결
   */
  connect() {
    if (!this.client) {
      throw new Error("WebSocket client is not initialized");
    }

    if (this.client.connected) {
      console.log("[ChatWebSocket] Already connected");
      return;
    }

    try {
      // 토큰이 있으면 헤더에 추가 (필요한 경우)
      // const token = localStorage.getItem("accessToken");
      // if (token && this.client.configure) {
      //   // STOMP 연결 시 헤더에 토큰 추가 (백엔드에서 필요하면)
      //   // this.client.configure.connectHeaders = { Authorization: `Bearer ${token}` };
      // }

      this.client.activate();
    } catch (error) {
      console.error("[ChatWebSocket] Failed to connect:", error);
      this.errorHandlers.forEach((handler) => handler(error as Event));
    }
  }

  /**
   * 특정 채팅방 구독
   * @param chatRoomId 채팅방 ID
   */
  subscribeToRoom(chatRoomId: number) {
    if (!this.client || !this.client.connected) {
      console.warn("[ChatWebSocket] Cannot subscribe: not connected");
      return;
    }

    // 이미 구독 중이면 무시
    if (this.subscriptions.has(chatRoomId)) {
      console.log(`[ChatWebSocket] Already subscribed to room ${chatRoomId}`);
      return;
    }

    try {
      const subscription = this.client.subscribe(
        `/sub/chatroom/${chatRoomId}`,
        (message: Message) => {
          try {
            console.log(`[ChatWebSocket] Message received from room ${chatRoomId}:`, message.body);
            const data: ChatMessageResponse = JSON.parse(message.body);
            console.log(`[ChatWebSocket] Parsed message data:`, data);
            
            // 프론트엔드 타입으로 변환
            if (this.currentUserId && this.currentUserRole) {
              const chatMessage = transformChatMessage(
                data,
                this.currentUserId,
                this.currentUserRole
              );
              console.log(`[ChatWebSocket] Transformed message:`, chatMessage);
              
              // 핸들러 호출
              console.log(`[ChatWebSocket] Calling ${this.messageHandlers.length} message handler(s)`);
              this.messageHandlers.forEach((handler) => 
                handler(chatMessage, data.chatRoomId)
              );
            } else {
              console.warn("[ChatWebSocket] User info not set, cannot transform message", {
                currentUserId: this.currentUserId,
                currentUserRole: this.currentUserRole,
              });
            }
          } catch (error) {
            console.error("[ChatWebSocket] Failed to parse message:", error);
            console.error("[ChatWebSocket] Raw message body:", message.body);
          }
        }
      );

      this.subscriptions.set(chatRoomId, subscription);
      console.log(`[ChatWebSocket] Subscribed to room ${chatRoomId}`);
    } catch (error) {
      console.error(`[ChatWebSocket] Failed to subscribe to room ${chatRoomId}:`, error);
    }
  }

  /**
   * 특정 채팅방 구독 해제
   * @param chatRoomId 채팅방 ID
   */
  unsubscribeFromRoom(chatRoomId: number) {
    const subscription = this.subscriptions.get(chatRoomId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(chatRoomId);
      console.log(`[ChatWebSocket] Unsubscribed from room ${chatRoomId}`);
    }
  }

  /**
   * 메시지 전송 (STOMP를 통한 실시간 전송)
   * @param chatRoomId 채팅방 ID
   * @param senderRole 발신자 역할 ("OWNER" | "CUSTOMER")
   * @param senderId 발신자 ID (socialId)
   * @param message 메시지 내용
   */
  sendMessage(
    chatRoomId: number,
    senderRole: "OWNER" | "CUSTOMER",
    senderId: string,
    message: string
  ) {
    if (!this.client || !this.client.connected) {
      console.warn("[ChatWebSocket] Cannot send message: not connected");
      return false;
    }

    try {
      const payload = {
        chatRoomId,
        senderRole,
        senderId,
        message,
      };

      console.log(`[ChatWebSocket] Sending message payload:`, payload);
      console.log(`[ChatWebSocket] Publishing to: /pub/chat.message`);
      
      this.client.publish({
        destination: "/pub/chat.message",
        body: JSON.stringify(payload),
      });

      console.log(`[ChatWebSocket] Message sent to room ${chatRoomId}`);
      return true;
    } catch (error) {
      console.error("[ChatWebSocket] Failed to send message:", error);
      return false;
    }
  }

  /**
   * WebSocket 연결 종료
   */
  disconnect() {
    // 모든 구독 해제
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * 구독 중인 채팅방 목록
   */
  getSubscribedRooms(): number[] {
    return Array.from(this.subscriptions.keys());
  }
}

/**
 * 싱글톤 인스턴스 (전역에서 하나의 WebSocket 연결만 유지)
 */
let chatWebSocketInstance: ChatWebSocket | null = null;

/**
 * 채팅 WebSocket 인스턴스 가져오기
 */
export const getChatWebSocket = (): ChatWebSocket => {
  if (!chatWebSocketInstance) {
    chatWebSocketInstance = new ChatWebSocket();
  }
  return chatWebSocketInstance;
};

/**
 * 채팅 WebSocket 연결 해제
 */
export const disconnectChatWebSocket = () => {
  if (chatWebSocketInstance) {
    chatWebSocketInstance.disconnect();
    chatWebSocketInstance = null;
  }
};
