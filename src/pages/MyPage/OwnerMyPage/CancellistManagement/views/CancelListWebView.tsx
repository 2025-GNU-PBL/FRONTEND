import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";

/** 서버 결제 상태 타입 */
type ApiPaymentStatus = "DONE" | "CANCELED" | "CANCEL_REQUESTED" | "FAILED";

/** 상세 화면에서 실제로 쓸 상태(둘만 구분하면 되니까) */
type DetailPaymentStatus = "CANCEL_REQUESTED" | "CANCELED";

/** 상태 필터 타입 */
type StatusFilter = "ALL" | "CANCEL_REQUESTED" | "CANCELED";

/** 정렬 순서 타입 */
type SortOrder = "DESC" | "ASC";

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** 결제 취소 요청 & 완료 리스트 API 응답 아이템 타입 */
interface CancelPaymentItem {
  orderCode: string;
  paymentKey: string; // 취소 상세 페이지로 넘길 paymentKey
  shopName: string;
  productName: string;
  status: ApiPaymentStatus;
  cancelReason: string;
  canceledAt: string; // ISO 문자열
}

/** 작성일 YYYY.MM.DD 포맷 */
function formatWrittenDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 상태별 배지 스타일 & 라벨 */
function getStatusBadge(status: ApiPaymentStatus) {
  if (status === "CANCEL_REQUESTED") {
    return {
      label: "대기",
      className: "bg-[#FA9538] text-white",
    };
  }
  if (status === "CANCELED") {
    return {
      label: "취소",
      className: "bg-[#EB5147] text-white",
    };
  }
  if (status === "FAILED") {
    return {
      label: "실패",
      className: "bg-[#4B5563] text-white",
    };
  }
  // DONE 등 나머지
  return {
    label: "완료",
    className: "bg-[#10B981] text-white",
  };
}

/** 상태 필터 라벨 */
function getStatusFilterLabel(filter: StatusFilter) {
  switch (filter) {
    case "ALL":
      return "상태별";
    case "CANCEL_REQUESTED":
      return "대기";
    case "CANCELED":
      return "취소완료";
    default:
      return "상태별";
  }
}

/** 정렬 순서 라벨 */
function getSortOrderLabel(order: SortOrder) {
  return order === "DESC" ? "최신순" : "오래된 순";
}

/** 웹용 섹션 카드 (심플 버전) */
function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-baseline justify-between px-6 pt-5 pb-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.3px] text-gray-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-[13px] text-gray-500 tracking-[-0.2px]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="h-px w-full bg-gray-100" />
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

