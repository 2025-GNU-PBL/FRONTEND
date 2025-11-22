import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { logoutUser } from "../../../../../store/thunkFunctions";
import { forceLogout } from "../../../../../store/userSlice";

export default function MobileView() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();

  const userName = useAppSelector((state) => state.user.userData?.name ?? "");

  const go = useCallback((to: string) => nav(to), [nav]);
  const onBack = useCallback(() => nav(-1), [nav]);
  const onMenu = useCallback(() => go("/settings"), [go]);

  /** 로그아웃 처리 */
  const onLogout = useCallback(async () => {
    try {
      // 서버 로그아웃 요청 (userSlice.logoutUser)
      await dispatch(logoutUser()).unwrap();
    } catch (e) {
      // 실패 시 프론트 강제 로그아웃 (token + Redux 초기화)
      console.error("logoutUser 실패, forceLogout 실행:", e);
      dispatch(forceLogout());
    } finally {
      // 로그인 페이지로 이동
      nav("/");
    }
  }, [dispatch, nav]);

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-[390px] min-h-[844px] bg-white flex flex-col">
        {/* 최상단 헤더 */}
        <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
          <MyPageHeader
            title="마이페이지"
            onBack={onBack}
            onMenu={onMenu}
            showMenu={false}
          />
        </div>

        {/* 메인 콘텐츠 */}
        <main className="flex-1">
          {/* 프로필 + 상단 카드 2개 */}
          <section className="bg-[#F6F7FB]">
            <div className="px-5 pt-20 pb-6">
              {/* 프로필 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#D9D9D9]" />
                <div className="text-[18px] font-semibold tracking-[-0.2px] text-black">
                  {userName || "로그인이 필요합니다"}
                </div>
              </div>

              {/* 상단 2버튼 */}
              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  onClick={() => go("/my-page/owner/profile")}
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
                  onClick={() => go("/my-page/owner/payments")}
                  className="h-[61px] rounded-[12px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex items-center justify-center active:opacity-80"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Icon
                      icon="mdi:ticket-percent-outline"
                      className="w-5 h-5"
                    />
                    <span className="text-[16px] tracking-[-0.5px]">
                      매출관리
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
                label="쿠폰관리"
                onClick={() => go("/my-page/owner/coupons")}
              />
              <MidLink
                label="일정관리"
                onClick={() => go("/my-page/owner/schedules")}
              />
              <MidLink
                label="상품관리"
                onClick={() => go("/my-page/owner/products/management")}
              />
              <MidLink
                label="예약관리"
                onClick={() => go("/my-page/owner/reservations")}
              />
              <MidLink
                label="취소내역관리"
                onClick={() => go("/my-page/owner/cancels")}
              />
            </div>
          </section>
        </main>

        {/* 고객센터 | 로그아웃 */}
        <section className="px-5 py-4 mb-20">
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

/** 중간 버튼 공용 컴포넌트 */
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
