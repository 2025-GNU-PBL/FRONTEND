import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SideMenu = ({ isOpen, onClose }: Props) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 상단 메뉴(웨딩/스튜디오/메이크업/드레스)
  const menuItems = useMemo(
    () => [
      { label: "웨딩홀", paths: ["/wedding"] },
      { label: "스튜디오", paths: ["/studio"] },
      { label: "메이크업", paths: ["/makeup"] },
      { label: "드레스", paths: ["/dress"] },
    ],
    []
  );

  // 하단 메뉴(FAQ/이벤트/MY PAGE)
  const bottomMenus = useMemo(
    () => [
      { label: "FAQ", path: "/faq" },
      { label: "이벤트", path: "/event" },
      { label: "MY PAGE", path: "/my-page" },
    ],
    []
  );

  // 공통 스타일
  const listBase =
    "flex flex-row items-center w-[217px] h-10 px-6 py-3 gap-[10px] rounded-[12px] text-[14px] font-medium leading-[140%] transition select-none";
  const activeCls = "bg-[#FAF8FB] text-black";
  // 비활성: hover/active/pressed 시에도 FAF8FB 로 변경되도록 설정
  const inactiveCls =
    "bg-white text-[#595F63] hover:bg-[#FAF8FB] hover:text-black active:bg-[#FAF8FB] active:text-black";

  // 하단 메뉴는 패딩/라운드 값만 다름 (디자인 동일)
  const bottomListBase =
    "flex flex-row items-center w-[217px] h-10 px-0 py-3 gap-[10px] rounded-[10px] text-[14px] font-medium leading-[140%] transition select-none";

  return (
    <>
      {/* dimmed */}
      <div
        className={[
          "fixed inset-0 z-40 bg-[rgba(0,0,0,0.6)] transition-opacity duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* drawer panel */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[265px] bg-white shadow-xl",
          "transform transition-transform duration-300 will-change-transform",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* 카피 */}
        <div
          className="absolute left-6 top-20 w-[157px] h-14 font-semibold text-[20px] leading-[138%] text-[#202325]"
          style={{ fontFamily: "Pretendard" }}
        >
          1만 신부님들의 선택
          <br />
          웨딩PICK
        </div>

        {/* 버튼: 로그인 (레드) */}
        <button
          aria-label="로그인"
          className="absolute left-6 top-[156px] w-[105px] h-[37px] flex items-center justify-center 
             px-6 py-2.5 rounded-[20px] bg-[#FF2233] text-white text-[12px] font-medium
             leading-[150%] tracking-[-0.1px]
             transition active:scale-95 hover:bg-[#e61e2d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2233]/40"
          style={{
            fontFamily: "Pretendard",
            WebkitTapHighlightColor: "transparent",
          }}
          onClick={() => {
            onClose();
            navigate("/log-in");
          }}
        >
          로그인
        </button>

        {/* 버튼: 회원가입 (아웃라인) */}
        <button
          aria-label="회원가입"
          className="absolute left-[136px] top-[156px] w-[105px] h-[37px] box-border flex items-center justify-center 
             px-6 py-2.5 rounded-[20px] border border-[rgba(0,0,0,0.2)] bg-white
             text-[12px] font-medium text-[rgba(0,0,0,0.8)] leading-[150%] tracking-[-0.1px]
             transition active:scale-95 hover:border-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          style={{
            fontFamily: "Pretendard",
            WebkitTapHighlightColor: "transparent",
          }}
          onClick={() => {
            onClose();
            navigate("/sign-up"); // ✅ 회원가입은 /sign-up
          }}
        >
          회원가입
        </button>

        {/* 섹션 타이틀 */}
        <div className="absolute left-6 top-[225px] w-[217px] h-5 flex flex-row items-center justify-between gap-[152px] p-0">
          <span
            className="font-semibold text-[14px] leading-[140%] text-[#202325]"
            style={{ fontFamily: "Pretendard" }}
          >
            웨딩
          </span>
        </div>

        {/* 메뉴 리스트 영역 */}
        <div className="absolute left-6 top-[261px] w-[217px] flex flex-col items-start p-0 space-y-1.5">
          {menuItems.map(({ label, paths }) => {
            const isActive = paths.some(
              (p) => pathname === p || pathname.startsWith(p + "/")
            );
            const to = paths[0];
            return (
              <Link
                key={label}
                to={to}
                onClick={onClose}
                className={`${listBase} ${isActive ? activeCls : inactiveCls}`}
                style={{
                  fontFamily: "Pretendard",
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* 하단 메뉴 리스트 */}
        <div className="absolute left-6 top-[623px] w-[217px] flex flex-col items-start p-0 space-y-1.5">
          {bottomMenus.map(({ label, path }) => {
            const isActive =
              pathname === path || pathname.startsWith(path + "/");
            return (
              <Link
                key={label}
                to={path}
                onClick={onClose}
                className={`${bottomListBase} ${
                  isActive ? activeCls : inactiveCls
                }`}
                style={{
                  fontFamily: "Pretendard",
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default SideMenu;
