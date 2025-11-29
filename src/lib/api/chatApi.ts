// src/lib/api/chatApi.ts
import api from "./axios";

// ============================================
// 백엔드 API 응답 타입 (서버 스펙 그대로)
// ============================================

/**
 * 백엔드 Category enum 타입 (영문)
 */
export type BackendCategory = "WEDDING_HALL" | "STUDIO" | "DRESS" | "MAKEUP";

/**
 * 프론트엔드에서 사용하는 카테고리 타입 (한글)
 */
export type ProductCategory =
  | "웨딩홀"
  | "스튜디오"
  | "드레스"
  | "메이크업"
  | "기타";

/**
 * 채팅방 목록 응답 (서버 응답 형식)
 */
export type ChatRoomResponse = {
  chatRoomId: number;
  opponentId: string;
  opponentName: string;
  opponentProfileImage: string;
  lastMessage: string;
  lastMessageTime: string; // ISO 8601 형식
  unreadCount: number;
  lastProductCategory: BackendCategory | null; // 백엔드는 영문 enum을 반환
  lastProductId: number; // ✅ 상품 ID
};

/**
 * 채팅 메시지 응답 (서버 응답 형식)
 */
export type ChatMessageResponse = {
  chatRoomId: number;
  senderRole: string; // "OWNER" | "CUSTOMER"
  senderId: string;
  message: string;
  sendTime: string; // ISO 8601 형식
  ownerRead: boolean;
  customerRead: boolean;
  ownerReadAt: string | null; // ISO 8601 형식
  customerReadAt: string | null; // ISO 8601 형식
  messageId: number;
};

/**
 * 채팅방 생성 요청 (상품에서 채팅 열기)
 */
export type ChatOpenFromProductRequest = {
  productId: number;
};

/**
 * 채팅방 생성 응답 (백엔드는 Long만 반환)
 */
export type CreateChatRoomResponse = number; // chatRoomId만 반환

/**
 * 메시지 전송 요청
 */
export type ChatSendRequest = {
  chatRoomId: number;
  message: string;
};

// ============================================
// 카테고리 변환 함수
// ============================================

/**
 * 프론트엔드 한글 카테고리를 백엔드 영문 enum으로 변환
 */
export const categoryToBackend = (
  category: ProductCategory | null | undefined
): BackendCategory | null => {
  if (!category || category === "기타") {
    return null;
  }

  const mapping: Record<Exclude<ProductCategory, "기타">, BackendCategory> = {
    웨딩홀: "WEDDING_HALL",
    스튜디오: "STUDIO",
    드레스: "DRESS",
    메이크업: "MAKE업".replace("업", "UP"), // 오타 방지용 (실제론 MAKEUP)
  };

  // 위에서 장난친 부분 롤백 (실제 값은 "MAKEUP")
  if (category === "메이크업") return "MAKEUP";

  return mapping[category] || null;
};

/**
 * 백엔드 영문 enum을 프론트엔드 한글 카테고리로 변환
 */
export const categoryFromBackend = (
  category: BackendCategory | null | undefined
): ProductCategory => {
  if (!category) {
    return "기타";
  }

  const mapping: Record<BackendCategory, ProductCategory> = {
    WEDDING_HALL: "웨딩홀",
    STUDIO: "스튜디오",
    DRESS: "드레스",
    MAKEUP: "메이크업",
  };

  return mapping[category] || "기타";
};

/**
 * 이미지 URL 유효성 검사
 * 더미 도메인(example.com 등)이나 잘못된 URL은 undefined 반환
 */
export const validateImageUrl = (
  url: string | null | undefined
): string | undefined => {
  if (!url || !url.trim()) {
    return undefined;
  }

  const trimmedUrl = url.trim();

  // example.com 같은 더미 도메인 필터링
  if (
    trimmedUrl.includes("example.com") ||
    trimmedUrl.includes("example.org") ||
    trimmedUrl.includes("example.net") ||
    trimmedUrl.startsWith("http://localhost") ||
    trimmedUrl.startsWith("https://localhost")
  ) {
    return undefined;
  }

  // 빈 문자열이나 공백만 있는 경우
  if (trimmedUrl === "" || trimmedUrl === "#" || trimmedUrl === "/") {
    return undefined;
  }

  return trimmedUrl;
};

// ============================================
// 프론트엔드에서 사용하는 변환된 타입
// ============================================

// ChatCategory는 ProductCategory와 동일
export type ChatCategory = ProductCategory;

/**
 * 프론트엔드에서 사용하는 채팅방 타입
 */
