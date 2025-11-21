import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { logoutUser } from "../../../../store/thunkFunctions";
import SideMenu from "../../../../components/SideMenu";

// 메인 페이지처럼 메뉴 상태를 부모에서 내려받도록 Props 정의
type Props = {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

export default function MobileView({ isMenuOpen, openMenu, closeMenu }: Props) {
  const nav = useNavigate();
  const dispatch = useAppDispatch();

  const userName = useAppSelector((state) => state.user.userData?.name ?? "");

  const go = useCallback((to: string) => nav(to), [nav]);
  const onBack = useCallback(() => nav(-1), [nav]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } finally {
      nav("/");
    }
  };

  return (
    <div className="w-full bg-white relative">
      <div className="mx-auto w-[390px] min-h-[844px] flex flex-col">
        {/* 최상단 헤더 */}
        <header
          className="
        absolute top-[0px] left-0
        w-[390px] h-[60px]
        flex flex-row justify-between items-center
        px-[20px] gap-[4px]
        bg-[#F6F7FB]
      "
        >
          {/* Back Button */}
          <button
            className="w-8 h-8 flex items-center justify-center"
            type="button"
            onClick={onBack}
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="w-8 h-8 text-[#1E2124]"
            />
          </button>
          {/* 가운데: 타이틀 */}
          <h1
            className="
          text-[18px] font-semibold text-[#1E2124]
          tracking-[-0.2px] select-none
        "
          >
            마이페이지
          </h1>
          {/* 햄버거 메뉴 버튼 -> 메뉴 열기 */}
          <button
            className="flex items-center justify-center hover:opacity-80 active:scale-95"
            type="button"
            aria-label="메뉴 열기"
            onClick={openMenu}
          >
            <Icon icon="mynaui:menu" className="w-6 h-6 text-black/80" />
          </button>
        </header>

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
                  onClick={() => go("/my-page/client/profile")}
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
                  onClick={() => go("/my-page/client/coupons")}
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
                onClick={() => go("/my-page/client/payments")}
              />
              <MidLink label="스케줄 내역" onClick={() => go("/calendar")} />
              <MidLink
                label="예약 내역"
                onClick={() => go("/my-page/client/inquiries")}
              />
              <MidLink
                label="리뷰 내역"
                onClick={() => go("/my-page/client/reviews")}
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
              onClick={handleLogout}
              className="text-[16px] tracking-[-0.2px] hover:opacity-80"
            >
              로그아웃
            </button>
          </div>
        </section>
      </div>

      {/* 메인 페이지처럼 사이드 메뉴 붙이기 */}
      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
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
