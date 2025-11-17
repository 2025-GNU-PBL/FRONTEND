import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import api from "../../../../../lib/api/axios";
import type { OwnerData, UserData } from "../../../../../store/userSlice";

type ApiPaymentStatus = "DONE" | "CANCELED" | "CANCEL_REQUESTED" | "FAILED";

interface SettlementSummary {
  ownerName: string;
  totalSalesAmount: number;
  expectedSettlementAmount: number;
  completedCount: number;
  cancelCount: number;
}

interface SettlementItem {
  orderCode: string;
  paymentKey: string; // ✅ 모바일과 동일하게 paymentKey 사용
  customerName: string;
  amount: number;
  status: ApiPaymentStatus;
  approvedAt: string;
}

interface SettlementsResponse {
  summary: SettlementSummary;
  items: SettlementItem[];
}

/* ----------------------------- OWNER 유저 확인 ----------------------------- */

function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    // ✅ 모바일뷰와 동일한 체크 방식
    return userData as OwnerData;
  }
  return null;
}

/* ----------------------------- 포맷 함수 ----------------------------- */

function formatAmount(amount?: number): string {
  if (amount == null) return "0원";
  return `${amount.toLocaleString("ko-KR")}원`;
}

function formatApprovedAt(iso?: string): {
  dayLabel: string;
  fullLabel: string;
} {
  if (!iso) return { dayLabel: "-", fullLabel: "-" };
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return { dayLabel: "-", fullLabel: "-" };

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return {
    dayLabel: `${month}.${date}`,
    fullLabel: `${year}.${month}.${date} ${hours}:${minutes}`,
  };
}

/* ----------------------------- 상태 뱃지 ----------------------------- */

