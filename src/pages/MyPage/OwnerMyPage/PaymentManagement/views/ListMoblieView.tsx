import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import { useAppSelector } from "../../../../../store/hooks";
import api from "../../../../../lib/api/axios";
import type { OwnerData, UserData } from "../../../../../store/userSlice";

/** 서버 결제 상태 타입 */
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
  customerName: string;
  amount: number;
  status: ApiPaymentStatus;
  approvedAt: string; // ISO 문자열
}

interface SettlementsResponse {
  summary: SettlementSummary;
  items: SettlementItem[];
}

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** 금액 포맷터: 123456 -> "123,456원" */
function formatAmount(amount?: number): string {
  if (amount == null) return "0원";
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 날짜 포맷터: ISO -> { dayLabel: "10.01", fullLabel: "2025.10.01 22:12" } */
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

/** 사장(OWNER) 마이페이지 - 매출 관리 (Mobile) */
export default function MobileView() {
  const nav = useNavigate();

  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  // 연/월 상태 (기본: 오늘 기준)
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1~12

  // API 데이터 상태
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 로그인 안 됐거나 OWNER가 아니면 안내
  if (!owner) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col">
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <MyPageHeader
              title="매출 관리"
              onBack={() => nav(-1)}
              showMenu={false}
            />
          </div>
          <div className="flex-1 px-5 pt-20 flex items-center justify-center text-sm text-gray-500">
            사장님 정보가 없습니다. 다시 로그인해주세요.
          </div>
        </div>
      </div>
    );
  }

  const storeName = (owner as OwnerData & { bzName?: string }).bzName;
  const displayStoreName =
    storeName && storeName.trim() !== ""
      ? storeName
      : summary?.ownerName || "내 매장";

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
            size: 20,
          },
        }
      );

      setSummary(res.data.summary);
      setItems(res.data.items || []);
    } catch (error) {
      console.error(error);
      setErrorMsg("매출 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // 월 이동
  const moveMonth = (diff: number) => {
    const base = new Date(year, month - 1, 1);
    base.setMonth(base.getMonth() + diff);
    setYear(base.getFullYear());
    setMonth(base.getMonth() + 1);
  };

  const totalSalesText = formatAmount(summary?.totalSalesAmount);
  const cancelCount = summary?.cancelCount ?? 0;

  return (
    <div className="w-full bg-white">
      {/* 390 x 844 디바이스 프레임 */}
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col">
        {/* 헤더 (StatusBar, Dynamic Island 등은 사용하지 않고 공통 헤더만 사용) */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <MyPageHeader
            title="매출 관리"
            onBack={() => nav(-1)}
            showMenu={true}
          />
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-auto px-5 pt-20 pb-8 space-y-4">
          {/* 상단 매출 요약 카드 */}
          <section className="w-full rounded-lg bg-[#F6F7FB] px-5 py-4 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-bold text-[#333333] tracking-[-0.2px]">
                {displayStoreName}
              </span>
              <div className="flex flex-col gap-[2px] mt-1">
                <span className="text-[14px] font-normal text-black/60 tracking-[-0.2px]">
                  총매출
                </span>
                <span className="text-[20px] font-semibold text-black/80 tracking-[-0.2px] leading-[32px]">
                  {totalSalesText}
                </span>
              </div>
            </div>
            {/* 우측 이미지 (image 3201) */}
            <div className="w-20 h-20 rounded-2xl bg-white/60 flex items-center justify-center">
              <div className="w-14 h-14 rounded-xl bg-[#E0ECFF]" />
            </div>
          </section>

          {/* 취소 내역 카드 */}
          <button
            type="button"
            className="w-full rounded-lg bg-[#F6F7FB] px-5 h-[50px] flex items-center justify-between"
          >
            <span className="text-[16px] font-normal text-[#333333] tracking-[-0.2px]">
              취소 내역
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[14px] text-[#999999]">
                {cancelCount}건
              </span>
              <Icon
                icon="solar:alt-arrow-left-linear"
                className="w-4 h-4 rotate-180 text-[#C5C5C5]"
              />
            </div>
          </button>

          {/* 상·하단 구분 라인 */}
          <div className="w-[390px] -mx-5 h-2 bg-[#F7F9FA]" />

          {/* 월 선택 영역 + 필터 */}
          <div className="flex items-center justify-between mt-2">
            {/* 왼쪽: 이전/다음 달 화살표 + 현재 월 */}
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => moveMonth(-1)}>
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="w-4 h-4 text-[#1E2124]"
                />
              </button>
              <span className="text-[20px] font-semibold text-[#1E2124] tracking-[-0.2px]">
                {year}년 {month}월
              </span>
              <button type="button" onClick={() => moveMonth(1)}>
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="w-4 h-4 rotate-180 text-[#E4E4E4]"
                />
              </button>
            </div>

            {/* 오른쪽: 필터 드롭다운 (현재는 전체만 표시, 추후 상태 필터 연동 가능) */}
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

          {/* 로딩 / 에러 / 리스트 */}
          {isLoading && (
            <div className="mt-6 text-center text-sm text-gray-500">
              매출 데이터를 불러오는 중입니다...
            </div>
          )}

          {errorMsg && !isLoading && (
            <div className="mt-6 text-center text-sm text-red-500">
              {errorMsg}
            </div>
          )}

          {!isLoading && !errorMsg && (
            <div className="mt-2">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  해당 기간의 매출 내역이 없습니다.
                </div>
              ) : (
                items.map((item) => {
                  const { dayLabel, fullLabel } = formatApprovedAt(
                    item.approvedAt
                  );

                  const isCanceled =
                    item.status === "CANCELED" ||
                    item.status === "FAILED" ||
                    item.status === "CANCEL_REQUESTED";

                  return (
                    <div
                      key={item.orderCode}
                      className="flex flex-col border-b border-[#F0F0F0] first:pt-4 last:border-b-0"
                    >
                      <div className="flex items-start justify-between py-5">
                        {/* 날짜 + 이름 + 시간 */}
                        <div className="flex items-start gap-3">
                          <span className="text-[16px] font-medium text-[#1E2124] leading-[26px] tracking-[-0.2px]">
                            {dayLabel}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[16px] text-[#1E2124] tracking-[-0.2px] leading-[26px]">
                              {item.customerName}
                            </span>
                            <span className="text-[14px] text-[#999999] tracking-[-0.2px] leading-[21px]">
                              {fullLabel}
                            </span>
                          </div>
                        </div>

                        {/* 금액/상태 */}
                        <div className="flex flex-col items-end">
                          <span
                            className={[
                              "text-[18px] font-semibold tracking-[-0.2px] leading-[29px]",
                              isCanceled
                                ? "text-[#999999] line-through"
                                : "text-[#4170FF]",
                            ].join(" ")}
                          >
                            {formatAmount(item.amount)}
                          </span>
                          {isCanceled && (
                            <span className="text-[14px] text-[#999999] tracking-[-0.2px] leading-[21px]">
                              {item.status === "FAILED" ? "실패" : "취소"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
