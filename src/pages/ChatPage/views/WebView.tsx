import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchChatRooms,
  fetchChatMessages,
  markRoomAsRead,
  selectRoom,
  setActiveCategory,
  addMessage,
  clearUnreadCount,
  deleteRoom,
} from "../../../store/chatSlice";
import { getChatWebSocket } from "../../../lib/websocket/chatWebSocket";
import type { ChatMessage, ChatRoom } from "../../../lib/api/chatApi";
import { toast } from "react-toastify";

// ============================================
// 레이아웃 상수
// ============================================

const LIST_BLOCK_WIDTH = 720;
const CATEGORY_WIDTH = 200;
const LIST_WIDTH = 480;
const PANEL_WIDTH = 420;
const PANEL_GAP = 24;

const LIST_HEIGHT_VSPACE = 220;
const PANEL_TOP = 100;
const PANEL_BOTTOM = LIST_HEIGHT_VSPACE - PANEL_TOP;

type Chip = "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

const chips: readonly Chip[] = [
  "전체",
  "웨딩홀",
  "스튜디오",
  "드레스",
  "메이크업",
];

// ============================================
// 하위 컴포넌트
// ============================================

const MessageRow: React.FC<{
  m: ChatMessage;
  showPartnerAvatar?: boolean;
  partnerAvatar?: string;
  showReadReceipt?: boolean;
}> = ({ m, showPartnerAvatar, partnerAvatar, showReadReceipt }) => {
  const mine = m.author === "me";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      {!mine && showPartnerAvatar && (
        <div className="mr-2 mt-0.5 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
          {partnerAvatar ? (
            <img
              src={partnerAvatar}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
        </div>
      )}
      <div className="max-w-[80%]">
        <div
          className={[
            "inline-block rounded-[16px] px-3 py-1.5 text-[14px] leading-[1.5] tracking-[-0.2px]",
            mine ? "bg-[#FF2233] text-white" : "bg-[#F3F4F5] text-black",
          ].join(" ")}
        >
          <p className="whitespace-pre-wrap">{m.text}</p>
        </div>
        {mine ? (
          <div className="mt-1.5 flex items-center justify-end gap-1 text-[12px] font-medium tracking-[-0.1px] text-[#999999]">
            {showReadReceipt ? (
              <>
                <Icon icon="mingcute:check-line" className="h-3 w-3" />
                <span>읽음 {m.time}</span>
              </>
            ) : (
              <span>{m.time}</span>
            )}
          </div>
        ) : (
          <div className="h-0" />
        )}
      </div>
    </div>
  );
};

const ChatListItem: React.FC<{
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}> = ({ room, isActive, onClick, onDelete }) => {
  const isUnread = room.unread > 0;
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
  const [contextMenuPosition, setContextMenuPosition] = React.useState({ x: 0, y: 0 });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const itemRef = React.useRef<HTMLLIElement>(null);

  // 시간 포맷팅
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
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

  // 우클릭 이벤트 처리
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  // 컨텍스트 메뉴 외부 클릭 시 닫기
  React.useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuOpen(false);
    };
    if (contextMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenuOpen]);

  const handleDeleteClick = () => {
    setContextMenuOpen(false);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    onDelete();
    setDeleteConfirmOpen(false);
  };
  
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  return (
    <li ref={itemRef} onContextMenu={handleContextMenu}>
      <button
        onClick={onClick}
        className={[
          "w-full px-3.5 py-3 text-left transition duration-150",
          isActive ? "bg-black/[.04]" : "hover:bg-gray-50",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 ring-1 ring-black/5">
            {room.avatar ? (
              <img
                src={room.avatar}
                alt={`${room.title} avatar`}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // 이미지 로드 실패 시 아바타 숨기고 기본 아이콘 표시
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector(".default-avatar-icon")) {
                    const iconDiv = document.createElement("div");
                    iconDiv.className = "grid h-full w-full place-items-center default-avatar-icon";
                    iconDiv.innerHTML = '<svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
                    parent.appendChild(iconDiv);
                  }
                }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <Icon
                  icon="mdi:store-outline"
                  className="h-5 w-5 text-gray-400"
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "truncate text-[12.5px] font-semibold tracking-[-0.2px]",
                  isUnread ? "text-gray-900" : "text-[#666666]",
                ].join(" ")}
                title={room.title}
              >
                {room.title}
              </span>
              <span className="text-[9px] text-gray-400 opacity-70 tracking-[-0.2px]">
                {room.category}
              </span>
              {room.muted && (
                <Icon
                  icon="mdi:bell-off-outline"
                  className="h-4 w-4 text-[#999999]"
                  aria-label="알림 음소거됨"
                />
              )}
            </div>
            <p
              className={[
                "mt-0.5 line-clamp-1 text-[13px] leading-[1.5] tracking-[-0.2px]",
                isUnread ? "text-gray-800" : "text-[#999999]",
              ].join(" ")}
              title={room.preview}
            >
              {room.preview}
            </p>
          </div>

          <div className="ml-2 flex flex-col items-end justify-center self-stretch">
            <span className="text-[10.5px] tracking-[-0.1px] text-[#999999]">
              {formatTime(room.sentAt)}
            </span>
            {isUnread && (
              <span className="mt-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#FF2233] px-1.5 text-[10px] font-semibold text-white shadow-sm">
                {room.unread}
              </span>
            )}
          </div>
        </div>
      </button>
      {contextMenuOpen && (
        <div
          className="fixed z-50 min-w-[120px] rounded-lg border border-gray-200 bg-white shadow-lg"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDeleteClick}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <Icon icon="mdi:delete-outline" className="h-4 w-4" />
            삭제
          </button>
        </div>
      )}
      
      {/* 삭제 확인 모달 */}
      {deleteConfirmOpen && (
        <>
          {/* Dimmed 배경 */}
          <div
            className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.6)] transition-opacity duration-300"
            onClick={handleDeleteCancel}
            aria-hidden="true"
          />
          {/* 모달 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="w-full max-w-[320px] rounded-2xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
            >
              <div className="px-6 py-5">
                <h3
                  id="delete-confirm-title"
                  className="mb-2 text-center text-lg font-semibold text-gray-900"
                >
                  채팅방 삭제
                </h3>
                <p className="mb-6 text-center text-sm text-gray-600">
                  정말 이 채팅방을 삭제하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 rounded-lg bg-[#FF2233] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E01E2E]"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </li>
  );
};

// ============================================
// 메인 WebView 컴포넌트
// ============================================

const WebView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Redux 상태
  const { rooms, messagesByRoom, activeCategory, isLoading, isSending } =
    useAppSelector((state) => state.chat);
  const { userData, role } = useAppSelector((state) => state.user);

  const [text, setText] = React.useState("");

  const selectedId = id ?? null;
  const panelOpen = Boolean(selectedId);

  // 채팅방 목록 조회 (카테고리 필터 적용)
  React.useEffect(() => {
    const category = activeCategory === "전체" ? null : activeCategory;
    dispatch(fetchChatRooms({ category }));
  }, [dispatch, activeCategory]);

  // WebSocket 연결 및 메시지 수신
  React.useEffect(() => {
    if (!userData || !role) return;

    const ws = getChatWebSocket();
    
    // 사용자 정보 설정 (메시지 변환 시 socialId 사용하므로 일치시켜야 함)
    const userId = userData.socialId || String(userData.id);
    ws.setUserInfo(userId, role);

    const handleMessage = (message: ChatMessage, chatRoomId: number) => {
      console.log("[WebView] handleMessage called:", { message, chatRoomId });
      const roomId = String(chatRoomId);
      dispatch(
        addMessage({
          roomId,
          message,
        })
      );
      console.log("[WebView] addMessage dispatched");
    };

    ws.onMessage(handleMessage);
    ws.connect();

    return () => {
      // 연결 해제하지 않음 (전역 연결 유지)
    };
  }, [dispatch, userData, role]);

  // 채팅방 선택 시 메시지 조회 및 읽음 처리, WebSocket 구독
  React.useEffect(() => {
    if (id && role && userData) {
      const chatRoomId = parseInt(id, 10);
      if (!isNaN(chatRoomId)) {
        console.log("[WebView] Entering chat room:", chatRoomId);
        dispatch(selectRoom(id));
        
        // 채팅방 메시지 조회 (DB에서 가져옴)
        console.log("[WebView] Fetching messages for room:", chatRoomId);
        dispatch(fetchChatMessages({ chatRoomId }));
        
        dispatch(
          markRoomAsRead({
            chatRoomId,
          })
        );
        dispatch(clearUnreadCount(id));

        // WebSocket 구독
        const ws = getChatWebSocket();
        if (ws.isConnected()) {
          ws.subscribeToRoom(chatRoomId);
        }
      }
    } else {
      dispatch(selectRoom(null));
    }

    return () => {
      // 채팅방을 떠날 때 구독 해제하지 않음 (백엔드가 자동 처리)
    };
  }, [dispatch, id, role, userData]);

  // 필터링된 채팅방 목록 (백엔드에서 이미 카테고리 필터링되어 오므로 정렬만 수행)
  const filteredItems = React.useMemo(() => {
    return [...rooms].sort((a, b) => b.sentAt - a.sentAt);
  }, [rooms]);

  const selectedRoom = React.useMemo(
    () => (selectedId ? rooms.find((x) => x.id === selectedId) ?? null : null),
    [selectedId, rooms]
  );

  const messages = React.useMemo(() => {
    if (!id) return [];
    const roomMessages = messagesByRoom[id] || [];
    console.log("[WebView] messages useMemo:", { id, messagesCount: roomMessages.length, messages: roomMessages });
    return roomMessages;
  }, [id, messagesByRoom]);

  const containerWidth = panelOpen
    ? LIST_BLOCK_WIDTH + PANEL_GAP + PANEL_WIDTH
    : LIST_BLOCK_WIDTH;
  const listAreaHeight = `calc(100vh - ${LIST_HEIGHT_VSPACE}px)`;

  const handleItemClick = (clickedId: string) => {
    if (selectedId === clickedId) {
      navigate("/chat");
    } else {
      navigate(`/chat/${clickedId}`);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    const chatRoomId = parseInt(roomId, 10);
    if (isNaN(chatRoomId)) return;
    
    dispatch(deleteRoom({ chatRoomId }));
    
    // 삭제된 채팅방이 현재 선택된 채팅방이면 목록으로 이동
    if (selectedId === roomId) {
      navigate("/chat");
    }
  };

  // 메시지 전송 (STOMP WebSocket 사용)
  const onSend = () => {
    if (!id || !text.trim() || isSending || !role || !userData) return;

    const chatRoomId = parseInt(id, 10);
    if (isNaN(chatRoomId)) {
      toast.error("채팅방 정보를 찾을 수 없습니다.");
      return;
    }

    const messageText = text.trim();
    
    // 메시지 길이 제한 체크 (255자)
    if (messageText.length > 255) {
      setText(""); // 입력값 초기화
      toast.error("255자 이상 금지입니다");
      // 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 1000); // 1초 후 새로고침
      return;
    }
    const ws = getChatWebSocket();
    
    if (ws.isConnected()) {
      // Optimistic update: 메시지를 보내기 전에 즉시 UI에 추가
      const tempMessageId = Date.now(); // 임시 ID (백엔드에서 받은 메시지로 교체됨)
      const tempMessage: ChatMessage = {
        id: `temp-${tempMessageId}`,
        author: "me",
        text: messageText,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        createdAt: Date.now(),
        messageId: -tempMessageId, // 음수로 임시 ID 표시 (중복 체크 우회)
      };

      // 즉시 Redux에 추가
      dispatch(
        addMessage({
          roomId: id,
          message: tempMessage,
        })
      );

      // senderId는 socialId를 사용 (백엔드가 채팅방의 ownerId/customerId에 socialId 저장)
      const senderId = userData.socialId || String(userData.id);
      
      console.log("[WebView] Sending message with:", {
        chatRoomId,
        senderRole: role,
        senderId,
        messageLength: messageText.length,
        userDataId: userData.id,
        userDataSocialId: userData.socialId,
        usingSocialId: !!userData.socialId,
      });
      
      // WebSocket으로 실시간 전송 (백엔드가 자동으로 DB에 저장함)
      const wsSuccess = ws.sendMessage(chatRoomId, role, senderId, messageText);
      
      if (wsSuccess) {
        // WebSocket 메시지가 성공적으로 전송되면
        // 백엔드가 자동으로 DB에 저장하고 /sub/chatroom/{chatRoomId}를 통해
        // 실제 메시지를 다시 보내주므로, WebSocket 핸들러에서 처리됨
        console.log("[WebView] Message sent via WebSocket. Waiting for server response...");

        setText("");
      } else {
        // 전송 실패 시 임시 메시지 제거 (추후 구현 가능)
        toast.error("메시지 전송에 실패했습니다.");
      }
    } else {
      toast.error("연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // 파트너 연속 메시지 그룹의 첫 번째인지 확인
  const isFirstOfPartnerGroup = (arr: ChatMessage[], idx: number): boolean => {
    const m = arr[idx];
    if (!m || m.author !== "partner") return false;
    const prev = arr[idx - 1];
    return !prev || prev.author !== "partner";
  };

  // 읽음 표시 대상 메시지 ID 찾기
  const getReadReceiptMessageId = (messages: ChatMessage[]): string | null => {
    if (!messages.length) return null;
    const last = messages[messages.length - 1];
    if (last.author === "me") return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.author === "me" && m.read) {
        return m.id;
      }
    }
    return null;
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 font-[Pretendard]">
      <div className="flex h-full w-full items-start justify-center">
        <div
          className="relative py-8"
          style={{
            width: containerWidth,
            transition:
              "width 350ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms",
          }}
        >
          {/* 메인 (카테고리 + 목록) */}
          <div
            className="grid gap-10"
            style={{
              gridTemplateColumns: `${CATEGORY_WIDTH}px ${LIST_WIDTH}px`,
            }}
          >
            {/* 카테고리 */}
            <aside
              className="sticky top-[100px] overflow-auto scrollbar-hide"
              style={{ height: listAreaHeight }}
            >
              <div className="space-y-2">
                {chips.map((c) => {
                  const active = activeCategory === c;
                  return (
                    <button
                      key={c}
                      onClick={() => dispatch(setActiveCategory(c))}
                      aria-pressed={active}
                      className={[
                        "group flex w-full items-center justify-between rounded-full border px-3.5 py-2 text-[12.5px] tracking-[-0.2px] transition",
                        active
                          ? "border-[#FF2233] bg-[#FF2233] text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <span>{c}</span>
                      <span
                        className={[
                          "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold",
                          active
                            ? "bg-white/15 text-white"
                            : "bg-gray-100 text-gray-600",
                        ].join(" ")}
                      >
                        {c === "전체"
                          ? rooms.length
                          : filteredItems.filter((it) => it.category === c).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* 채팅 목록 */}
            <section
              className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm scrollbar-hide"
              style={{ height: listAreaHeight }}
            >
              <ul className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="grid h-40 place-items-center text-sm text-[#999999]">
                    로딩 중...
                  </div>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((it) => (
                    <ChatListItem
                      key={it.id}
                      room={it}
                      isActive={selectedId === it.id}
                      onClick={() => handleItemClick(it.id)}
                      onDelete={() => handleDeleteRoom(it.id)}
                    />
                  ))
                ) : (
                  <div className="grid h-40 place-items-center text-sm text-[#999999]">
                    대화가 없습니다.
                  </div>
                )}
              </ul>
            </section>
          </div>

          {/* 우측 패널 */}
          {panelOpen && selectedRoom && (
            <div
              className="absolute right-0 z-10 rounded-xl border border-gray-200 bg-white shadow-2xl"
              style={{
                width: PANEL_WIDTH,
                top: PANEL_TOP,
                bottom: PANEL_BOTTOM,
              }}
            >
              <div className="flex h-full flex-col">
                {/* 헤더 */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 ring-1 ring-black/5">
                      {selectedRoom.avatar ? (
                        <img
                          src={selectedRoom.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <Icon
                            icon="mdi:store-outline"
                            className="h-5 w-5 text-gray-400"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold tracking-[-0.2px] text-black">
                        {selectedRoom.title}
                      </div>
                      <div className="text-[13px] leading-[1.5] tracking-[-0.2px] text-[#999999]">
                        {selectedRoom.category}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => alert("스토어 보기 (데모)")}
                    className="inline-flex h-[30px] items-center justify-center rounded-lg bg-[#FFEEEC] px-3 text-[11.5px] font-semibold tracking-[-0.2px] text-[#FF2D9E]"
                    title="스토어 보기"
                  >
                    스토어 보기
                  </button>
                </div>

                {/* 날짜 캡션 */}
                {messages.length > 0 && (
                  <div className="px-4 pt-2 text-[10px] leading-[1.5] tracking-[-0.2px] text-[#999999] text-center">
                    {new Date(messages[0].createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}

                {/* 메시지 영역 */}
                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-hide">
                  {(() => {
                    const readReceiptId = getReadReceiptMessageId(messages);
                    return messages.map((m: ChatMessage, idx: number) => (
                      <MessageRow
                        key={m.id}
                        m={m}
                        showPartnerAvatar={isFirstOfPartnerGroup(messages, idx)}
                        partnerAvatar={selectedRoom.avatar}
                        showReadReceipt={m.id === readReceiptId}
                      />
                    ));
                  })()}
                </div>

                {/* 하단 입력창 */}
                <div className="flex-shrink-0 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-[41px] w-full items-center gap-1 rounded-[20px] bg-[#F3F4F5] px-4 py-[10px]">
                      <textarea
                        rows={1}
                        placeholder="메세지 보내기"
                        value={text}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const newText = e.target.value;
                          // 255자 제한
                          if (newText.length <= 255) {
                            setText(newText);
                          } else {
                            // 255자 초과 시 즉시 차단하고 알림 후 새로고침
                            setText(""); // 먼저 입력값 초기화
                            toast.error("255자 이상 금지입니다");
                            // 알림을 표시한 후 즉시 새로고침
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000); // 1초 후 새로고침
                          }
                        }}
                        disabled={isSending}
                        className="h-[21px] max-h-[84px] w-full resize-none bg-transparent text-[13px] leading-[1.5] tracking-[-0.2px] text-[#666666] outline-none placeholder:text-[#666666] disabled:opacity-50"
                        onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                          const t = e.currentTarget;
                          t.style.height = "21px";
                          t.style.height = `${Math.min(84, t.scrollHeight)}px`;
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                          }
                        }}
                      />
                    </div>

                    <button
                      onClick={onSend}
                      disabled={isSending || !text.trim()}
                      className="grid h-9 w-9 place-items-center rounded-md text-[#E2E2E2] active:opacity-90 disabled:opacity-50"
                      title="전송"
                      aria-label="메시지 전송"
                    >
                      <Icon icon="solar:plain-bold" className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 패널과 리스트 사이 여백 */}
          {panelOpen && (
            <div
              className="absolute"
              style={{
                top: PANEL_TOP,
                bottom: PANEL_BOTTOM,
                left: LIST_BLOCK_WIDTH,
                width: 24,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WebView;