function StatusBadge({ status }: { status: ApiPaymentStatus }) {
  const isCanceled =
    status === "CANCELED" ||
    status === "FAILED" ||
    status === "CANCEL_REQUESTED";

  if (isCanceled) {
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

/* ----------------------------- 공용 카드 UI ----------------------------- */

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

/* ----------------------------- WebView 본문 ----------------------------- */

export default function WebView() {
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  /* ------- 연/월 (모바일과 동일) ------- */
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  /* ------- API 상태 ------- */
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // ✅ 모바일과 동일

  /* ------- API 호출 ------- */
  const fetchSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await api.get<SettlementsResponse>(
        "/api/v1/payments/settlements/me",
        {
          params: {
            year,
            month,
            page: 0,
            size: 20, // ✅ 모바일과 동일한 페이지 사이즈
          },
        }
      );

      setSummary(res.data.summary);
      setItems(res.data.items || []);
    } catch (err) {
      console.error("웹뷰 settlements api 에러:", err);
      setErrorMsg("매출 데이터를 불러오는 중 오류가 발생했습니다."); // ✅ 모바일과 동일 메시지
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  /* ------- 월 이동 ------- */
  const moveMonth = (diff: number) => {
    const d = new Date(year, month - 1, 1);
    d.setMonth(d.getMonth() + diff);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  /* ------- 로그인 체크 ------- */
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

  const storeName =
    (owner as OwnerData & { bzName?: string }).bzName ||
    summary?.ownerName ||
    "내 매장";

  const totalSales = formatAmount(summary?.totalSalesAmount);
  const cancelCount = summary?.cancelCount ?? 0;

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 상단 타이틀 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.4px]">
                매출 관리
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {storeName}의 매출 현황을 확인해보세요.
              </p>
            </div>
          </div>

          {/* 1. 매출 요약 + 취소 내역 버튼(모바일 맞춤) */}
          <SectionCard
            title={storeName}
            subtitle="월간 매출 요약"
            icon="solar:graph-up-bold-duotone"
            rightSlot={
              <button
                type="button"
                onClick={() => nav("/my-page/owner/payments/cancel")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] text-xs text-white px-3 py-1.5 shadow-sm"
              >
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="w-3.5 h-3.5 rotate-180"
                />
                취소 내역
                <span className="ml-0.5 text-[10px] text-gray-200">
                  {cancelCount}건
                </span>
              </button>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-gray-500">총매출</div>
                  <div className="mt-1 text-[24px] font-semibold text-gray-900 tracking-[-0.3px]">
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
                  </div>
                </div>
              </div>

              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#E0ECFF] to-white flex items-center justify-center">
                <div className="w-14 h-14 rounded-xl bg-[#E0ECFF] shadow-inner" />
              </div>
            </div>
          </SectionCard>

          {/* 2. 월 변경 + 리스트 */}
          <SectionCard
            title="월별 매출 내역"
            subtitle="기간을 선택해 상세 매출을 확인할 수 있습니다"
            icon="solar:calendar-bold-duotone"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* 이전 달 */}
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50"
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-4 h-4 text-[#1E2124]"
                  />
                </button>

                <span className="text-[20px] font-semibold">
                  {year}년 {month}월
                </span>

                {/* 다음 달 */}
                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50"
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-4 h-4 rotate-180 text-[#1E2124]"
                  />
                </button>
              </div>

              {/* 모바일의 '전체' 필터와 톤 맞춘 드롭다운 버튼 (동작은 아직 없음) */}
              <button
                type="button"
                className="flex items-center gap-1 text-[14px] text-black tracking-[-0.2px]"
              >
                <span>전체</span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="w-4 h-4 text-[#999999]"
                />
              </button>
            </div>

            {/* 리스트 */}
            <div className="mt-2 border border-gray-100 rounded-2xl overflow-hidden bg-white">
              <div className="grid grid-cols-[90px_minmax(0,1.6fr)_minmax(0,1.2fr)_80px] px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
                <div>일자</div>
                <div>고객 / 일시</div>
                <div className="text-right">금액</div>
                <div className="text-right">상태</div>
              </div>

              {isLoading && (
                <div className="py-8 text-center text-gray-500 text-sm">
                  매출 데이터를 불러오는 중입니다...
                </div>
              )}

              {errorMsg && !isLoading && (
                <div className="py-8 text-center text-red-500 text-sm">
                  {errorMsg}
                </div>
              )}

              {!isLoading && !errorMsg && (
                <>
                  {items.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      해당 기간의 매출 내역이 없습니다.
                    </div>
                  ) : (
                    items.map((item, idx) => {
                      const { dayLabel, fullLabel } = formatApprovedAt(
                        item.approvedAt
                      );

                      const isCanceled =
                        item.status === "CANCELED" ||
                        item.status === "FAILED" ||
                        item.status === "CANCEL_REQUESTED";

                      const isClickable = item.status === "DONE";

                      const handleClick = () => {
                        if (!isClickable) return;
                        nav(
                          `/my-page/owner/payments/detail?paymentKey=${item.paymentKey}`
                        );
                      };

                      return (
                        <div
                          key={item.orderCode}
                          onClick={handleClick}
                          className={[
                            "grid grid-cols-[90px_minmax(0,1.6fr)_minmax(0,1.2fr)_80px] px-5 py-4 text-sm items-center",
                            idx !== items.length - 1
                              ? "border-b border-gray-50"
                              : "",
                            isClickable
                              ? "cursor-pointer hover:bg-gray-50"
                              : "cursor-default",
                          ].join(" ")}
                        >
                          <div className="text-[14px] font-medium text-[#1E2124]">
                            {dayLabel}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[14px]">
                              {item.customerName}
                            </span>
                            <span className="text-[12px] text-[#999]">
                              {fullLabel}
                            </span>
                          </div>

                          <div className="text-right">
                            <span
                              className={[
                                "text-[15px] font-semibold",
                                isCanceled
                                  ? "text-[#999] line-through"
                                  : "text-[#4170FF]",
                              ].join(" ")}
                            >
                              {formatAmount(item.amount)}
                            </span>
                            {isCanceled && (
                              <div className="mt-0.5 text-[12px] text-[#999]">
                                {item.status === "FAILED" ? "실패" : "취소"}
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end">
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              <div className="px-5 py-3 bg-gray-50 text-[11px] text-gray-400 flex items-center gap-1">
                <Icon icon="solar:info-circle-bold" className="w-3.5 h-3.5" />
                <span>취소 건은 정산에 반영되지 않습니다.</span>
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => nav(-1)}
              className="inline-flex items-center gap-2 text-sm text-gray-500"
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
