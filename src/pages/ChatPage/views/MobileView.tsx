import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * MobileView
 * - /chat       : 리스트 화면
 * - /chat/:id   : 채팅방(스레드) 화면 — Figma 스펙 반영
 */
const MobileView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // ---------------------------
  // (A) 리스트 화면 데이터(유지) + 발송일자(sentAt) 추가
  // ---------------------------
  const chips = ["전체", "웨딩홀", "스튜디오", "드레스", "메이크업"] as const;
  const [active, setActive] = React.useState<(typeof chips)[number]>("전체");

  type Item = {
    id: string;
    title: string;
    category: (typeof chips)[number] | "기타";
    /** 화면 표시는 기존 time을 그대로 사용, 실제 정렬은 sentAt으로 처리 */
    time: string;
    /** ERD 발송일자: 최신 순 정렬용(UNIX ms) */
    sentAt: number;
    preview: string;
    unread: number;
    muted: boolean;
    avatar?: string;
  };

  const AVATAR =
    "https://m.veils.co.kr/web/product/big/202212/73716dbe5a71b0860c7be0e89c5503de.jpg";

  // 데모용 상대적 시간 -> sentAt 변환
  const now = Date.now();
  const min = (n: number) => now - n * 60 * 1000;
  const day = (n: number) => now - n * 24 * 60 * 60 * 1000;

  const items = React.useMemo<Item[]>(
    () => [
      {
        id: "1",
        title: "루이즈블랑",
        category: "드레스",
        time: "5분 전",
        sentAt: min(5),
        preview:
          "드레스 가격 문의 안내입니다~! 예약 가능 일정도 함께 안내드려요.",
        unread: 2,
        muted: false,
        avatar: AVATAR,
      },
      {
        id: "2",
        title: "루и즈블랑",
        category: "스튜디오",
        time: "2달 전",
        sentAt: day(60),
        preview: "스냅/본식 패키지 구성과 원본 제공 범위를 확인해주세요.",
        unread: 0,
        muted: true,
        avatar: AVATAR,
      },
      {
        id: "3",
        title: "루이즈블랑",
        category: "드레스",
        time: "5분 전",
        sentAt: min(5), // 동시간 예시
        preview: "시즌 프로모션으로 특정 라인 추가 할인 진행 중입니다.",
        unread: 2,
        muted: false,
        avatar: AVATAR,
      },
      {
        id: "4",
        title: "루и즈블랑",
        category: "드레스",
        time: "어제",
        sentAt: day(1),
        preview: "피팅 일정 확정 전 체크리스트 공유드립니다.",
        unread: 0,
        muted: true,
        avatar: AVATAR,
      },
      {
        id: "5",
        title: "루이즈블랑",
        category: "메이크업",
        time: "1주 전",
        sentAt: day(7),
        preview: "메이크업/헤어 리허설 포함 시 총 견적은 다음과 같습니다.",
        unread: 0,
        muted: true,
        avatar: AVATAR,
      },
    ],
    []
  );

  /** 카테고리 필터 후 발송일자(sentAt) 기준 최신순 정렬 */
  const filteredItems = React.useMemo(() => {
    const base =
      active === "전체" ? items : items.filter((it) => it.category === active);
    return [...base].sort((a, b) => b.sentAt - a.sentAt);
  }, [active, items]);

  // ---------------------------
  // (B) 스레드 더미 데이터
  // ---------------------------
  type Message = {
    id: string;
    author: "me" | "partner";
    text: string;
    /** 표시용 시간(문자열) */
    time: string;
    /** 상대가 내 메시지를 읽었는지 */
    read?: boolean;
  };

  const makeLongThread = (tid: string, lines = 12): Message[] => {
    const msgs: Message[] = [];
    if (tid === "1") {
      msgs.push(
        {
          id: "m0",
          author: "partner",
          text: "안녕하세요 프리미엄 드레스샵 루이즈 블랑 입니다.",
          time: "16:58",
        },
        {
          id: "m1",
          author: "me",
          text: "안녕하세요 가격 문의 드립니다.",
          time: "17:00",
          read: true,
        },
        {
          id: "m2",
          author: "me",
          text: "오간자 실크 드레스 2종류 문의 드립니다",
          time: "17:00",
          read: true,
        }
      );
    }
    for (let i = 0; i < lines; i++) {
      const mine = i % 2 === 1;
      msgs.push({
        id: `t${tid}-${i}`,
        author: mine ? "me" : "partner",
        text: mine
          ? `네, 확인했습니다. (#${i + 1}) 다음 단계 진행 부탁드려요.`
          : `안녕하세요! (#${i + 1}) 문의 주신 내용에 대해 안내드립니다.`,
        time: `오늘 10:${(10 + (i % 50)).toString().padStart(2, "0")}`,
        // 데모: 일부만 읽음 처리
        read: mine ? i % 3 === 0 : undefined,
      });
    }
    return msgs;
  };

  const demoThread = React.useMemo<Record<string, Message[]>>(
    () => ({
      "1": makeLongThread("1", 10),
      "2": makeLongThread("2", 16),
      "3": makeLongThread("3", 14),
      "4": makeLongThread("4", 12),
      "5": makeLongThread("5", 15),
    }),
    []
  );

  const selectedItem = React.useMemo(
    () => (id ? items.find((x) => x.id === id) ?? null : null),
    [id, items]
  );

  // 입력 상태
  const [text, setText] = React.useState("");
  const threadRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (id && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [id]);

  const onSend = () => {
    if (!id || !text.trim()) return;
    // 실제 전송 로직은 서비스 연동 시 구현
    setText("");
  };

  const isFirstOfPartnerGroup = (arr: Message[], idx: number): boolean => {
    const m = arr[idx];
    if (!m || m.author !== "partner") return false;
    const prev = arr[idx - 1];
    return !prev || prev.author !== "partner";
  };

  /**
   * 읽음표시 규칙:
   * - 스레드의 마지막 메시지가 내가 보낸 것이면 읽음 표시 없음
   * - 그 외에는 "읽힌 내 메시지 중 가장 마지막 것"에만 1회 표시
   */
  const getReadReceiptMessageId = (messages: Message[]): string | null => {
    if (!messages.length) return null;
    const last = messages[messages.length - 1];
    if (last.author === "me") return null; // 마지막이 내가 보낸 메시지면 표시 없음

    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.author === "me" && m.read) {
        return m.id; // 가장 마지막으로 읽힌 내 메시지
      }
    }
    return null;
  };

  const MessageRow: React.FC<{
    m: Message;
    showPartnerAvatar?: boolean;
    partnerAvatar?: string;
    /** 읽음표시 대상인지 여부 */
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
              {showReadReceipt && (
                <>
                  <Icon icon="mingcute:check-line" className="h-3 w-3" />
                  <span>읽음 {m.time}</span>
                </>
              )}
              {!showReadReceipt && <span>{m.time}</span>}
            </div>
          ) : (
            <div className="h-0" />
          )}
        </div>
      </div>
    );
  };

  const ProfileHeader: React.FC<{ item: Item }> = ({ item }) => {
    return (
      <div className="fixed top-[60px] left-0 right-0 z-20 h-[84px] border-b border-[#F3F4F5] bg-white">
        <div className="relative h-full">
          <div className="absolute left-[20px] top-[12px] h-[60px] w-[60px] overflow-hidden rounded-full bg-gray-200">
            {item.avatar && (
              <img
                src={item.avatar}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <div className="absolute left-[98px] top-[11px]">
            <div className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-black">
              {item.title}
            </div>
            <div className="mt-[2px] text-[14px] font-normal leading-[1.5] tracking-[-0.2px] text-[#999999]">
              프리미엄 드레스샵
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

  // ---------------------------
  // 화면 분기
  // ---------------------------
  if (!id) {
    return (
      <div className="mt-7">
        <div className="px-4 pb-3">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                aria-pressed={active === c}
                className={[
                  "h-9 shrink-0 rounded-full px-3 text-sm transition-colors duration-150 border",
                  active === c
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
            {filteredItems.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                <div className="mx-auto mb-3 grid h-12 w-12 place-content-center rounded-full bg-gray-100">
                  <Icon
                    icon="mdi:chat-outline"
                    className="h-6 w-6 text-gray-400"
                  />
                </div>
                선택한 카테고리에 해당하는 대화가 없습니다.
              </div>
            )}
            {filteredItems.map((it, idx) => (
              <React.Fragment key={`${it.title}-${idx}-${it.sentAt}`}>
                <button
                  type="button"
                  className="flex w-full items-stretch gap-3 px-4 py-3 active:opacity-90"
                  onClick={() => navigate(`/chat/${it.id}`)}
                >
                  {/* 아바타 (뱃지 제거) */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                    {it.avatar ? (
                      <img
                        src={it.avatar}
                        alt={`${it.title} avatar`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
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

                  {/* 본문 */}
                  <div className="min-w-0 flex flex-1 flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "truncate text-[14px] font-semibold",
                          it.unread > 0 ? "text-gray-900" : "text-[#666666]",
                        ].join(" ")}
                      >
                        {it.title}
                      </span>
                      <span className="bg-white px-2 py-0.5 text-[12px] text-[#999999]">
                        {it.category}
                      </span>
                      <span className="text-[12px] text-gray-400">
                        {it.time}
                      </span>
                    </div>
                    <p
                      className={[
                        "mt-1 line-clamp-2 text-[12px] leading-5",
                        it.unread > 0 ? "text-black" : "text-[#999999]",
                      ].join(" ")}
                    >
                      {it.preview}
                    </p>
                  </div>

                  {/* 우측 뱃지(리스트의 가장 오른쪽) — 미읽음일 때만 노출 */}
                  <div className="ml-2 grid place-items-center">
                    {it.unread > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#FF2233] px-1.5 text-[11px] font-semibold text-white shadow-sm">
                        {it.unread}
                      </span>
                    )}
                  </div>
                </button>
              </React.Fragment>
            ))}
            <div className="h-6" />
          </div>
        </div>
      </div>
    );
  }

  if (id && selectedItem) {
    const messages = demoThread[id] ?? makeLongThread(id, 12);
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
        <ProfileHeader item={selectedItem} />

        {/* 메시지 영역 */}
        <div
          ref={threadRef}
          className="absolute inset-x-0 bottom-[84px] top-[144px] space-y-4 overflow-y-auto px-4 py-3"
        >
          <div className="flex w-full justify-center">
            <span className="text-[10px] font-normal leading-[1.5] tracking-[-0.2px] text-[#999999]">
              2025년 10월 5일
            </span>
          </div>

          {messages.map((m, idx) => (
            <MessageRow
              key={m.id}
              m={m}
              showPartnerAvatar={isFirstOfPartnerGroup(messages, idx)}
              partnerAvatar={selectedItem.avatar}
              showReadReceipt={m.id === readReceiptId}
            />
          ))}
        </div>

        {/* 하단 입력 영역 */}
        <div className="fixed bottom-5 left-0 right-0 bg-white">
          {/* 전체 프레임(2085664977) 위치 보정: 좌측 여백 20px 기준 */}
          <div className="px-5 py-2">
            <div className="flex items-center gap-2">
              {/* === Frame 2085664976 (정확 반영) === */}
              <div className="flex h-[41px] w-[318px] items-center gap-1 rounded-[20px] bg-[#F3F4F5] px-4 py-[10px]">
                <textarea
                  rows={1}
                  placeholder="메세지 보내기"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="h-[21px] max-h-[84px] w-full resize-none bg-transparent text-[14px] font-normal leading-[1.5] tracking-[-0.2px] text-[#666666] outline-none placeholder:text-[#666666]"
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

              {/* 전송 버튼(별도 프레임 — 스펙 외, 기존 유지) */}
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
        </div>
      </div>
    );
  }

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
