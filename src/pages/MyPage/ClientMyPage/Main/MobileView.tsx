import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch /*, useSelector*/ } from "react-redux";
// import { selectUserName, logoutThunk } from "@/store/authSlice";
import MyPageHeader from "../../../../components/clientMypage/MyPageHeader";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export default function MobileView() {
  const nav = useNavigate();
  const dispatch = useDispatch();

  // const userName = useSelector(selectUserName) ?? "홍종민";
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
      // ignore: 서버 로그아웃 실패해도 클라 정리
    } finally {
      // await dispatch(logoutThunk());
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      nav("/log-in");
    }
  }, [nav, dispatch]);

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-[390px] min-h-[844px] bg-white flex flex-col">
        {/* 최상단 헤더 */}
        <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
          <div className="px-5">
            <MyPageHeader
              title="마이페이지"
              onBack={() => nav(-1)}
              onMenu={() => go("/settings")}
            />
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <main className="flex-1">
          {/* 프로필 + 상단 카드 2개 */}
          <section className="bg-[#F6F7FB]">
            <div className="px-5 pt-4 pb-6">
              {/* 프로필 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#D9D9D9]" />
                <div className="text-[18px] font-semibold tracking-[-0.2px] text-black">
                  {userName}
                </div>
              </div>

              {/* 상단 2버튼 */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => go("/my-page/profile")}
                  className="h-[61px] rounded-[12px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex items-center justify-center active:opacity-80"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Icon
                      icon="mdi:card-account-details-outline"
                      className="w-5 h-5"
                    />
                    <span className="text-[16px] tracking-[-0.5px]">
                      내 정보
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => go("/my-page/coupons")}
                  className="h-[61px] rounded-[12px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex items-center justify-center active:opacity-80"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Icon
                      icon="mdi:ticket-percent-outline"
                      className="w-5 h-5"
                    />
                    <span className="text-[16px] tracking-[-0.5px]">
                      쿠폰함
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* 중간 링크 */}
          <section className="px-5 py-8">
            <div className="grid grid-cols-2 gap-6">
              <MidLink
                label="결제 관리"
                onClick={() => go("/my-page/payments")}
              />
              <MidLink
                label="스케줄 내역"
                onClick={() => go("/my-page/schedules")}
              />
              <MidLink
                label="문의 내역"
                onClick={() => go("/my-page/inquiries")}
              />
              <MidLink
                label="리뷰관리"
                onClick={() => go("/my-page/reviews")}
              />
            </div>
          </section>
        </main>

        {/* 고객센터 | 로그아웃 */}
        <section className="px-5 py-4 mb-18">
          <div className="flex items-center justify-center gap-10">
            <button
              onClick={() => go("/support")}
              className="text-[16px] tracking-[-0.2px] hover:opacity-80"
            >
              고객센터
            </button>
            <div className="w-6 h-px bg-black/80 rotate-90" />
            <button
              onClick={onLogout}
              className="text-[16px] tracking-[-0.2px] hover:opacity-80"
            >
              로그아웃
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MidLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-[56px] rounded-lg hover:bg-gray-50 transition inline-flex items-center justify-center text-[16px]"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <span className="leading-[26px] tracking-[-0.2px]">{label}</span>
      </span>
    </button>
  );
}
