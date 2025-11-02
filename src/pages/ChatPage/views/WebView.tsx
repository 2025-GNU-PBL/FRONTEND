import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";

// ----------------------------------------------------------------
// 1. 데이터 및 타입
// ----------------------------------------------------------------

type Chip = "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

type Item = {
  id: string;
  title: string;
  category: Chip | "기타";
  /** 화면 표시용 상대시간 문자열 */
  time: string;
  preview: string;
  /** 미읽음 개수(>0 일 때만 빨간 뱃지 노출 + 글자 진하게) */
  unread: number;
  muted: boolean;
  avatar?: string;
  /** 최신 정렬용(UNIX ms) */
  sentAt: number;
};

type Message = {
  id: string;
  author: "me" | "partner";
  text: string;
  /** 표시용 시간(문자열) */
  time: string;
  /** 상대가 내 메시지를 읽었는지 */
  read?: boolean;
};

const chips: readonly Chip[] = [
  "전체",
  "웨딩홀",
  "스튜디오",
  "드레스",
  "메이크업",
];

// 아바타 소스 몇 개만 순환 사용
const AVATARS = [
  "https://m.veils.co.kr/web/product/big/202212/73716dbe5a71b0860c7be0e89c5503de.jpg",
  "https://i.pinimg.com/564x/00/f1/e3/00f1e3391b1a8d6e3c544332f7a43e49.jpg",
  "https://i.pinimg.com/564x/07/35/d8/0735d808dcf776f3f00a5f9175ecf918.jpg",
  "https://i.pinimg.com/564x/3b/01/a0/3b01a0521c7d2c18f1ad47b7410886a8.jpg",
];

// 더미 아이템 대량 생성 (count 기본 120) — 표시용 time과 정렬용 sentAt 동기화
function makeItems(count = 120): Item[] {
  const categories: Chip[] = ["웨딩홀", "스튜디오", "드레스", "메이크업"];
  const now = Date.now();
  const MIN = (n: number) => now - n * 60 * 1000;
  const DAY = (n: number) => now - n * 24 * 60 * 60 * 1000;

  return Array.from({ length: count }, (_, i) => {
    const idx = i + 1;
    const cat = categories[i % categories.length];
    const title = `${cat} 업체 #${idx.toString().padStart(2, "0")}`;
    const previewPool = [
      "상세 견적과 예약 가능 일정을 확인해주세요.",
      "패키지 구성/원본 제공 범위를 안내드립니다.",
      "피팅 체크리스트와 진행 플로우 공유드립니다.",
      "리허설 포함 시 추가 금액 관련 안내입니다.",
      "방문 상담 가능 시간대 회신 부탁드립니다.",
    ];
    const preview = previewPool[i % previewPool.length];

    let time = "";
    let sentAt = now;
    if (i % 11 === 0) {
      time = "1주 전";
      sentAt = DAY(7) - (i % 60) * 60 * 1000;
    } else if (i % 7 === 0) {
      time = "어제";
      sentAt = DAY(1) - (i % 45) * 60 * 1000;
    } else {
      const minsAgo = (i % 59) + 1;
      time = `${minsAgo}분 전`;
      sentAt = MIN(minsAgo);
    }

    const unread = i % 5 === 0 ? (i % 3) + 1 : 0;
    const muted = i % 9 === 0;
    const avatar = AVATARS[i % AVATARS.length];

    return {
      id: String(idx),
      title,
      category: cat,
      time,
      preview,
      unread,
      muted,
      avatar,
      sentAt,
    };
  });
}

// 특정 스레드에 긴 대화 생성 (기본 80줄)
function makeLongThread(id: string, lines = 80): Message[] {
  const msgs: Message[] = [];
  for (let i = 0; i < lines; i++) {
    const mine = i % 2 === 1;
    msgs.push({
      id: `t${id}-${i}`,
      author: mine ? "me" : "partner",
      text: mine
        ? `네, 확인했습니다. (#${i + 1}) 다음 단계 진행 부탁드려요.`
        : `안녕하세요! (#${i + 1}) 문의 주신 내용에 대해 안내드립니다.`,
      time: `오늘 10:${(10 + (i % 50)).toString().padStart(2, "0")}`,
      // 데모: 일부만 읽음 처리
      read: mine ? i % 4 === 0 : undefined,
    });
  }
  return msgs;
}