export type ChatRoom = {
  id: string; // chatRoomId를 문자열로 변환
  title: string; // opponentName
  category: ChatCategory; // 기본값 "기타" 또는 상품 정보에서 가져옴
  /** 화면 표시용 상대시간 문자열 (예: "5분 전", "어제") */
  time: string;
  /** 최신 정렬용(UNIX ms) */
  sentAt: number;
  /** 마지막 메시지 미리보기 */
  preview: string;
  /** 미읽음 개수 */
  unread: number;
  /** 알림 음소거 여부 (백엔드에 없으므로 기본값 false) */
  muted: boolean;
  /** 상대방 아바타 이미지 URL */
  avatar?: string;
  /** 상대방 ID */
  partnerId: string;
  /** 상대방 이름 */
  partnerName: string;
  /** 마지막으로 연결된 상품 ID (있을 수도, 없을 수도 있음) */
  lastProductId?: number | null;
};

/**
 * 프론트엔드에서 사용하는 메시지 타입
 */
export type ChatMessage = {
  id: string; // messageId를 문자열로 변환
  /** 메시지 작성자: "me" (현재 사용자) 또는 "partner" (상대방) */
  author: "me" | "partner";
  text: string;
  /** 표시용 시간 문자열 (예: "16:58", "오늘 10:30") */
  time: string;
  /** 상대가 내 메시지를 읽었는지 (내가 보낸 메시지에만 존재) */
  read?: boolean;
  /** 메시지 생성 시간 (UNIX ms) */
  createdAt: number;
  /** 원본 메시지 ID */
  messageId: number;
};

// ============================================
// 유틸리티 함수 (서버 응답 → 프론트엔드 타입 변환)
// ============================================

/**
 * ISO 8601 문자열을 상대 시간 문자열로 변환
 */
export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
};

/**
 * ISO 8601 문자열을 시간 문자열로 변환 (예: "16:58")
 */
export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
};

/**
 * 서버 응답을 프론트엔드 ChatRoom 타입으로 변환
 */
export const transformChatRoom = (
  response: ChatRoomResponse,
  currentUserId: string,
  currentUserRole: "CUSTOMER" | "OWNER"
): ChatRoom => {
  // lastMessageTime이 없거나 빈 문자열인 경우 현재 시간 사용
  const lastMessageTime = response.lastMessageTime || new Date().toISOString();
  const sentAt = new Date(lastMessageTime).getTime();

  // 유효하지 않은 날짜인 경우 현재 시간 사용
  const validSentAt = isNaN(sentAt) ? Date.now() : sentAt;

  return {
    id: String(response.chatRoomId),
    title: response.opponentName,
    category: categoryFromBackend(response.lastProductCategory), // 백엔드 영문 enum을 한글로 변환
    time: formatRelativeTime(lastMessageTime),
    sentAt: validSentAt,
    preview: response.lastMessage || "",
    unread: response.unreadCount,
    muted: false, // 백엔드에 없으므로 기본값
    avatar: validateImageUrl(response.opponentProfileImage), // 이미지 URL 유효성 검사
    partnerId: response.opponentId,
    partnerName: response.opponentName,
    lastProductId:
      typeof response.lastProductId === "number"
        ? response.lastProductId
        : null,
  };
};

/**
 * 서버 응답을 프론트엔드 ChatMessage 타입으로 변환
 */
export const transformChatMessage = (
  response: ChatMessageResponse,
  currentUserId: string,
  currentUserRole: "CUSTOMER" | "OWNER"
): ChatMessage => {
  const isMe =
    response.senderId === currentUserId &&
    response.senderRole === currentUserRole;

  // 읽음 여부 확인
  const read =
    isMe &&
    (currentUserRole === "OWNER" ? response.ownerRead : response.customerRead);

  return {
    id: String(response.messageId),
    author: isMe ? "me" : "partner",
    text: response.message,
    time: formatTime(response.sendTime),
    read: isMe ? read : undefined,
    createdAt: new Date(response.sendTime).getTime(),
    messageId: response.messageId,
  };
};

// ============================================
// API 함수들
// ============================================

/**
 * 상품에서 채팅방 생성 또는 가져오기
 * @param productId 상품 ID
 */
export const openChatRoomFromProduct = async (
  productId: number
): Promise<number> => {
  // 백엔드 경로: POST /api/chat/rooms/open-from-product
  const response = await api.post<number>("/api/chat/rooms/open-from-product", {
    productId,
  });
  return response.data;
};

/**
 * 오너의 채팅방 목록 조회
 * @param category 카테고리 필터 (선택사항)
 * @note ownerId는 서버에서 @Auth Accessor로 자동 추출됨
 */
