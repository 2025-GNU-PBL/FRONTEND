import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export default function WebView() {
  const nav = useNavigate();

  const userName = localStorage.getItem("userName") || "홍종민";

  const go = useCallback((to: string) => nav(to), [nav]);

  const onLogout = useCallback(async () => {
    try {
      if (API_BASE) {
        await axios.post(`${API_BASE}/auth/logout`, null, {
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      nav("/log-in");
    }
  }, [nav]);

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 본문 */}
      <main className="max-w-[1200px] mx-auto px-6 py-10 mt-15">
        <div className="grid grid-cols-[1fr_2fr] gap-8 items-start">
          {/* 왼쪽: 프로필 + 액션 카드 */}
          <section className="space-y-6">
            {/* 프로필 카드 */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#D9D9D9]" />
                <div>
                  <div className="text-[18px] font-semibold tracking-[-0.2px] text-black">
                    {userName}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    반가워요! 오늘도 좋은 하루 👋
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 카드: 내 정보 / 매출·쿠폰 관리 */}
            <div className="flex flex-col gap-4">
              <ActionCard
                title="내 정보"
                description="프로필, 연락처, 계정 설정을 관리해요."
                icon="mdi:account-cog-outline"
                cta="관리하기"
                onClick={() => go("/my-page/owner/profile")}
              />
              <ActionCard
                title="매출 · 쿠폰 관리"
                description="오너 전용 쿠폰 및 매출 현황을 확인해요."
                icon="mdi:ticket-percent-outline"
                cta="바로가기"
                onClick={() => go("/my-page/owner/coupons")}
              />
            </div>
          </section>

          {/* 오른쪽: 내 활동 (오너용 링크) */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
            <h3 className="text-lg font-semibold tracking-[-0.3px] mb-6">
              내 활동
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <MenuTile
                label="쿠폰 관리"
                icon="mdi:ticket-percent-outline"
                onClick={() => go("/my-page/owner/coupons")}
              />
              <MenuTile
                label="일정 관리"
                icon="mdi:calendar-clock-outline"
                onClick={() => go("/my-page/owner/schedules")}
              />
              <MenuTile
                label="상품 관리"
                icon="mdi:shopping-outline"
                onClick={() => go("/my-page/owner/product")}
              />
              <MenuTile
                label="예약 관리"
                icon="mdi:clipboard-text-clock-outline"
                onClick={() => go("/my-page/owner/reservations")}
              />
              <MenuTile
                label="고객센터"
                icon="mdi:lifetime-support"
                onClick={() => go("/support")}
              />
              <MenuTile label="로그아웃" icon="mdi:logout" onClick={onLogout} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ---------- 재사용 컴포넌트 ---------- */

function ActionCard({
  title,
  description,
  icon,
  cta,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
          <Icon icon={icon} className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <h4 className="text-[16px] font-semibold text-gray-900 tracking-[-0.2px]">
            {title}
          </h4>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={onClick}
        className="mt-4 h-9 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm text-gray-700 font-medium self-end"
      >
        {cta}
      </button>
    </div>
  );
}

function MenuTile({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full h-[100px] rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition flex flex-col items-center justify-center gap-3"
    >
      <Icon icon={icon} className="w-7 h-7 text-gray-800" />
      <span className="text-[15px] font-medium text-gray-800 tracking-[-0.2px] text-center">
        {label}
      </span>
    </button>
  );
}
