import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { logoutUser } from "../../../../../store/thunkFunctions";

export default function WebView() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();

  const userName = useAppSelector((state) => state.user.userData?.name ?? "");

  const go = useCallback((to: string) => nav(to), [nav]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } finally {
      nav("/");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      <main className="max-w-[1200px] mx-auto px-6 py-10 mt-15">
        <div className="grid grid-cols-[1fr_2fr] gap-8 items-start">
          {/* 왼쪽: 프로필 */}
          <section className="space-y-6">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#D9D9D9]" />
                <div>
                  <div className="text-[18px] font-semibold tracking-[-0.2px] text-black">
                    {userName || "로그인이 필요합니다"}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    반가워요! 오늘도 좋은 하루 👋
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <ActionCard
                title="내 정보"
                description="프로필, 연락처, 계정 설정을 관리해요."
                icon="mdi:account-cog-outline"
                cta="관리하기"
                onClick={() => go("/my-page/client/profile")}
              />
              <ActionCard
                title="쿠폰함"
                description="사용 가능 쿠폰과 혜택을 확인해요."
                icon="mdi:ticket-percent-outline"
                cta="바로가기"
                onClick={() => go("/my-page/client/coupons")}
              />
            </div>
          </section>

          {/* 오른쪽: 내 활동 */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
            <h3 className="text-lg font-semibold tracking-[-0.3px] mb-6">
              내 활동
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <MenuTile
                label="결제 관리"
                icon="mdi:credit-card-outline"
                onClick={() => go("/my-page/client/payments")}
              />
              <MenuTile
                label="스케줄 내역"
                icon="mdi:calendar-clock-outline"
                onClick={() => go("/calendar")}
              />
              <MenuTile
                label="문의 내역"
                icon="mdi:message-question-outline"
                onClick={() => go("/my-page/client/inquiries")}
              />
              <MenuTile
                label="리뷰관리"
                icon="mdi:star-outline"
                onClick={() => go("/my-page/client/reviews")}
              />
              <MenuTile
                label="고객센터"
                icon="mdi:lifetime-support"
                onClick={() => go("/support")}
              />
              <MenuTile
                label="로그아웃"
                icon="mdi:logout"
                onClick={handleLogout}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* 재사용 컴포넌트는 그대로 */

function ActionCard({ title, description, icon, cta, onClick }: any) {
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

function MenuTile({ label, icon, onClick }: any) {
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
