// src/store/chatSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  getOwnerChatRooms,
  getCustomerChatRooms,
  getChatHistory,
  markChatRoomAsRead,
  openChatRoomFromProduct,
  deleteChatRoom,
  transformChatRoom,
  transformChatMessage,
  type ChatRoom,
  type ChatMessage,
  type ChatCategory,
  type ChatRoomResponse,
  type ChatMessageResponse,
} from "../lib/api/chatApi";
import { toast } from "react-toastify";
import type { RootState } from "./store";

// ============================================
// 비동기 액션 (Thunks)
// ============================================

/**
 * 채팅방 목록 조회 (사용자 역할에 따라 자동 선택)
 * @param category 카테고리 필터 (선택사항)
 */
export const fetchChatRooms = createAsyncThunk(
  "chat/fetchChatRooms",
  async (
    { category }: { category?: ChatCategory | null } = { category: null },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const user = state.user;
      
      if (!user.isAuth || !user.userData || !user.role) {
        throw new Error("로그인이 필요합니다.");
      }

      let rooms: ChatRoomResponse[];
      
      if (user.role === "OWNER") {
        // 사장의 경우: 백엔드가 @Auth Accessor로 ownerId를 자동 추출함
        rooms = await getOwnerChatRooms(category);
      } else {
        // 고객의 경우: 백엔드가 @Auth Accessor로 customerId를 자동 추출함
        rooms = await getCustomerChatRooms(category);
      }

      // 서버 응답을 프론트엔드 타입으로 변환
      // 메시지 변환 시 socialId를 사용하므로 일관성 유지
      const currentUserId = user.userData.socialId || String(user.userData.id);
      const currentUserRole = user.role;
      
      const transformedRooms = rooms.map((room) =>
        transformChatRoom(room, currentUserId, currentUserRole)
      );
      
      return transformedRooms;
    } catch (error: any) {
      console.error("[chatSlice] fetchChatRooms error:", error);
      const message = error?.response?.data?.message || error?.message || "채팅방 목록을 불러오는데 실패했습니다.";
      // 500 에러 등 서버 에러는 사용자에게 알림
      if (error?.response?.status >= 500) {
        toast.error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      return rejectWithValue(message);
    }
  }
);

/**
 * 상품에서 채팅방 생성 또는 가져오기
 */
