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

/**
 * MobileView 채팅방 목록 아이템 컴포넌트
 */
const MobileChatListItem: React.FC<{
  room: ChatRoom;
  formatTime: (timestamp: number) => string;
  onNavigate: () => void;
  onDelete: () => void;
}> = ({ room, formatTime, onNavigate, onDelete }) => {
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
  const [contextMenuPosition, setContextMenuPosition] = React.useState({
    x: 0,
    y: 0,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

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
    <div onContextMenu={handleContextMenu} className="relative">
      <button
        type="button"
        className="flex w-full items-stretch gap-3 px-4 py-3 active:opacity-90"
        onClick={onNavigate}
      >
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
          {room.avatar ? (
            <img
              src={room.avatar}
              alt={`${room.title} avatar`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // 이미지 로드 실패 시 아바타 숨기고 기본 아이콘 표시
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector(".default-avatar-icon")) {
                  const iconDiv = document.createElement("div");
                  iconDiv.className =
                    "grid h-full w-full place-content-center default-avatar-icon";
                  iconDiv.innerHTML =
                    '<svg class="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
                  parent.appendChild(iconDiv);
                }
              }}
            />
          ) : (
            <div className="grid h-full w-full place-content-center">
              <Icon
                icon="mdi:store-outline"
                className="h-6 w-6 text-gray-400"
              />
            </div>
          )}
        </div>

        <div className="min-w-0 flex flex-1 flex-col text-left">
          <div className="flex items-center gap-2">
            <span
              className={[
                "truncate text-[14px] font-semibold",
                room.unread > 0 ? "text-gray-900" : "text-[#666666]",
              ].join(" ")}
            >
              {room.title}
            </span>
            <span className="text-[10px] text-gray-400 opacity-70">
              {room.category}
            </span>
            <span className="text-[12px] text-gray-400">
              {formatTime(room.sentAt)}
            </span>
          </div>
          <p
            className={[
              "mt-1 line-clamp-2 text-[12px] leading-5",
              room.unread > 0 ? "text-black" : "text-[#999999]",
            ].join(" ")}
          >
            {room.preview}
          </p>
        </div>

        {room.unread > 0 && (
          <div className="ml-2 grid place-items-center">
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#FF2233] px-1.5 text-[11px] font-semibold text-white shadow-sm">
              {room.unread}
            </span>
          </div>
        )}
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
    </div>
  );
};

/**
 * MobileView
 * - /chat       : 리스트 화면
 * - /chat/:id   : 채팅방(스레드) 화면
 */
