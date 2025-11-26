// src/components/social/NaverLoginButton.tsx
import { buildNaverAuthUrl } from "../../lib/auth/naver";
import type { UserRole } from "../../lib/auth/types";

type Props = {
  role: UserRole;
  className?: string;
};

export default function NaverLoginButton({ role, className = "" }: Props) {
  const onClick = () => {
    const url = buildNaverAuthUrl(role);
    window.location.href = url;
  };

  return (
    <button
      onClick={onClick}
      aria-label="네이버로 시작하기"
      className={[
        // Frame 2085665021
        "flex items-center justify-center",
        "rounded-[50px]",
        "bg-[#03C75A]", // 네이버 공식 색상
        "h-[56px]",
        "w-full",
        "px-0 py-4",
        "shadow-none border-0",
        "transition-all duration-200 hover:brightness-95",
        className,
      ].join(" ")}
    >
      {/* Frame 1937 (row, gap 8px) */}
      <span className="flex items-center justify-center gap-2 h-[24px]">
        {/* icon 24px */}
        <img
          src="/images/naver.png"
          alt="naver"
          className="h-[24px] w-[24px] select-none"
          draggable={false}
        />

        {/* 텍스트: Pretendard 16 / 600 / White */}
        <span
          className="text-[16px] font-semibold leading-[150%] tracking-[-0.2px] text-white"
          style={{ fontFamily: "Pretendard, sans-serif" }}
        >
          네이버로 시작하기
        </span>
      </span>
    </button>
  );
}