export const openRoomFromProduct = createAsyncThunk(
  "chat/openRoomFromProduct",
  async (
    { productId }: { productId: number },
    { rejectWithValue }
  ) => {
    try {
      const chatRoomId = await openChatRoomFromProduct(productId);
      return { chatRoomId };
    } catch (error: any) {
      const message = error?.message || "채팅방을 생성하는데 실패했습니다.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * 메시지 목록 조회 (페이징)
 */
export const fetchChatMessages = createAsyncThunk(
  "chat/fetchChatMessages",
  async (
    {
      chatRoomId,
      cursor,
      size = 30,
    }: {
      chatRoomId: number;
      cursor?: number;
      size?: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const user = state.user;

      if (!user.isAuth || !user.userData || !user.role) {
        throw new Error("로그인이 필요합니다.");
      }

      const messages = await getChatHistory(chatRoomId, cursor, size);

      // 서버 응답을 프론트엔드 타입으로 변환
      // 백엔드의 senderId는 socialId이므로 일치시켜야 함
      const currentUserId = user.userData.socialId || String(user.userData.id);
      const currentUserRole = user.role;

      const transformedMessages = messages.map((msg) =>
        transformChatMessage(msg, currentUserId, currentUserRole)
      );

      return {
        chatRoomId: String(chatRoomId),
        messages: transformedMessages,
        hasMore: messages.length === size, // 더 있는지 여부 (정확하지 않을 수 있음)
        nextCursor: messages.length > 0 ? messages[messages.length - 1].messageId : undefined,
      };
    } catch (error: any) {
      console.error("[chatSlice] fetchChatMessages error:", error);
      const message = error?.response?.data?.message || error?.message || "메시지를 불러오는데 실패했습니다.";
      // 400 에러는 조용히 처리 (채팅방이 없을 수 있음)
      if (error?.response?.status === 400) {
        console.warn("[chatSlice] Chat room not found or access denied:", chatRoomId);
        return rejectWithValue(message);
      }
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * 채팅방 읽음 처리
 */
export const markRoomAsRead = createAsyncThunk(
  "chat/markRoomAsRead",
  async (
    { chatRoomId }: { chatRoomId: number },
    { rejectWithValue }
  ) => {
    try {
      await markChatRoomAsRead(chatRoomId);
      return { chatRoomId: String(chatRoomId) };
    } catch (error: any) {
      console.error("[chatSlice] markRoomAsRead error:", error);
      // 400 에러는 채팅방이 없을 수 있으므로 조용히 처리
      if (error?.response?.status === 400) {
        console.warn("[chatSlice] Chat room not found or access denied for read:", chatRoomId);
        return rejectWithValue(error?.message || "읽음 처리에 실패했습니다.");
      }
      // 읽음 처리 실패는 조용히 처리 (토스트 없음)
      return rejectWithValue(error?.message || "읽음 처리에 실패했습니다.");
    }
  }
);

/**
 * 채팅방 삭제 (소프트 삭제)
 */
export const deleteRoom = createAsyncThunk(
  "chat/deleteRoom",
  async (
    {
      chatRoomId,
    }: {
      chatRoomId: number;
    },
    { getState, rejectWithValue, dispatch }
  ) => {
    try {
      await deleteChatRoom(chatRoomId);
      
      // 삭제 후 채팅방 목록 새로고침 (현재 선택된 카테고리 유지)
      const state = getState() as RootState;
      const activeCategory = state.chat.activeCategory;
      dispatch(fetchChatRooms({ category: activeCategory === "전체" ? null : activeCategory }));
      
      return { chatRoomId: String(chatRoomId) };
    } catch (error: any) {
      const message = error?.message || "채팅방 삭제에 실패했습니다.";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ============================================
// 상태 타입
// ============================================

type ChatState = {
  /** 채팅방 목록 */
  rooms: ChatRoom[];
  /** 현재 선택된 채팅방 ID */
  selectedRoomId: string | null;
  /** 채팅방별 메시지 맵 (roomId -> messages[]) */
  messagesByRoom: Record<string, ChatMessage[]>;
  /** 채팅방별 페이징 정보 */
  paginationByRoom: Record<
    string,
    {
      hasMore: boolean;
      nextCursor?: number;
      isLoading: boolean;
    }
  >;
  /** 현재 필터링된 카테고리 */
  activeCategory: ChatCategory | "전체";
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 메시지 전송 중인지 여부 (WebSocket 사용 시 필요 없을 수 있음) */
  isSending: boolean;
};

const initialState: ChatState = {
  rooms: [],
  selectedRoomId: null,
  messagesByRoom: {},
  paginationByRoom: {},
  activeCategory: "전체",
  isLoading: false,
  error: null,
  isSending: false,
};

// ============================================
// Slice
// ============================================

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    /** 채팅방 선택 */
    selectRoom(state, action: PayloadAction<string | null>) {
      state.selectedRoomId = action.payload;
    },

    /** 카테고리 필터 변경 */
    setActiveCategory(state, action: PayloadAction<ChatCategory | "전체">) {
      state.activeCategory = action.payload;
    },

    /** 새 메시지 추가 (실시간 수신용) */
    addMessage(
      state,
      action: PayloadAction<{ roomId: string; message: ChatMessage }>
    ) {
      const { roomId, message } = action.payload;
      console.log("[chatSlice] addMessage called:", { roomId, message });
      
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = [];
      }
      
      // 중복 체크 (같은 messageId가 있으면 추가하지 않음)
      const exists = state.messagesByRoom[roomId].some(
        (m) => m.messageId === message.messageId
      );
      
      if (exists) {
        console.log("[chatSlice] Message already exists, skipping:", message.messageId);
        return;
      }

      // 백엔드에서 받은 실제 메시지인 경우 (양수 messageId), 같은 텍스트를 가진 임시 메시지 제거
      if (message.messageId > 0 && message.author === "me") {
        const tempMessageIndex = state.messagesByRoom[roomId].findIndex(
          (m) => m.messageId < 0 && m.text === message.text && m.author === "me"
        );
        
        if (tempMessageIndex !== -1) {
          console.log("[chatSlice] Removing temporary message, replacing with real message");
          state.messagesByRoom[roomId].splice(tempMessageIndex, 1);
        }
      }

      state.messagesByRoom[roomId].push(message);
      console.log("[chatSlice] Message added to state. Total messages:", state.messagesByRoom[roomId].length);

      // 해당 채팅방의 미읽음 수 증가 (상대방이 보낸 메시지인 경우)
      if (message.author === "partner") {
        const room = state.rooms.find((r) => r.id === roomId);
        if (room) {
          room.unread += 1;
          room.preview = message.text;
          room.sentAt = message.createdAt;
        }
      }
    },

    /** 메시지 읽음 처리 (실시간 수신용) */
    markMessageAsRead(
      state,
      action: PayloadAction<{ roomId: string; messageId: string }>
    ) {
      const { roomId, messageId } = action.payload;
      const messages = state.messagesByRoom[roomId];
      if (messages) {
        const message = messages.find((m) => m.id === messageId);
        if (message && message.author === "me") {
          message.read = true;
        }
      }
    },

    /** 채팅방 미읽음 수 초기화 */
    clearUnreadCount(state, action: PayloadAction<string>) {
      const room = state.rooms.find((r) => r.id === action.payload);
      if (room) {
        room.unread = 0;
      }
    },

    /** 에러 초기화 */
    clearError(state) {
      state.error = null;
    },

    /** 메시지 전송 상태 설정 (WebSocket 사용 시) */
    setSending(state, action: PayloadAction<boolean>) {
      state.isSending = action.payload;
    },
  },
  extraReducers: (builder) => {
    // 채팅방 목록 조회
    builder.addCase(fetchChatRooms.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchChatRooms.fulfilled, (state, action) => {
      state.isLoading = false;
      state.rooms = action.payload;
    });
    builder.addCase(fetchChatRooms.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });

    // 메시지 목록 조회
    builder.addCase(fetchChatMessages.pending, (state, action) => {
      const roomId = action.meta.arg.chatRoomId.toString();
      if (!state.paginationByRoom[roomId]) {
        state.paginationByRoom[roomId] = {
          hasMore: false,
          isLoading: true,
        };
      } else {
        state.paginationByRoom[roomId].isLoading = true;
      }
    });
    builder.addCase(fetchChatMessages.fulfilled, (state, action) => {
      const { chatRoomId, messages, hasMore, nextCursor } = action.payload;
      console.log("[chatSlice] fetchChatMessages fulfilled:", { chatRoomId, messagesCount: messages.length, hasMore, nextCursor });
      
      // 메시지 목록 저장 (채팅방 재입장 시 API에서 가져온 최신 메시지로 교체)
      state.messagesByRoom[chatRoomId] = messages;
      
      // 메시지를 시간 순으로 정렬 (오래된 것부터)
      state.messagesByRoom[chatRoomId].sort((a, b) => a.createdAt - b.createdAt);
      
      state.paginationByRoom[chatRoomId] = {
        hasMore,
        nextCursor,
        isLoading: false,
      };
      
      console.log("[chatSlice] Messages saved to state. Total:", state.messagesByRoom[chatRoomId].length);
    });
    builder.addCase(fetchChatMessages.rejected, (state, action) => {
      const roomId = action.meta.arg.chatRoomId.toString();
      if (state.paginationByRoom[roomId]) {
        state.paginationByRoom[roomId].isLoading = false;
      }
      toast.error(action.payload as string);
    });

    // 읽음 처리
    builder.addCase(markRoomAsRead.fulfilled, (state, action) => {
      const room = state.rooms.find((r) => r.id === action.payload.chatRoomId);
      if (room) {
        room.unread = 0;
      }
    });

    // 채팅방 삭제
    builder.addCase(deleteRoom.fulfilled, (state, action) => {
      // 채팅방 목록에서 제거
      state.rooms = state.rooms.filter((r) => r.id !== action.payload.chatRoomId);
      // 선택된 채팅방이 삭제된 경우 선택 해제
      if (state.selectedRoomId === action.payload.chatRoomId) {
        state.selectedRoomId = null;
      }
      // 메시지도 제거
      delete state.messagesByRoom[action.payload.chatRoomId];
      delete state.paginationByRoom[action.payload.chatRoomId];
    });
  },
});

export const {
  selectRoom,
  setActiveCategory,
  addMessage,
  markMessageAsRead,
  clearUnreadCount,
  clearError,
  setSending,
} = chatSlice.actions;

export default chatSlice.reducer;
