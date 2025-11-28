import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import type { OwnerData, UserData } from "../../../../../../store/userSlice";
import { useAppSelector } from "../../../../../../store/hooks";
import api from "../../../../../../lib/api/axios";
import MyPageHeader from "../../../../../../components/MyPageHeader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  paymentKey: string;
  customerName: string;
  amount: number;
  status: ApiPaymentStatus;
  approvedAt: string;
}

interface SettlementsResponse {
  summary: SettlementSummary;
  items: SettlementItem[];
}

type StatusFilter = "전체" | "결제완료" | "취소완료" | "취소요청";

function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

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

export default function MobileView() {
  const nav = useNavigate();

  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==== 상태 필터 관련 ====
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const storeName = owner?.bzName;
  const displayStoreName =
    storeName && storeName.trim() !== ""
      ? storeName
      : summary?.ownerName || "내 매장";

  const fetchSettlements = useCallback(async () => {
    // owner가 없으면 API 호출하지 않고 리스트 초기화만 수행
    if (!owner) {
      setSummary(null);
      setItems([]);
      return;
    }

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

      const rawItems = res.data.items || [];
      setItems(rawItems);
    } catch (error) {
      console.error(error);
      setErrorMsg("매출 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [year, month, owner]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // 필터 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!filterOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filterRef.current && !filterRef.current.contains(target)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  const moveMonth = (diff: number) => {
    const base = new Date(year, month - 1, 1);
    base.setMonth(base.getMonth() + diff);
    setYear(base.getFullYear());
    setMonth(base.getMonth() + 1);
  };

  const totalSalesText = formatAmount(summary?.totalSalesAmount);

  // ==== 필터 적용된 리스트 계산 ====
  const filteredItems = useMemo(() => {
    if (statusFilter === "전체") return items;

    return items.filter((item) => {
      if (statusFilter === "결제완료") return item.status === "DONE";
      if (statusFilter === "취소완료") return item.status === "CANCELED";
      if (statusFilter === "취소요청")
        return item.status === "CANCEL_REQUESTED";
      return true;
    });
  }, [items, statusFilter]);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <MyPageHeader
          title="매출 관리"
          onBack={() => nav(-1)}
          showMenu={false}
        />
      </div>

      {/* owner 유무에 따라 내용 분기 (훅은 위에서 이미 모두 호출됨) */}
      {!owner ? (
        <div className="flex-1 px-5 pt-20 flex items-center justify-center text-sm text-gray-500">
          사장님 정보가 없습니다. 다시 로그인해주세요.
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-5 pt-20 pb-8 space-y-4">
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

            <div className="w-20 h-20 rounded-2xl bg-white/60 flex items-center justify-center">
              <div className="w-14 h-14 rounded-xl bg-[#E0ECFF]" />
            </div>
          </section>

          {/* 상단 구분선: 고정폭 제거, 전체 너비로 */}
          <div className="-mx-5 h-2 bg-[#F7F9FA]" />

          <div className="flex items-center justify-between mt-2">
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

            {/* 상태 필터 드롭다운 */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen((p) => !p)}
                className="flex items-center gap-1 text-[14px] text-black tracking-[-0.2px]"
              >
                <span>{statusFilter}</span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="w-4 h-4 text-[#999999]"
                />
              </button>

              {filterOpen && (
                <div className="absolute right-0 mt-2 w-28 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30">
                  {(
                    [
                      "전체",
                      "결제완료",
                      "취소완료",
                      "취소요청",
                    ] as StatusFilter[]
                  ).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setStatusFilter(f);
                        setFilterOpen(false);
                      }}
                      className={[
                        "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
                        statusFilter === f
                          ? "bg-gray-100 font-semibold"
                          : "hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
              {filteredItems.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  해당 기간의 매출 내역이 없습니다.
                </div>
              ) : (
                filteredItems.map((item: SettlementItem) => {
                  const { dayLabel, fullLabel } = formatApprovedAt(
                    item.approvedAt
                  );

                  const isCanceled = item.status === "CANCELED";

                  // DONE, CANCELED, CANCEL_REQUESTED 모두 클릭 가능
                  const isClickable =
                    item.status === "DONE" ||
                    item.status === "CANCELED" ||
                    item.status === "CANCEL_REQUESTED";

                  const handleClick = () => {
                    if (item.status === "DONE") {
                      nav("/my-page/owner/payments/detail", {
                        state: { paymentKey: item.paymentKey },
                      });
                    } else if (item.status === "CANCELED") {
                      nav("/my-page/owner/cancels/detail/done", {
                        state: { paymentKey: item.paymentKey },
                      });
                    } else if (item.status === "CANCEL_REQUESTED") {
                      nav("/my-page/owner/cancels/detail/request", {
                        state: {
                          paymentKey: item.paymentKey,
                          paymentStatus: "CANCEL_REQUESTED" as const,
                          canApprove: false,
                        },
                      });
                    } else {
                      return;
                    }
                  };

                  return (
                    <div
                      key={item.orderCode}
                      onClick={isClickable ? handleClick : undefined}
                      className={[
                        "flex flex-col border-b border-[#F0F0F0] first:pt-4 last:border-b-0",
                        "py-5",
                        isClickable
                          ? "cursor-pointer active:bg-gray-50"
                          : "cursor-default",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between">
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
                              취소
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
      )}
    </div>
  );
}
