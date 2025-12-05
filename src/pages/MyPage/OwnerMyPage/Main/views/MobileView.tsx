import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { logoutUser } from "../../../../../store/thunkFunctions";
import SideMenu from "../../../../../components/SideMenu";
import { useRefreshAuth } from "../../../../../hooks/useRefreshAuth"; // 🔹 경로는 프로젝트 구조에 맞게 조정
import type { OwnerData, UserData } from "../../../../../store/userSlice";

// 메인 페이지처럼 메뉴 상태를 부모에서 내려받도록 Props 정의
type Props = {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

export default function MobileView({ isMenuOpen, openMenu, closeMenu }: Props) {
  const nav = useNavigate();
  const dispatch = useAppDispatch();

  // 전체 userData에서 OWNER를 보장해서 꺼내고, 거기서 name / profileImage 사용
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const userName = owner?.name ?? "";
  const profileImage = owner?.profileImage ?? "";

  const { refreshAuth } = useRefreshAuth(); // 🔹 auth 리프레시 훅 사용

  const go = useCallback((to: string) => nav(to), [nav]);
  const onBack = useCallback(() => nav(-1), [nav]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } finally {
      nav("/");
    }
  };

  // 🔹 마이페이지 진입 시(컴포넌트 마운트 시) auth 갱신
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <div className="w-full min-h-screen bg-white relative flex flex-col">
      {/* 헤더 - 전체 너비 채움 */}
      <header className="w-full h-[60px] flex items-center justify-between px-5 bg-[#F6F7FB] sticky top-0 z-20">
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
        <h1 className="text-[18px] font-semibold text-[#1E2124] tracking-[-0.2px]">
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

      {/* 메인 컨텐츠 - 전체 너비 */}
      <main className="flex-1 w-full">
        {/* 프로필 + 상단 카드 2개 */}
        <section className="bg-[#F6F7FB] w-full">
          <div className="w-full px-5 pt-6 pb-6">
            {/* 프로필 */}
            <div className="flex items-center gap-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="프로필 이미지"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#D9D9D9]" />
              )}
              <div className="text-[18px] font-semibold tracking-[-0.2px] text-black">
                {userName || "로그인이 필요합니다"}
              </div>
            </div>

            {/* 상단 2 버튼 */}
            <div className="mt-7 grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => go("/my-page/owner/profile")}
                className="h-[61px] w-full rounded-[12px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex items-center justify-center active:opacity-80"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Icon
                    icon="mdi:card-account-details-outline"
                    className="w-5 h-5"
                  />
                  <span className="text-[16px] tracking-[-0.5px]">내 정보</span>
                </span>
              </button>

              <button
                onClick={() => go("/my-page/owner/payments")}
                className="h-[61px] w-full rounded-[12px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex items-center justify-center active:opacity-80"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Icon icon="mdi:ticket-percent-outline" className="w-5 h-5" />
                  <span className="text-[16px] tracking-[-0.5px]">
                    매출관리
                  </span>
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* 중간 링크 */}
        <section className="w-full px-5 py-8">
          <div className="grid grid-cols-2 gap-6 w-full">
            <MidLink
              label="쿠폰관리"
              onClick={() => go("/my-page/owner/coupons")}
            />
            <MidLink label="일정관리" onClick={() => go("/calendar")} />
            <MidLink
              label="상품관리"
              onClick={() => go("/my-page/owner/products/management")}
            />
            <MidLink
              label="예약관리"
              onClick={() => go("/my-page/owner/reservations")}
            />
            <MidLink
              label="취소요청관리"
              onClick={() => go("/my-page/owner/cancels")}
            />
          </div>
        </section>
      </main>

      {/* 고객센터 | 로그아웃 */}
      <section className="w-full px-5 py-4 mb-20">
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
