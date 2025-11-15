// src/pages/CheckoutPage/main/views/MobileView.tsx

import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

const MobileView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white font-['Pretendard'] text-[#1E2124]">
      {/* 헤더 */}
      <header className="relative flex h-[60px] items-center justify-between px-5">
        {/* 뒤로가기 아이콘 */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex h-6 w-6 items-center justify-center"
        >
          <Icon
            icon="solar:alt-arrow-left-linear"
            className="h-6 w-6 text-[#1E2124]"
          />
        </button>

        {/* 타이틀 */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
          결제하기
        </div>

        <div className="h-6 w-6" />
      </header>

      {/* 컨텐츠 */}
      <main className="flex-1 overflow-y-auto px-5 pb-[140px]">
        {/* 총 주문 상품 */}
        <div className="mt-5 mb-5 flex items-center gap-3">
          <span className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
            총 주문 상품 2개
          </span>
        </div>

        {/* 첫 번째 상품 */}
        <div className="flex gap-3 px-5 pb-3 pl-5 pr-5">
          <div
            className="h-20 w-20 flex-shrink-0 rounded border border-[#F5F5F5] bg-center bg-cover"
            style={{ backgroundImage: "url('/image.png')" }}
          />
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-1 text-[14px] leading-[1.5] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
              제이바이로이스타
            </div>
            <div className="whitespace-pre-line text-[14px] leading-[1.5] tracking-[-0.2px] text-[#1E2124]">
              [촬영] 신부신랑 헤어메이크업 (부원장)
            </div>
            <div className="mt-auto self-end text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
              323,000원
            </div>
          </div>
        </div>

        {/* 첫 번째 예약 날짜 */}
        <div className="mt-2 flex h-[42px] items-center rounded bg-[#F7F9FA] px-4">
          <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[rgba(0,0,0,0.4)]">
            2025년 11월 19일 예약
          </span>
        </div>

        {/* 구분선 */}
        <div className="my-3 w-full border-b border-[#F5F5F5]" />

        {/* 두 번째 상품 */}
        <div className="flex gap-3 px-5 pb-3 pl-5 pr-5">
          <div
            className="h-20 w-20 flex-shrink-0 rounded border border-[#F5F5F5] bg-center bg-cover"
            style={{ backgroundImage: "url('/image.png')" }}
          />
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-1 text-[14px] leading-[1.5] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
              제이바이로이스타
            </div>
            <div className="whitespace-pre-line text-[14px] leading-[1.5] tracking-[-0.2px] text-[#1E2124]">
              [촬영] 신부신랑 헤어메이크업 (실장)
            </div>
          </div>
        </div>

        {/* 두 번째 예약 날짜 */}
        <div className="mt-2 flex h-[42px] items-center rounded bg-[#F7F9FA] px-4">
          <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[rgba(0,0,0,0.4)]">
            2025년 11월 19일 예약
          </span>
        </div>

        {/* 섹션 사이 회색 바 */}
        <div className="-mx-5 my-5 h-2 w-[calc(100%+40px)] bg-[#F7F9FA]" />

        {/* 쿠폰 혜택 */}
        <section className="mt-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
              쿠폰 혜택
            </span>
          </div>

          {/* 🔥 여기를 누르면 /checkout/coupon 으로 이동하도록 변경함 */}
          <button
            onClick={() => navigate("/checkout/coupon")}
            className="flex h-[54px] w-full items-center justify-center rounded-[10px] border border-[#E8E8E8] active:bg-gray-100"
          >
            <div className="flex w-[310px] items-center justify-between">
              <span className="text-[14px] font-medium leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
                쿠폰
              </span>
              <div className="flex items-center gap-1">
                <span className="text-right text-[14px] leading-[1.5] tracking-[-0.2px] text-[#444444]">
                  사용 가능 0장
                </span>
                <Icon
                  icon="mdi:chevron-down"
                  className="h-4 w-4 text-[#D9D9D9]"
                />
              </div>
            </div>
          </button>
        </section>

        {/* 섹션 사이 회색 바 */}
        <div className="-mx-5 my-8 h-2 w-[calc(100%+40px)] bg-[#F7F9FA]" />

        {/* 결제 금액 요약 */}
        <section className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[16px] leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.8)]">
              총 상품금액
            </span>
            <span className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.8)]">
              290,000원
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[16px] leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.8)]">
              총 할인금액
            </span>
            <span className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.8)]">
              -290,000원
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.8)]">
              결제금액
            </span>
            <span className="text-[20px] font-semibold leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.8)]">
              290,000원
            </span>
          </div>
        </section>
      </main>

      {/* 하단 결제 버튼 */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-[390px] -translate-x-1/2 bg-white px-5 py-5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <button
          type="button"
          className="flex h-14 w-full items-center justify-center rounded-[12px] bg-[#FF2233] px-4"
        >
          <span className="text-[16px] font-semibold leading-[1.5] tracking-[-0.2px] text-white">
            323,000원 결제하기
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileView;