const MobileView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux 상태
  const { rooms, messagesByRoom, activeCategory, isLoading, isSending } =
    useAppSelector((state) => state.chat);
  const { userData, role } = useAppSelector((state) => state.user);

  const chips = ["전체", "웨딩홀", "스튜디오", "드레스", "메이크업"] as const;

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
      console.log("[MobileView] handleMessage called:", {
        message,
        chatRoomId,
      });
      const roomId = String(chatRoomId);
      dispatch(
        addMessage({
          roomId,
          message,
        })
      );
      console.log("[MobileView] addMessage dispatched");
      // 현재 선택된 채팅방이면 스크롤을 맨 아래로
      if (id === roomId) {
        setTimeout(() => {
          if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    ws.onMessage(handleMessage);
    ws.connect();

    return () => {
      // 연결 해제하지 않음 (전역 연결 유지)
    };
    // 🔧 id 추가
  }, [dispatch, userData, role, id]);

  // 채팅방 선택 시 메시지 조회 및 읽음 처리, WebSocket 구독
  React.useEffect(() => {
    if (id && role && userData) {
      const chatRoomId = parseInt(id, 10);
      if (!isNaN(chatRoomId)) {
        console.log("[MobileView] Entering chat room:", chatRoomId);
        dispatch(selectRoom(id));

        // 채팅방 메시지 조회 (DB에서 가져옴)
        console.log("[MobileView] Fetching messages for room:", chatRoomId);
        dispatch(fetchChatMessages({ chatRoomId }));

        dispatch(
          markRoomAsRead({
            chatRoomId,
          })
        );
        dispatch(clearUnreadCount(id));

        // WebSocket 구독
        const ws = getChatWebSocket();
        // 사용자 정보 설정 (메시지 변환 시 socialId 사용하므로 일치시켜야 함)
        const userId = userData.socialId || String(userData.id);
        ws.setUserInfo(userId, role);
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

  // 카테고리 필터링된 채팅방 목록
  const filteredItems = React.useMemo(() => {
    let result = rooms;
    if (activeCategory !== "전체") {
      result = result.filter(
        (r: (typeof rooms)[0]) => r.category === activeCategory
      );
    }
    // sentAt 기준 최신순 정렬
    return [...result].sort(
      (a: (typeof rooms)[0], b: (typeof rooms)[0]) => b.sentAt - a.sentAt
    );
  }, [rooms, activeCategory]);

  // 선택된 채팅방 정보
  const selectedRoom = React.useMemo(
    () => (id ? rooms.find((r) => r.id === id) ?? null : null),
    [id, rooms]
  );

  // 선택된 채팅방의 메시지 목록
  const messages = React.useMemo(() => {
    if (!id) return [];
    const roomMessages = messagesByRoom[id] || [];
    console.log("[MobileView] messages useMemo:", {
      id,
      messagesCount: roomMessages.length,
      messages: roomMessages,
    });
    return roomMessages;
  }, [id, messagesByRoom]);

  // 입력 상태
  const [text, setText] = React.useState("");
  const threadRef = React.useRef<HTMLDivElement>(null);

  // 채팅방 삭제 핸들러
  const handleDeleteRoom = (roomId: string) => {
    const chatRoomId = parseInt(roomId, 10);
    if (isNaN(chatRoomId)) return;

    dispatch(deleteRoom({ chatRoomId }));

    // 삭제된 채팅방이 현재 선택된 채팅방이면 목록으로 이동
    if (id === roomId) {
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

      console.log("[MobileView] Sending message with:", {
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
        console.log(
          "[MobileView] Message sent via WebSocket. Waiting for server response..."
        );

        setText("");
        // 스크롤을 맨 아래로
        setTimeout(() => {
          if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
          }
        }, 100);
      } else {
        // 전송 실패 시 임시 메시지 제거
        toast.error("메시지 전송에 실패했습니다.");
      }
    } else {
      toast.error("연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // 메시지 영역 스크롤
  React.useEffect(() => {
    if (id && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [id, messages]);

  // 시간 포맷팅 유틸
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
    return date.toLocaleDateString("ko-KR");
  };

  // 파트너 연속 메시지 그룹의 첫 번째인지 확인
  const isFirstOfPartnerGroup = (arr: ChatMessage[], idx: number): boolean => {
    const m = arr[idx];
    if (!m || m.author !== "partner") return false;
    const prev = arr[idx - 1];
    return !prev || prev.author !== "partner";
  };

  // 같은 작성자 + 같은 시간(m.time 기준) 그룹의 마지막 메시지인지
  const isLastOfTimeGroup = (arr: ChatMessage[], idx: number): boolean => {
    const m = arr[idx];
    if (!m) return false;
    const next = arr[idx + 1];
    if (!next) return true;
    // 작성자 또는 시간(분 단위 문자열)이 바뀌면 현재가 그룹의 마지막
    if (next.author !== m.author) return true;
    if (next.time !== m.time) return true;
    return false;
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

  // 메시지 행 컴포넌트 (카카오톡 스타일)
  const MessageRow: React.FC<{
    m: ChatMessage;
    showPartnerAvatar?: boolean;
    partnerAvatar?: string;
    showReadReceipt?: boolean;
    showTime?: boolean;
  }> = ({
    m,
    showPartnerAvatar = false,
    partnerAvatar,
    showReadReceipt = false,
    showTime = false,
  }) => {
    const mine = m.author === "me";

    // 내 메시지: 오른쪽 정렬, 시간은 말풍선 왼쪽에 같은 줄 하단 정렬
    if (mine) {
      return (
        <div className="flex justify-end">
          <div className="flex max-w-[80%] items-end gap-1">
            {(showTime || showReadReceipt) && (
              <div className="mb-[2px] text-[11px] font-medium tracking-[-0.1px] text-[#999999]">
                {showReadReceipt ? (
                  <div className="flex items-center gap-0.5">
                    <Icon icon="mingcute:check-line" className="h-3 w-3" />
                    <span>읽음 {m.time}</span>
                  </div>
                ) : (
                  <span>{m.time}</span>
                )}
              </div>
            )}
            <div
              className={[
                "inline-block rounded-[16px] px-3 py-1.5 text-[14px] leading-[1.5] tracking-[-0.2px]",
                "bg-[#FF2233] text-white",
              ].join(" ")}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        </div>
      );
    }

    // 상대 메시지: 왼쪽 정렬
    // - 그룹의 첫 메시지: 8x8 공간 안에 동그란 아바타
    // - 같은 그룹의 나머지: 8x8 공간만 유지 (투명), 아바타는 없음
    return (
      <div className="flex justify-start">
        <div className="flex max-w-[80%] items-end gap-1">
          {/* 아바타 영역 (항상 8x8 공간 확보) */}
          <div className="mr-1 h-8 w-8 flex-shrink-0">
            {showPartnerAvatar && (
              <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                {partnerAvatar && (
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
                )}
              </div>
            )}
          </div>

          {/* 말풍선 + 시간 */}
          <div className="flex items-end gap-1">
            <div
              className={[
                "inline-block rounded-[16px] px-3 py-1.5 text-[14px] leading-[1.5] tracking-[-0.2px]",
                "bg-[#F3F4F5] text-black",
              ].join(" ")}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
            {(showTime || showReadReceipt) && (
              <div className="mb-[2px] text-[11px] font-medium tracking-[-0.1px] text-[#999999]">
                {/* 상대 메시지는 읽음 개념 안 쓰고, 시간만 오른쪽에 위치 */}
                <span>{m.time}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 프로필 헤더 컴포넌트
  const ProfileHeader: React.FC<{ room: typeof selectedRoom }> = ({
    room,
  }: {
    room: typeof selectedRoom;
  }) => {
    if (!room) return null;

    return (
      <div className="fixed top-[60px] left-0 right-0 z-20 h-[84px] border-b border-[#F3F4F5] bg-white">
        <div className="relative h-full">
          <div className="absolute left-[20px] top-[12px] h-[60px] w-[60px] overflow-hidden rounded-full bg-gray-200">
            {room.avatar ? (
              <img
                src={room.avatar}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="grid h-full w-full place-content-center">
                <Icon
                  icon="mdi:store-outline"
                  className="h-6 w-6 text-gray-400"
                />
              </div>
            )}
          </div>
          <div className="absolute left-[98px] top-[11px]">
            <div className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-black">
              {room.title}
            </div>
            <div className="mt-[2px] text-[14px] font-normal leading-[1.5] tracking-[-0.2px] text-[#999999]">
              {room.category}
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert("스토어 보기(데모)")}
            className="absolute right-[20px] top-[27px] h-[30px] w-[78px] rounded-[8px] bg-[#FFEEEC] px-3 text-[12px] font-semibold leading-[1.5] tracking-[-0.2px] text-[#FF2D9E] active:opacity-90"
            title="스토어 보기"
          >
            스토어 보기
          </button>
        </div>
      </div>
    );
  };

  // 리스트 화면
  if (!id) {
    return (
      <div className="mt-7">
        <div className="px-4 pb-3">
          {/* ✅ 카테고리 중앙 정렬 */}
          <div className="no-scrollbar flex items-center justify-center gap-2 overflow-x-auto">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => dispatch(setActiveCategory(c))}
                aria-pressed={activeCategory === c}
                className={[
                  "h-9 shrink-0 rounded-full px-3 text-sm transition-colors duration-150 border",
                  activeCategory === c
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 top-[80px]">
          <div className="h-full overflow-y-auto overscroll-contain">
            <div className="py-1" />
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                로딩 중...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                <div className="mx-auto mb-3 grid h-12 w-12 place-content-center rounded-full bg-gray-100">
                  <Icon
                    icon="mdi:chat-outline"
                    className="h-6 w-6 text-gray-400"
                  />
                </div>
                선택한 카테고리에 해당하는 대화가 없습니다.
              </div>
            ) : (
              filteredItems.map((it: (typeof rooms)[0]) => (
                <MobileChatListItem
                  key={it.id}
                  room={it}
                  formatTime={formatTime}
                  onNavigate={() => navigate(`/chat/${it.id}`)}
                  onDelete={() => handleDeleteRoom(it.id)}
                />
              ))
            )}
            <div className="h-6" />
          </div>
        </div>
      </div>
    );
  }

  // 채팅방 상세 화면
  if (id && selectedRoom) {
    const readReceiptId = getReadReceiptMessageId(messages);

    return (
      <div className="relative h-[100vh] bg-white">
        {/* 상단 바 */}
        <div className="fixed top-0 left-0 right-0 z-30 flex h-[60px] items-center gap-2 border-gray-200 bg-white px-5">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md active:opacity-80"
            onClick={() => navigate("/chat")}
            title="뒤로"
            aria-label="뒤로 가기"
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="h-8 w-8 text-black"
            />
          </button>
        </div>

        {/* 프로필 헤더 */}
        <ProfileHeader room={selectedRoom} />

        {/* 메시지 영역 */}
        <div
          ref={threadRef}
          className="absolute inset-x-0 bottom-[84px] top-[144px] space-y-4 overflow-y-auto px-4 py-3"
        >
          {messages.length > 0 && (
            <div className="flex w-full justify-center">
              <span className="text-[10px] font-normal leading-[1.5] tracking-[-0.2px] text-[#999999]">
                {new Date(messages[0].createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}

          {messages.map((m: ChatMessage, idx: number) => (
            <MessageRow
              key={m.id}
              m={m}
              showPartnerAvatar={isFirstOfPartnerGroup(messages, idx)}
              partnerAvatar={selectedRoom.avatar}
              showReadReceipt={m.id === readReceiptId}
              showTime={isLastOfTimeGroup(messages, idx)}
            />
          ))}
        </div>

        {/* 하단 입력 영역 */}
        <div className="fixed bottom-5 left-0 right-0 bg-white">
          <div className="px-5 py-2">
            {/* ✅ 입력창 + 버튼 중앙 정렬 */}
            <div className="flex items-center justify-center gap-2">
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
                  className="h-[21px] max-h-[84px] w-full resize-none bg-transparent text-[14px] font-normal leading-[1.5] tracking-[-0.2px] text-[#666666] outline-none placeholder:text-[#666666] disabled:opacity-50"
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
    );
  }

  // 채팅방을 찾을 수 없는 경우
  return (
    <div className="flex h-[100vh] flex-col items-center justify-center px-6 text-sm text-gray-500">
      <div className="mb-3 grid h-12 w-12 place-content-center rounded-full bg-gray-100">
        <Icon
          icon="mdi:chat-question-outline"
          className="h-6 w-6 text-gray-400"
        />
      </div>
      존재하지 않는 채팅방입니다.
      <button
        type="button"
        className="mt-4 h-9 rounded-md bg-black px-4 text-[13px] text-white active:opacity-90"
        onClick={() => navigate("/chat")}
      >
        목록으로 돌아가기
      </button>
    </div>
  );
};

export default MobileView;
