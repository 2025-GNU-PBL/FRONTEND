import React from "react";
import { Icon } from "@iconify/react";

interface MyPageHeaderProps {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
}

export default function MyPageHeader({
  title,
  onBack,
  onMenu,
}: MyPageHeaderProps) {
  return (
    <header className="w-full h-[60px] flex items-center justify-between px-5 bg-[#F6F7FB] border-b border-gray-200">
      {/* 왼쪽: 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="flex items-center justify-center w-[32px] h-[32px] hover:opacity-80 transition"
      >
        <Icon icon="mdi:arrow-left" className="w-5 h-5 text-black" />
      </button>

      {/* 가운데: 타이틀 */}
      <h1 className="text-[18px] font-semibold tracking-[-0.2px] text-black">
        {title}
      </h1>

      {/* 오른쪽: 메뉴 버튼 */}
      <button
        onClick={onMenu}
        className="flex items-center justify-center w-[32px] h-[32px] hover:opacity-80 transition"
      >
        <Icon icon="mdi:menu" className="w-6 h-6 text-black" />
      </button>
    </header>
  );
}