// 기본 스레드(짧은 것들) + 일부는 초장문 스레드
const demoThread: Record<string, Message[]> = {
  "1": makeLongThread("1", 88),
  "2": [
    {
      id: "m1",
      author: "partner",
      text: "스냅/본식 패키지 견적 전달드립니다.",
      time: "8월 1일 13:22",
    },
    {
      id: "m2",
      author: "me",
      text: "자세한 구성표도 공유 가능할까요?",
      time: "8월 1일 13:29",
      read: true,
    },
    {
      id: "m3",
      author: "partner",
      text: "네, PDF로 첨부드렸습니다.",
      time: "8월 1일 13:33",
    },
    {
      id: "m4",
      author: "me",
      text: "확인했어요. 주말 상담 예약할게요.",
      time: "8월 1일 13:36",
      read: true,
    },
    {
      id: "m5",
      author: "partner",
      text: "토요일 2시 가능하십니다.",
      time: "8월 1일 13:40",
    },
  ],
  "3": makeLongThread("3", 60),
  "4": [
    {
      id: "m1",
      author: "partner",
      text: "리허설 포함 시 총 견적은 80만원입니다.",
      time: "지난주",
    },
    {
      id: "m2",
      author: "me",
      text: "결제 방식도 알려주실 수 있을까요?",
      time: "지난주",
      read: true,
    },
    {
      id: "m3",
      author: "partner",
      text: "카드/계좌 이체 모두 가능합니다 :)",
      time: "지난주",
    },
  ],
};

// 실제 목록 데이터
const items: Item[] = makeItems(120);

// ----------------------------------------------------------------
// 2. 레이아웃 고정값
// ----------------------------------------------------------------

const LIST_BLOCK_WIDTH = 720;
const CATEGORY_WIDTH = 200;
const LIST_WIDTH = 480;
const PANEL_WIDTH = 420;
const PANEL_GAP = 24;

const LIST_HEIGHT_VSPACE = 220;
const PANEL_TOP = 100;
const PANEL_BOTTOM = LIST_HEIGHT_VSPACE - PANEL_TOP;

// ----------------------------------------------------------------
// 3. 하위 컴포넌트
// ----------------------------------------------------------------

