// src/pages/CheckoutPage/coupon/views/MobileView.tsx

import React, { useState } from "react";
import { Icon } from "@iconify/react";

type CouponCategory = "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

interface Coupon {
  id: number;
  title: string;
  rate: string;
  condition: string;
  period: string;
  category: CouponCategory;
}

const coupons: Coupon[] = [
  {
    id: 1,
    title: "[상반기 WEDDING] 구매금액 1만원 할인",
    rate: "6%",
    condition: "10만원 이상 구매 시 최대 1만원 할인",
    period: "사용기간 : 25.09.29~25.10.31",
    category: "전체",
  },
  {
    id: 2,
    title: "[상반기 WEDDING] 구매금액 1만원 할인",
    rate: "6%",
    condition: "10만원 이상 구매 시 최대 1만원 할인",
    period: "사용기간 : 25.09.29~25.10.31",
    category: "웨딩홀",
  },
  {
    id: 3,
    title: "[상반기 WEDDING] 구매금액 1만원 할인",
    rate: "6%",
    condition: "10만원 이상 구매 시 최대 1만원 할인",
    period: "사용기간 : 25.09.29~25.10.31",
    category: "스튜디오",
  },
];

const MobileView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CouponCategory>("전체");

  const filteredCoupons =
    activeCategory === "전체"
      ? coupons
      : coupons.filter((c) => c.category === activeCategory);

  return (
    <div className="min-h-screen flex justify-center bg-[#F5F5F5]">
      {/* 390 x 844 프레임 */}
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col">
        {/* 상단 여백 (상태바 영역 느낌만) */}
        <div className="h-[16px]" />

        {/* 상단 앱바 (쿠폰선택) */}
        <header className="h-[60px] flex items-center justify-between px-5 border-b border-[#EDEDED] relative">
          {/* 뒤로가기 버튼 */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-8 h-8 flex items-center justify-center"
          >
            <Icon icon="solar:alt-arrow-left-linear" className="w-8 h-8" />
          </button>

          {/* 제목 */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-[600] text-[18px] leading-[29px] tracking-[-0.2px] text-[#000000]">
              쿠폰선택
            </span>
          </div>

          <div className="w-8 h-8" />
        </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 px-5 pt-5 pb-4 overflow-y-auto">
          <div className="w-full max-w-[350px] mx-auto flex flex-col gap-6">
            {/* 상단 텍스트: 상품 쿠폰 / 적용가능 */}
            <div className="flex items-center justify-between h-[21px]">
              <span className="font-[400] text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000]">
                상품 쿠폰 12
              </span>
              <span className="font-[400] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                적용가능 3
              </span>
            </div>

            {/* 카테고리 필터칩 - 글자수만큼 버튼 넓이 조정, 한 줄 */}
            <div className="flex gap-2 h-[37px] flex-nowrap">
              {["전체", "웨딩홀", "스튜디오", "드레스", "메이크업"].map(
                (label) => {
                  const key = label as CouponCategory;
                  const isActive = activeCategory === key;

                  const baseClass =
                    "px-3 py-2 rounded-[20px] h-[37px] text-[14px] leading-[21px] tracking-[-0.2px] whitespace-nowrap";
                  const activeClass =
                    "bg-[#000000] text-[#FEFFFF] border border-[#000000]";
                  const inactiveClass =
                    "bg-[#FEFFFF] text-[#000000] border border-[#D9D9D9]";

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`${baseClass} ${
                        isActive ? activeClass : inactiveClass
                      }`}
                      onClick={() => setActiveCategory(key)}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>

            {/* 쿠폰 리스트 (Figma 스펙 반영 버전) */}
            <div className="flex flex-col gap-4 pb-4">
              {filteredCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex flex-row items-center w-[350px] h-[129px]"
                >
                  {/* 왼쪽 쿠폰 본문 (Frame 2085665014) */}
                  <div className="flex flex-col items-start p-4 gap-[10px] w-[278px] h-[129px] border border-[#F2F2F2] border-r-0 rounded-l-[16px]">
                    {/* 상단 타이틀 + 할인율 (Frame 2085665013) */}
                    <div className="flex flex-col items-start gap-1 w-[222px] h-[97px]">
                      <p className="w-[222px] h-[21px] font-[400] text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000]">
                        {coupon.title}
                      </p>
                      <p className="w-[222px] h-[32px] font-[700] text-[20px] leading-[32px] tracking-[-0.2px] text-[#000000]">
                        {coupon.rate}
                      </p>
                    </div>

                    {/* 하단 조건/기간 (Frame 2085665012) */}
                    <div className="flex flex-col items-start w-[169px] h-[36px]">
                      <p className="w-[169px] h-[18px] font-[400] text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                        {coupon.condition}
                      </p>
                      <p className="w-[169px] h-[18px] font-[400] text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                        {coupon.period}
                      </p>
                    </div>
                  </div>

                  {/* 오른쪽 적용 화살표 영역 (Frame 2085665015) */}
                  <div className="flex flex-row items-center px-[18px] gap-[10px] w-[72px] h-[129px] bg-[#F6F7FB] border border-[#F2F2F2] border-l-0 rounded-r-[16px]">
                    {/* 동그란 버튼 (Frame 2085665011) */}
                    <div className="flex flex-row items-center justify-center p-[10px] gap-[10px] w-[36px] h-[36px] bg-[#FFFFFF] rounded-[20px]">
                      <Icon
                        icon="streamline:arrow-down-2"
                        className="w-4 h-4 text-[#000000]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* 하단 적용 버튼 영역 */}
        <div className="px-5 pb-5 pt-1">
          <div className="w-full max-w-[350px] mx-auto">
            <button
              type="button"
              className="w-full h-[56px] rounded-[12px] bg-[#FF2233] flex items-center justify-center"
            >
              <span className="font-[600] text-[16px] leading-[24px] tracking-[-0.2px] text-white">
                0원 적용하기
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
