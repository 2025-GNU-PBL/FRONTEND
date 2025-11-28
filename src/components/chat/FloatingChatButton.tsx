import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

const FloatingChatButton = () => {
  const navigate = useNavigate();

  // 안읽은 메시지 총 개수 계산
  const totalUnreadCount = useAppSelector((state) =>
    state.chat.rooms.reduce((sum, room) => sum + room.unread, 0)
  );

  const handleClick = () => {
    navigate("/chat");
  };

  const hasUnread = totalUnreadCount > 0;
  const displayUnread =
    totalUnreadCount > 99 ? "99+" : totalUnreadCount.toString();

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="채팅 열기"
      className="
        fixed
        bottom-4
        right-4
        md:bottom-8
        md:right-8
        z-50
        group
        focus:outline-none
      "
    >
      {/* 전체 캡슐 컨테이너 */}
      <div
        className="
          relative
          flex
          items-center
          gap-3
          rounded-full
          border
          border-white/80
          bg-white/90
          px-3.5
          py-2.5
          shadow-[0_14px_35px_rgba(15,23,42,0.28)]
          backdrop-blur-md
          transition-all
          duration-300
          hover:translate-y-[-1px]
          hover:shadow-[0_18px_40px_rgba(15,23,42,0.32)]
          active:translate-y-[1px]
          active:shadow-[0_8px_20px_rgba(15,23,42,0.24)]
        "
      >
        {/* 좌측 동그라미 아이콘 영역 */}
        <div className="relative">
          {/* 레드 그라데이션 원 */}
          <div
            className="
              grid
              h-11
              w-11
              place-items-center
              rounded-full
              bg-gradient-to-br
              from-[#FF4E5C]
              to-[#FF2233]
              shadow-[0_10px_25px_rgba(255,34,51,0.55)]
              transition-all
              duration-300
              group-hover:scale-[1.04]
              group-hover:shadow-[0_14px_32px_rgba(255,34,51,0.7)]
            "
          >
            <Icon
              icon="solar:chat-round-line-duotone"
              className="h-5 w-5 text-white"
            />
          </div>

          {/* 안 읽은 카운트 뱃지 */}
          {hasUnread && (
            <>
              <span
                className="
                  absolute
                  -top-1
                  -right-1
                  flex
                  h-5
                  min-w-[20px]
                  items-center
                  justify-center
                  rounded-full
                  bg-[#FF2233]
                  px-1.5
                  text-[11px]
                  font-semibold
                  text-white
                  shadow-[0_0_0_1px_rgba(255,255,255,0.9),0_6px_15px_rgba(255,34,51,0.65)]
                "
              >
                {displayUnread}
              </span>

              {/* 부드러운 링 파동 */}
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  rounded-full
                  ring-2
                  ring-[#FF2233]/45
                  animate-ping
                "
                aria-hidden
              />
            </>
          )}
        </div>

        {/* 텍스트 영역 (모바일에서는 살짝 줄이고, md+에서 풀 텍스트) */}
        <div className="hidden sm:flex flex-col items-start pr-1">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#FF2233] uppercase">
            LIVE CHAT
          </span>
          <span className="text-[13px] font-semibold leading-tight text-[#111827]">
            웨딩 상담 채팅
          </span>
        </div>

        {/* 화살표 아이콘 (md 이상에서 보이게) */}
        <Icon
          icon="solar:alt-arrow-right-linear"
          className="
            hidden
            sm:block
            h-4
            w-4
            text-[#9CA3AF]
            transition-transform
            duration-300
            group-hover:translate-x-[2px]
          "
        />
      </div>

      {/* 접근성용 숨김 텍스트 */}
      <span className="sr-only">채팅 상담을 시작하려면 버튼을 눌러주세요.</span>
    </button>
  );
};

export default FloatingChatButton;
