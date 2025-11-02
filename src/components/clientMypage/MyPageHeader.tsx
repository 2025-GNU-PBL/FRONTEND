import React from "react";
import { Icon } from "@iconify/react";

interface MyPageHeader {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
  showMenu?: boolean; // 메뉴 버튼 표시 여부 추가
}

export default function MyPageHeader({
  title,
  onBack,
  onMenu,
  showMenu = true, // 기본값: true
}: MyPageHeader) {
  return (
    <header className="w-full h-[60px] flex items-center justify-between bg-[#F6F7FB] border-b border-gray-200 relative">
      {/* 왼쪽: 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="absolute left-3 flex items-center justify-center w-[32px] h-[32px] hover:opacity-80 transition"
      >
        <Icon icon="mdi:arrow-left" className="w-5 h-5 text-black" />
      </button>

      {/* 가운데: 타이틀 */}
      <h1 className="mx-auto text-[18px] font-semibold tracking-[-0.2px] text-black">
        {title}
      </h1>

      {/* 오른쪽: 메뉴 버튼 */}
      {showMenu ? (
        <button
          onClick={onMenu}
          className="absolute right-5 flex items-center justify-center w-[32px] h-[32px] hover:opacity-80 transition"
        >
          <Icon icon="mdi:menu" className="w-6 h-6 text-black" />
        </button>
      ) : (
        <div className="w-[32px] absolute right-5" /> // 공간 유지용
      )}
    </header>
  );
}
