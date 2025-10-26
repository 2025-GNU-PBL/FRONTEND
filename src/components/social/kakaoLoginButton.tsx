// src/components/social/kakaoLoginButton.tsx
import { buildKakaoAuthUrl } from "../../lib/auth/kakao";
import type { UserRole } from "../../lib/auth/types";

export default function KakaoLoginButton({ role }: { role: UserRole }) {
  const onClick = () => {
    const url = buildKakaoAuthUrl(role);
    window.location.href = url;
  };

  return (
    <button
      onClick={onClick}
      className="w-full py-3.5 rounded-[50px] bg-[#FEE500] text-[#33363D] font-semibold flex items-center justify-center gap-2"
    >
      <img src="/images/kakao.png" alt="kakao" className="h-[24px]" />
      카카오톡으로 시작하기
    </button>
  );
}