/** 모바일뷰와 동일한 메시지 디자인/규칙 */
const MessageRow: React.FC<{
  m: Message;
  showPartnerAvatar?: boolean;
  partnerAvatar?: string;
  /** "읽음" 표시 대상인지 여부 */
  showReadReceipt?: boolean;
}> = ({ m, showPartnerAvatar, partnerAvatar, showReadReceipt }) => {
  const mine = m.author === "me";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      {!mine && showPartnerAvatar && (
        <div className="mr-2 mt-0.5 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
          {partnerAvatar && (
            <img
              src={partnerAvatar}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
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
  item: Item;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const isUnread = item.unread > 0;

  return (
    <li>
      <button
        onClick={onClick}
        className={[
          "w-full px-3.5 py-3 text-left transition duration-150",
          isActive ? "bg-black/[.04]" : "hover:bg-gray-50",
        ].join(" ")}
      >
        {/* 세로 중앙 정렬: 아이템 전체 높이를 기준으로 avatar/본문/우측(time+뱃지)를 모두 center */}
        <div className="flex items-center gap-3">
          {/* 아바타 (뱃지 제거됨) */}
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 ring-1 ring-black/5">
            {item.avatar ? (
              <img
                src={item.avatar}
                alt={`${item.title} avatar`}
                className="h-full w-full object-cover"
                loading="lazy"
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

          {/* 본문 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "truncate text-[12.5px] font-semibold tracking-[-0.2px]",
                  isUnread ? "text-gray-900" : "text-[#666666]",
                ].join(" ")}
                title={item.title}
              >
                {item.title}
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] tracking-[-0.2px] text-gray-700">
                {item.category}
              </span>
              {item.muted && (
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
              title={item.preview}
            >
              {item.preview}
            </p>
          </div>

          {/* 우측: 시간 + 미읽음 뱃지 (세로 중앙정렬) */}
          <div className="ml-2 flex flex-col items-end justify-center self-stretch">
            <span className="text-[10.5px] tracking-[-0.1px] text-[#999999]">
              {item.time}
            </span>
            {isUnread && (
              <span className="mt-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#FF2233] px-1.5 text-[10px] font-semibold text-white shadow-sm">
                {item.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
};

// ----------------------------------------------------------------
/** 4. 메인 WebView (라우터 연동) */
// ----------------------------------------------------------------
const WebView: React.FC = () => {
  const [activeChip, setActiveChip] = React.useState<Chip>("전체");
  const [query, setQuery] = React.useState("");

  // ⬇️ 모바일과 동일한 입력 상태 및 전송 핸들러 추가
  const [text, setText] = React.useState("");
  const onSend = () => {
    if (!text.trim()) return;
    // 실제 전송 로직은 서비스 연동 시 구현
    alert("전송(데모)");
    setText("");
  };

  // 🔗 URL 파라미터(id)가 선택 상태의 단일 소스
  const { id } = useParams<{ id?: string }>();
  const selectedId = id ?? null;
  const navigate = useNavigate();

  const panelOpen = Boolean(selectedId);

  // 파생 데이터 (모바일뷰처럼 sentAt 기준 최신순 정렬)
  const filteredItems = React.useMemo(() => {
    let result = items;

    if (query.trim()) {
      const k = query.trim().toLowerCase();
      result = result.filter(
        (it) =>
          it.title.toLowerCase().includes(k) ||
          it.preview.toLowerCase().includes(k) ||
          (typeof it.category === "string" &&
            it.category.toLowerCase().includes(k))
      );
    }

    if (activeChip !== "전체") {
      result = result.filter((it) => it.category === activeChip);
    }

    // 최신순 정렬 (sentAt desc)
    return [...result].sort((a, b) => b.sentAt - a.sentAt);
  }, [query, activeChip]);

  const selectedItem = React.useMemo(
    () => (selectedId ? items.find((x) => x.id === selectedId) ?? null : null),
    [selectedId]
  );

  const containerWidth = panelOpen
    ? LIST_BLOCK_WIDTH + PANEL_GAP + PANEL_WIDTH
    : LIST_BLOCK_WIDTH;
  const listAreaHeight = `calc(100vh - ${LIST_HEIGHT_VSPACE}px)`;

  const handleItemClick = (clickedId: string) => {
    // 같은 아이템 다시 누르면 패널 닫기 (/chat), 아니면 해당 스레드 열기 (/chat/:id)
    if (selectedId === clickedId) {
      navigate("/chat");
    } else {
      navigate(`/chat/${clickedId}`);
    }
  };

  // ---- 모바일뷰 규칙: 파트너 연속 메시지 그룹 첫 번째에만 아바타 노출
  const isFirstOfPartnerGroup = (arr: Message[], idx: number): boolean => {
    const m = arr[idx];
    if (!m || m.author !== "partner") return false;
    const prev = arr[idx - 1];
    return !prev || prev.author !== "partner";
  };

  /**
   * 읽음표시 규칙(모바일과 동일):
   * - 스레드의 마지막 메시지가 내가 보낸 것이면 읽음 표시 없음
   * - 그 외에는 "읽힌 내 메시지 중 가장 마지막 것"에만 1회 표시
   */
  const getReadReceiptMessageId = (messages: Message[]): string | null => {
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
          {/* 헤더 (검색) */}
          <div className="mb-4 px-3">
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="대화, 업체명 검색"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-[12.5px] tracking-[-0.2px] outline-none transition focus:ring-2 focus:ring-black/10 placeholder:text-[#999999]"
              />
            </div>
          </div>

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
                  const active = activeChip === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setActiveChip(c)}
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
                          ? items.length
                          : items.filter((it) => it.category === c).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* 채팅 목록 (스크롤) */}
            <section
              className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm scrollbar-hide"
              style={{ height: listAreaHeight }}
            >
              <ul className="divide-y divide-gray-100">
                {filteredItems.length > 0 ? (
                  filteredItems.map((it) => (
                    <ChatListItem
                      key={it.id}
                      item={it}
                      isActive={selectedId === it.id}
                      onClick={() => handleItemClick(it.id)}
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

          {/* 우측 패널 (모바일뷰 디자인으로 메시지 적용) */}
          {panelOpen && selectedItem && (
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
                      {selectedItem.avatar && (
                        <img
                          src={selectedItem.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold tracking-[-0.2px] text-black">
                        {selectedItem.title}
                      </div>
                      <div className="text-[13px] leading-[1.5] tracking-[-0.2px] text-[#999999]">
                        프리미엄 드레스샵
                      </div>
                    </div>
                  </div>

                  {/* 스토어 보기 배지 버튼 */}
                  <button
                    onClick={() => alert("스토어 보기 (데모)")}
                    className="inline-flex h-[30px] items-center justify-center rounded-lg bg-[#FFEEEC] px-3 text-[11.5px] font-semibold tracking-[-0.2px] text-[#FF2D9E]"
                    title="스토어 보기"
                  >
                    스토어 보기
                  </button>
                </div>

                {/* 얇은 캡션 */}
                <div className="px-4 pt-2 text-[10px] leading-[1.5] tracking-[-0.2px] text-[#999999] text-center">
                  2025년 10월 5일
                </div>

                {/* 메시지 영역 — 모바일뷰와 동일한 MessageRow + 읽음 규칙 */}
                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-hide">
                  {(() => {
                    const messages =
                      demoThread[selectedItem.id] ??
                      makeLongThread(selectedItem.id, 40);
                    const readReceiptId = getReadReceiptMessageId(messages);
                    return messages.map((m, idx) => (
                      <MessageRow
                        key={m.id}
                        m={m}
                        showPartnerAvatar={isFirstOfPartnerGroup(messages, idx)}
                        partnerAvatar={selectedItem.avatar}
                        showReadReceipt={m.id === readReceiptId}
                      />
                    ));
                  })()}
                </div>

                {/* === 하단 입력창 (모바일과 동일 디자인으로 변경) === */}
                <div className="flex-shrink-0 p-3">
                  <div className="flex items-center gap-2">
                    {/* 입력 프레임 */}
                    <div className="flex h-[41px] w-full items-center gap-1 rounded-[20px] bg-[#F3F4F5] px-4 py-[10px]">
                      <textarea
                        rows={1}
                        placeholder="메세지 보내기"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="h-[21px] max-h-[84px] w-full resize-none bg-transparent text-[13px] leading-[1.5] tracking-[-0.2px] text-[#666666] outline-none placeholder:text-[#666666]"
                        onInput={(e) => {
                          const t = e.currentTarget;
                          t.style.height = "21px";
                          t.style.height = `${Math.min(84, t.scrollHeight)}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                          }
                        }}
                      />
                    </div>

                    {/* 전송 버튼 (모바일 동일 스타일/아이콘) */}
                    <button
                      onClick={onSend}
                      className="grid h-9 w-9 place-items-center rounded-md text-[#E2E2E2] active:opacity-90"
                      title="전송"
                      aria-label="메시지 전송"
                    >
                      <Icon icon="solar:plain-bold" className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {/* === 입력창 끝 === */}
              </div>
            </div>
          )}

          {/* 패널과 리스트 사이 여백 시각화용 spacer */}
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