/** 사장(OWNER) 마이페이지 - 취소 내역 (Web, 깔끔한 리스트 버전) */
export default function WebView() {
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const [items, setItems] = useState<CancelPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /** 상태 필터(전체 / 대기 / 취소 완료) */
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  /** 정렬 순서(최신순 / 오래된 순) */
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  /** 취소 요청 + 취소 완료 목록 조회 (모바일과 동일하게 2개 엔드포인트 합치기) */
  useEffect(() => {
    const fetchAllCancels = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const [reqRes, doneRes] = await Promise.all([
          api.get<CancelPaymentItem[]>("/api/v1/payments/cancel-requests/me"),
          api.get<CancelPaymentItem[]>("/api/v1/payments/cancels/me"),
        ]);

        const reqData = Array.isArray(reqRes.data) ? reqRes.data : [];
        const doneData = Array.isArray(doneRes.data) ? doneRes.data : [];

        setItems([...reqData, ...doneData]);
      } catch (error) {
        console.error("[취소 내역 웹] fetchAllCancels error:", error);
        setErrorMsg("취소 내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllCancels();
  }, []);

  /** 최신/오래된 순 정렬된 전체 리스트 */
  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const da = new Date(a.canceledAt).getTime();
        const db = new Date(b.canceledAt).getTime();
        // DESC: 최신순, ASC: 오래된 순
        return sortOrder === "DESC" ? db - da : da - db;
      }),
    [items, sortOrder]
  );

  /** 상태 필터 적용된 리스트 */
  const filteredItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        if (statusFilter === "ALL") return true;
        return item.status === statusFilter;
      }),
    [sortedItems, statusFilter]
  );

  /** 상단에 보여줄 개수 */
  const filteredCount = filteredItems.length;

  /** 카드 클릭 → 취소 상세 페이지로 이동
   *  - 모바일 뷰와 동일하게 paymentKey + paymentStatus를 state로 전달
   */
  const handleCardClick = (item: CancelPaymentItem) => {
    const detailStatus: DetailPaymentStatus =
      item.status === "CANCELED" ? "CANCELED" : "CANCEL_REQUESTED";

    nav("/my-page/owner/cancels/detail", {
      state: {
        paymentKey: item.paymentKey,
        paymentStatus: detailStatus,
        // 필요하면 product / customer / cancelReason 도 같이 넘길 수 있음
      },
    });
  };

  // 비로그인 / OWNER 아님
  if (!owner) {
    return (
      <main className="flex min-h-screen w-full flex-col bg-[#F6F7FB] text-gray-900">
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />
        <div className="pt-16 pb-16">
          <div className="mx-auto max-w-[960px] px-6">
            <SectionCard
              title="접근 불가"
              subtitle="사장님 계정으로 로그인 후 이용해 주세요."
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

  const statusFilterLabel = getStatusFilterLabel(statusFilter);
  const sortOrderLabel = getSortOrderLabel(sortOrder);

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#F6F7FB] text-gray-900">
      {/* 상단 얇은 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="mx-auto max-w-[960px] px-6 space-y-8">
          {/* 상단 타이틀 영역 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-gray-900">
                취소 내역
              </h1>
              <p className="mt-1 text-sm tracking-[-0.2px] text-gray-500">
                {displayStoreName}의 결제 취소 요청 내역을 확인할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 리스트 섹션 */}
          <SectionCard
            title="결제 취소 요청 내역"
            subtitle={`총 ${filteredCount}건의 취소 요청을 확인할 수 있습니다.`}
          >
            {/* 필터 라인 - 모바일 상단 라인과 비슷한 구조 */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[14px] text-gray-700">
                취소 내역 {filteredCount}
              </span>

              <div className="flex items-center gap-3 text-[13px] text-gray-800">
                {/* 상태별 드롭다운 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStatusMenuOpen((prev) => !prev);
                      setIsSortMenuOpen(false);
                    }}
                    className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                  >
                    <span>{statusFilterLabel}</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className="h-4 w-4 text-[#999999]"
                    />
                  </button>

                  {isStatusMenuOpen && (
                    <div className="absolute right-0 z-10 mt-1 w-[110px] rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("ALL");
                          setIsStatusMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#111827] hover:bg-[#F3F4F6]"
                      >
                        전체
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("CANCEL_REQUESTED");
                          setIsStatusMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#111827] hover:bg-[#F3F4F6]"
                      >
                        대기
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("CANCELED");
                          setIsStatusMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#111827] hover:bg-[#F3F4F6]"
                      >
                        취소 완료
                      </button>
                    </div>
                  )}
                </div>

                {/* 정렬 순서 드롭다운 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSortMenuOpen((prev) => !prev);
                      setIsStatusMenuOpen(false);
                    }}
                    className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                  >
                    <span>{sortOrderLabel}</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className="h-4 w-4 text-[#999999]"
                    />
                  </button>

                  {isSortMenuOpen && (
                    <div className="absolute right-0 z-10 mt-1 w-[110px] rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder("DESC");
                          setIsSortMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#111827] hover:bg-[#F3F4F6]"
                      >
                        최신순
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder("ASC");
                          setIsSortMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#111827] hover:bg-[#F3F4F6]"
                      >
                        오래된 순
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 로딩 / 에러 / 리스트 */}
            {isLoading && (
              <div className="py-10 text-center text-sm text-gray-500">
                취소 내역을 불러오는 중입니다...
              </div>
            )}

            {errorMsg && !isLoading && (
              <div className="py-2 text-center text-xs text-red-500">
                {errorMsg}
              </div>
            )}

            {!isLoading && (
              <div className="mt-2 flex flex-col">
                {filteredItems.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    취소 내역이 없습니다.
                  </div>
                ) : (
                  filteredItems.map((item, index) => {
                    const writtenDate = formatWrittenDate(item.canceledAt);
                    const badge = getStatusBadge(item.status);
                    const rowBg = index % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]";

                    return (
                      <button
                        key={item.orderCode}
                        type="button"
                        onClick={() => handleCardClick(item)}
                        className={[
                          "w-full border-b border-[#F3F4F5] px-1 py-2 text-left",
                          rowBg,
                          "hover:bg-[#F3F4FF]",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-6 px-1 py-1">
                          {/* 왼쪽 텍스트 영역 (매장 / 상품 / 사유 / 작성일) */}
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="text-[13px] text-gray-500">
                              {item.shopName}
                            </div>
                            <div className="truncate text-[15px] font-semibold text-gray-900">
                              {item.productName}
                            </div>
                            <div className="line-clamp-1 text-[13px] text-gray-600">
                              {item.cancelReason}
                            </div>
                            <div className="text-[12px] text-gray-400">
                              작성일 {writtenDate}
                            </div>
                          </div>

                          {/* 오른쪽 상태 배지 */}
                          <div className="flex flex-shrink-0 items-center">
                            <span
                              className={[
                                "inline-flex min-w-[64px] justify-center rounded-full px-3 py-1 text-[13px] font-medium",
                                badge.className,
                              ].join(" ")}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
