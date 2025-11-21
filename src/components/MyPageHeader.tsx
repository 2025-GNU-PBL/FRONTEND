import { Icon } from "@iconify/react";

interface MyPageHeaderProps {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
  showMenu?: boolean; // 메뉴 버튼 표시 여부
}

export default function MyPageHeader({
  title,
  onBack,
  onMenu,
  showMenu = true,
}: MyPageHeaderProps) {
  return (
    <header
      className="
        absolute top-[0px] left-0
        w-[390px] h-[60px]
        flex flex-row justify-between items-center
        px-[20px] gap-[4px]
        bg-white
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
        {title}
      </h1>

      {/* 오른쪽: 메뉴 버튼 또는 placeholder */}
      {showMenu ? (
        <button
          onClick={onMenu}
          aria-label="menu"
          className="w-[32px] h-[32px] flex items-center justify-center hover:opacity-80 transition"
        >
          <Icon
            icon="solar:hamburger-menu-linear"
            className="w-[24px] h-[24px] text-[#1E2124]"
          />
        </button>
      ) : (
        <div className="w-[32px] h-[32px]" />
      )}
    </header>
  );
}
