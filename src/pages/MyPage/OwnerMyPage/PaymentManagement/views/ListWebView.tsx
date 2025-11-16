import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";

type SalesStatus = "PAID" | "CANCELED";

interface SalesItem {
  id: number;
  date: string; // "10.01"
  name: string;
  dateTime: string; // "2025.10.01 22:12"
  amount: string; // "2,550,500원"
  status: SalesStatus;
}

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && (userData as any).userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** 공용 카드 컴포넌트 (참고 디자인과 동일 스타일) */
function SectionCard({
  title,
  subtitle,
  icon,
  rightSlot,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/5">
              <Icon icon={icon} className="w-5 h-5 text-[#1E2124]" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-gray-900 truncate">
              {title}
            </h3>
            {subtitle ? (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {rightSlot ? (
          <div className="ml-4 flex-shrink-0">{rightSlot}</div>
        ) : null}
      </div>
      <div className="px-6">
        <div className="h-px bg-gray-100" />
      </div>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

/** 매출 상태 뱃지 */
function StatusBadge({ status }: { status: SalesStatus }) {
  if (status === "CANCELED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
        취소
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E5F0FF] text-[#4170FF]">
      결제완료
    </span>
  );
}

/** 사장(OWNER) 마이페이지 - 매출 관리 (Web) */
export default function WebView() {
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  // 임시 더미 데이터 (모바일과 동일)
  const totalSales = "1,250,000원";
  const cancelCount = 1;

  const salesList: SalesItem[] = [
    {
      id: 1,
      date: "10.01",
      name: "김지원",
      dateTime: "2025.10.01 22:12",
      amount: "2,550,500원",
      status: "PAID",
    },
    {
      id: 2,
      date: "10.01",
      name: "김지원",
      dateTime: "2025.10.01 22:12",
      amount: "2,550,500원",
      status: "PAID",
    },
    {
      id: 3,
      date: "10.01",
      name: "김지원",
      dateTime: "2025.10.01 22:12",
      amount: "2,550,500원",
      status: "CANCELED",
    },
  ];

  // 비로그인/권한 불일치 처리 (참고 웹뷰와 동일 패턴)
  if (!owner) {
    return (
      <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />
        <div className="pt-16 pb-16">
          <div className="max-w-[960px] mx-auto px-6">
            <SectionCard
              title="접근 불가"
              subtitle="사장님 계정으로 로그인 후 이용해 주세요."
              icon="solar:shield-warning-bold-duotone"
            >
              <div className="px-2 py-8 text-center text-sm text-gray-500">
                사장님 정보가 없습니다. 다시 로그인해주세요.
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    );
  }

  const storeName = (owner as OwnerData & { bzName?: string }).bzName;
  const displayStoreName =
    storeName && storeName.trim() !== "" ? storeName : "내 매장";

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
      {/* 상단 그라디언트 바 (참고 디자인 공통 요소) */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 상단 타이틀 + 간단 설명 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-gray-900">
                매출 관리
              </h1>
              <p className="mt-1 text-sm text-gray-500 tracking-[-0.2px]">
                {displayStoreName}의 매출 현황을 확인해보세요.
              </p>
            </div>
          </div>

          {/* 1. 매출 요약 카드 (모바일 상단 카드 → 웹 SectionCard로 변환) */}
          <SectionCard
            title={displayStoreName}
            subtitle="월간 매출 요약"
            icon="solar:graph-up-bold-duotone"
            rightSlot={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] text-xs text-white px-3 py-1.5 shadow-sm hover:bg-black/90"
              >
                <Icon
                  icon="solar:download-minimalistic-bold"
                  className="w-3.5 h-3.5"
                />
                매출 다운로드
              </button>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-gray-500">총매출</div>
                  <div className="mt-1 text-[24px] font-semibold text-gray-900 tracking-[-0.3px] leading-[32px]">
                    {totalSales}
                  </div>
                </div>

                <div className="h-12 w-px bg-gray-200 hidden sm:block" />

                <div>
                  <div className="text-xs text-gray-500">취소 건수</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[16px] font-medium text-gray-900">
                      {cancelCount}건
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[12px] text-[#4170FF] hover:text-[#2654d4]"
                    >
                      상세 보기
                      <Icon
                        icon="solar:alt-arrow-right-linear"
                        className="w-3.5 h-3.5"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* 우측 작은 일러스트 영역 (모바일 image 영역 대응) */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#E0ECFF] to-white flex items-center justify-center">
                <div className="w-14 h-14 rounded-xl bg-[#E0ECFF] shadow-inner" />
              </div>
            </div>
          </SectionCard>

          {/* 2. 월 선택 + 필터 영역 (모바일 상단 필터 → 웹 상단 컨트롤 바) */}
          <SectionCard
            title="월별 매출 내역"
            subtitle="기간과 상태를 선택해 상세 매출을 확인할 수 있습니다"
            icon="solar:calendar-bold-duotone"
            rightSlot={
              <div className="flex items-center gap-3">
                {/* 상태 필터 */}
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <span>전체</span>
                  <Icon
                    icon="solar:alt-arrow-down-linear"
                    className="w-3.5 h-3.5 text-gray-400"
                  />
                </button>
              </div>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              {/* 월 네비게이션 (모바일의 좌/우 화살표 + 월 텍스트) */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50"
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-4 h-4 text-[#1E2124]"
                  />
                </button>
                <span className="text-[20px] font-semibold text-[#1E2124] tracking-[-0.2px]">
                  2025년 10월
                </span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-100 text-gray-300 cursor-default"
                  disabled
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-4 h-4 rotate-180"
                  />
                </button>
              </div>
            </div>

            {/* 3. 매출 리스트 (모바일 리스트를 웹 테이블 느낌으로) */}
            <div className="mt-2 border border-gray-100 rounded-2xl overflow-hidden bg-white">
              {/* 헤더 행 */}
              <div className="grid grid-cols-[90px_minmax(0,1.6fr)_minmax(0,1.2fr)_80px] px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 tracking-[-0.2px]">
                <div>일자</div>
                <div>고객 / 일시</div>
                <div className="text-right">금액</div>
                <div className="text-right">상태</div>
              </div>

              {/* 데이터 행 */}
              {salesList.map((item, idx) => {
                const isCanceled = item.status === "CANCELED";

                return (
                  <div
                    key={item.id}
                    className={[
                      "grid grid-cols-[90px_minmax(0,1.6fr)_minmax(0,1.2fr)_80px] px-5 py-4 text-sm items-center",
                      idx !== salesList.length - 1
                        ? "border-b border-gray-50"
                        : "",
                    ].join(" ")}
                  >
                    {/* 일자 */}
                    <div className="text-[14px] font-medium text-[#1E2124] tracking-[-0.2px]">
                      {item.date}
                    </div>

                    {/* 고객명 + 일시 */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] text-[#1E2124] tracking-[-0.2px]">
                        {item.name}
                      </span>
                      <span className="text-[12px] text-[#999999] tracking-[-0.2px]">
                        {item.dateTime}
                      </span>
                    </div>

                    {/* 금액 */}
                    <div className="text-right">
                      <span
                        className={[
                          "text-[15px] font-semibold tracking-[-0.2px]",
                          isCanceled
                            ? "text-[#999999] line-through"
                            : "text-[#4170FF]",
                        ].join(" ")}
                      >
                        {item.amount}
                      </span>
                    </div>

                    {/* 상태 뱃지 */}
                    <div className="flex justify-end">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                );
              })}

              {/* 리스트 하단 안내 텍스트 */}
              <div className="px-5 py-3 bg-gray-50 text-[11px] text-gray-400 flex items-center gap-1">
                <Icon icon="solar:info-circle-bold" className="w-3.5 h-3.5" />
                <span>
                  취소 건은 금액이 취소선과 함께 표시되며, 정산에는 반영되지
                  않습니다.
                </span>
              </div>
            </div>
          </SectionCard>

          {/* 하단 액션: 뒤로가기 정도만 두기 (옵션) */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => nav(-1)}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
