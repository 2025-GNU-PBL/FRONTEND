// src/pages/CheckoutPage/main/views/WebView.tsx

import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

const WebView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#F5F6FA] font-['Pretendard'] text-[#1E2124]">
      {/* 네비게이션바 때문에 전체 여백 */}
      <div className="mx-auto pt-22 flex w-full max-w-6xl flex-col gap-6 px-6 pb-10">
        {/* 상단 헤더 영역 */}
        <header className="flex items-center justify-between rounded-2xl bg-white/90 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ECEFF3] bg-white transition-colors hover:bg-[#F3F4F6]"
            >
              <Icon
                icon="solar:alt-arrow-left-linear"
                className="h-5 w-5 text-[#1E2124]"
              />
            </button>
            <div className="flex flex-col">
              <h1 className="text-[20px] font-semibold tracking-[-0.3px] text-[#111827]">
                결제하기
              </h1>
              <span className="mt-0.5 text-[12px] leading-[1.5] text-[#9CA3AF]">
                예약 정보를 확인하고 결제를 진행해 주세요.
              </span>
            </div>
          </div>

          {/* 진행 단계 표시 */}
          <div className="flex items-center gap-2 rounded-full bg-[#F9FAFB] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF2233]" />
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#6B7280]">
              STEP 2 · 결제정보
            </span>
          </div>
        </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="flex flex-1 flex-col gap-6 lg:flex-row">
          {/* 좌측: 주문/예약 정보 */}
          <section className="flex-1 space-y-6">
            {/* 주문 상품 카드 */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              {/* 카드 타이틀 영역 */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#FFF1F2] px-2.5 py-1 text-[11px] font-medium tracking-[-0.2px] text-[#FF2233]">
                    주문상품
                  </span>
                  <span className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                    총 주문 상품 2개
                  </span>
                </div>
              </div>

              {/* 첫 번째 상품 */}
              <div className="flex gap-4 border-b border-[#F3F4F6] pb-4">
                <div
                  className="h-[92px] w-[92px] flex-shrink-0 rounded-[14px] border border-[#E5E7EB] bg-cover bg-center"
                  style={{ backgroundImage: "url('/image.png')" }}
                />
                <div className="flex flex-1 flex-col justify-center">
                  <div className="mb-1 text-[13px] leading-[1.5] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                    제이바이로이스타
                  </div>
                  <div className="mb-2 whitespace-pre-line text-[15px] leading-[1.4] tracking-[-0.2px] text-[#111827]">
                    [촬영] 신부신랑 헤어메이크업 (부원장)
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[#9CA3AF]">
                      VAT 포함 금액
                    </span>
                    <span className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                      323,000원
                    </span>
                  </div>
                </div>
              </div>

              {/* 첫 번째 예약 날짜 */}
              <div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#F7F9FA] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="solar:calendar-outline"
                    className="h-4 w-4 text-[#6B7280]"
                  />
                  <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[rgba(0,0,0,0.6)]">
                    2025년 11월 19일 예약
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#9CA3AF]">
                  촬영 당일 현장 결제 불가
                </span>
              </div>

              {/* 두 번째 상품 */}
              <div className="mt-6 flex gap-4 border-b border-[#F3F4F6] pb-4">
                <div
                  className="h-[92px] w-[92px] flex-shrink-0 rounded-[14px] border border-[#E5E7EB] bg-cover bg-center"
                  style={{ backgroundImage: "url('/image.png')" }}
                />
                <div className="flex flex-1 flex-col justify-center">
                  <div className="mb-1 text-[13px] leading-[1.5] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                    제이바이로이스타
                  </div>
                  <div className="whitespace-pre-line text-[15px] leading-[1.4] tracking-[-0.2px] text-[#111827]">
                    [촬영] 신부신랑 헤어메이크업 (실장)
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[#9CA3AF]">
                      VAT 포함 금액
                    </span>
                    <span className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                      323,000원
                    </span>
                  </div>
                </div>
              </div>

              {/* 두 번째 예약 날짜 */}
              <div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#F7F9FA] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="solar:calendar-outline"
                    className="h-4 w-4 text-[#6B7280]"
                  />
                  <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[rgba(0,0,0,0.6)]">
                    2025년 11월 19일 예약
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#9CA3AF]">
                  촬영 일정 변경 시 매장 문의
                </span>
              </div>
            </div>
          </section>

          {/* 우측: 쿠폰 혜택 + 결제 요약 */}
          <aside className="w-full max-w-sm space-y-4 lg:sticky lg:top-28">
            {/* 쿠폰 혜택 카드 (위) */}
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.07)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-medium tracking-[-0.2px] text-[#4F46E5]">
                      혜택
                    </span>
                    <span className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                      쿠폰 혜택
                    </span>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF]">
                    보유한 쿠폰을 선택하면 결제금액에 반영돼요.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout/coupon")}
                className="flex h-[52px] w-full items-center justify-between rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-left transition-all hover:border-[#FF2233] hover:bg-[#FFF5F5]"
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium leading-[1.6] tracking-[-0.2px] text-[#111827]">
                    쿠폰 선택
                  </span>
                  <span className="text-[11px] leading-[1.5] text-[#9CA3AF]">
                    사용 가능 0장
                  </span>
                </div>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-5 w-5 text-[#D1D5DB]"
                />
              </button>
            </div>

            {/* 결제 요약 카드 (아래) */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold tracking-[-0.2px] text-[#111827]">
                  결제 요약
                </h2>
                <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
                  안전 결제
                </span>
              </div>

              <div className="space-y-3 border-b border-[#F3F4F6] pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.7)]">
                    총 상품금액
                  </span>
                  <span className="text-[14px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                    290,000원
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[14px] leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.7)]">
                    총 할인금액
                  </span>
                  <span className="text-[14px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#16A34A]">
                    -290,000원
                  </span>
                </div>
              </div>

              <div className="mt-4 mb-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#111827]">
                    결제금액
                  </span>
                  <span className="text-[11px] text-[#9CA3AF]">
                    쿠폰 및 할인 적용 후 실제 결제되는 금액입니다.
                  </span>
                </div>
                <span className="text-[20px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                  290,000원
                </span>
              </div>

              <div className="mb-4 rounded-[12px] bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#6B7280]">
                <div className="flex items-start gap-2">
                  <Icon
                    icon="solar:shield-check-outline"
                    className="mt-[2px] h-4 w-4 text-[#10B981]"
                  />
                  <p>
                    카드사 무이자/부분 무이자 할부가 적용될 수 있으며, 결제 완료
                    후 마이페이지에서 상세 내역을 확인하실 수 있어요.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout/payment")}
                className="mt-2 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#FF2233] px-4 text-[15px] font-semibold leading-[1.5] tracking-[-0.2px] text-white shadow-[0_14px_32px_rgba(255,34,51,0.45)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                323,000원 결제하기
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default WebView;