export const getOwnerChatRooms = async (
  category?: ChatCategory | null
): Promise<ChatRoomResponse[]> => {
  const params: { category?: BackendCategory } = {};
  const backendCategory = categoryToBackend(category);
  if (backendCategory) {
    params.category = backendCategory;
  }
  console.log(`[chatApi] getOwnerChatRooms called:`, {
    category,
    backendCategory,
    params,
  });
  try {
    const response = await api.get<ChatRoomResponse[]>(
      `/api/chat/rooms/me/owner`,
      { params: Object.keys(params).length > 0 ? params : undefined }
    );
    console.log(`[chatApi] getOwnerChatRooms response:`, {
      roomsCount: response.data.length,
    });
    return response.data;
  } catch (error: any) {
    console.error(`[chatApi] getOwnerChatRooms error:`, {
      category,
      backendCategory,
      params,
      url: `/api/chat/rooms/me/owner`,
      error: error?.response?.data || error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
    });
    if (error?.response?.status === 500) {
      console.error(`[chatApi] 500 error with category:`, {
        category,
        backendCategory,
        params,
      });
    }
    throw error;
  }
};

/**
 * 고객의 채팅방 목록 조회
 * @param category 카테고리 필터 (선택사항)
 * @note customerId는 서버에서 @Auth Accessor로 자동 추출됨
 */
export const getCustomerChatRooms = async (
  category?: ChatCategory | null
): Promise<ChatRoomResponse[]> => {
  const params: { category?: BackendCategory } = {};
  const backendCategory = categoryToBackend(category);
  if (backendCategory) {
    params.category = backendCategory;
  }
  console.log(`[chatApi] getCustomerChatRooms called:`, {
    category,
    backendCategory,
    params,
  });
  try {
    const response = await api.get<ChatRoomResponse[]>(
      `/api/chat/rooms/me/customer`,
      { params: Object.keys(params).length > 0 ? params : undefined }
    );
    console.log(`[chatApi] getCustomerChatRooms response:`, {
      roomsCount: response.data.length,
    });
    return response.data;
  } catch (error: any) {
    console.error(`[chatApi] getCustomerChatRooms error:`, {
      category,
      backendCategory,
      params,
      url: `/api/chat/rooms/me/customer`,
      error: error?.response?.data || error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
    });
    if (error?.response?.status === 500) {
      console.error(`[chatApi] 500 error with category:`, {
        category,
        backendCategory,
        params,
      });
    }
    throw error;
  }
};

/**
 * 채팅 히스토리 조회 (페이징)
 * @param chatRoomId 채팅방 ID
 * @param cursor 커서 (선택사항, 다음 페이지 조회용)
 * @param size 페이지 크기 (기본값: 30)
 */
export const getChatHistory = async (
  chatRoomId: number,
  cursor?: number,
  size: number = 30
): Promise<ChatMessageResponse[]> => {
  const params: { cursor?: number; size: number } = { size };
  if (cursor !== undefined) {
    params.cursor = cursor;
  }
  console.log(`[chatApi] getChatHistory called:`, { chatRoomId, cursor, size });
  try {
    const response = await api.get<ChatMessageResponse[]>(
      `/api/chat/history/${chatRoomId}`,
      { params }
    );
    console.log(`[chatApi] getChatHistory response:`, {
      chatRoomId,
      messagesCount: response.data.length,
    });
    return response.data;
  } catch (error: any) {
    console.error(`[chatApi] getChatHistory error:`, {
      chatRoomId,
      cursor,
      size,
      error: error?.response?.data || error?.message,
      status: error?.response?.status,
    });
    if (error?.response?.status === 400) {
      throw new Error("채팅방을 찾을 수 없거나 접근할 수 없습니다.");
    }
    throw error;
  }
};

/**
 * 채팅방 읽음 처리
 * @param chatRoomId 채팅방 ID
 */
export const markChatRoomAsRead = async (chatRoomId: number): Promise<void> => {
  try {
    await api.post(`/api/chat/rooms/${chatRoomId}/read`);
  } catch (error: any) {
    console.error(`[chatApi] markChatRoomAsRead error:`, {
      chatRoomId,
      error: error?.response?.data || error?.message,
      status: error?.response?.status,
    });
    if (error?.response?.status === 400) {
      throw new Error("채팅방을 찾을 수 없거나 접근할 수 없습니다.");
    }
    throw error;
  }
};

/**
 * 채팅방 삭제 (소프트 삭제, 한쪽만 숨기기)
 * @param chatRoomId 채팅방 ID
 */
export const deleteChatRoom = async (chatRoomId: number): Promise<void> => {
  await api.delete(`/api/chat/rooms/${chatRoomId}`);
};

/**
 * 메시지 전송 (REST API - DB 저장용)
 * 백엔드 스펙: POST /api/chat/messages
 * @param chatRoomId 채팅방 ID
 * @param message 메시지 내용
 */
export const sendChatMessage = async (
  chatRoomId: number,
  message: string
): Promise<ChatMessageResponse> => {
  console.log(`[chatApi] sendChatMessage called:`, { chatRoomId, message });
  const response = await api.post<ChatMessageResponse>(`/api/chat/messages`, {
    chatRoomId,
    message,
  });
  console.log(`[chatApi] sendChatMessage response:`, response.data);
  return response.data;
};
