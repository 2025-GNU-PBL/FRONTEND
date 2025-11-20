import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";

/** 서버 결제 상태 타입 */
type ApiPaymentStatus = "DONE" | "CANCELED" | "CANCEL_REQUESTED" | "FAILED";

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

/** 결제 취소 요청 리스트 API 응답 아이템 타입 */
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

/** 사장(OWNER) 마이페이지 - 취소 내역 모바일 뷰 */
export default function MobileView() {
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const [items, setItems] = useState<CancelPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /** 상태 필터(전체 / 대기만 / 취소만) */
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  /** 정렬 순서(최신순 / 오래된 순) */
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // 로그인 안 됐거나 OWNER가 아니면 안내
  if (!owner) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto flex h-[844px] w-[390px] flex-col bg-white">
          <div className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white">
            <MyPageHeader
              title="취소 내역"
              onBack={() => nav(-1)}
              showMenu={false}
            />
          </div>

          <div className="flex flex-1 items-center justify-center px-5 text-sm text-gray-500">
            사장님 정보가 없습니다. 다시 로그인해주세요.
          </div>
        </div>
      </div>
    );
  }

  /** 취소 내역(대기 + 취소 완료 등) 목록 조회 */
  useEffect(() => {
    const fetchCancelRequests = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const res = await api.get<CancelPaymentItem[]>(
          "/api/v1/payments/cancel-requests/me"
        );

        const data = Array.isArray(res.data) ? res.data : [];
        setItems(data);
      } catch (error) {
        setErrorMsg("취소 내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCancelRequests();
  }, []);

  /** 카드 클릭 → 대기 상태만 상세로 이동 */
  const handleCardClick = (item: CancelPaymentItem) => {
    if (item.status !== "CANCEL_REQUESTED") return;
    nav(
      `/my-page/owner/cancels/detail?paymentKey=${encodeURIComponent(
        item.paymentKey
      )}`
    );
  };

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

  /** 상단에 보여줄 개수(필터 적용 후) */
  const filteredCount = filteredItems.length;

  const statusFilterLabel = getStatusFilterLabel(statusFilter);
  const sortOrderLabel = getSortOrderLabel(sortOrder);

  return (
    <div className="w-full bg-white">
      {/* 디바이스 프레임 390 x 844 */}
      <div className="relative mx-auto flex h-[844px] w-[390px] flex-col bg-white">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="취소 내역"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-y-auto">
          {/* 상단 요약 + 필터 라인 */}
          <div className="mt-[90px] flex flex-col items-center gap-6">
            <div className="flex h-[21px] w-[350px] flex-row items-center justify-between">
              <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000]">
                취소 내역 {filteredCount}
              </span>

              <div className="flex flex-row items-center gap-3 text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000]">
                {/* 상태별 드롭다운 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStatusMenuOpen((prev) => !prev)}
                    className="flex flex-row items-center gap-1"
                  >
                    <span>{statusFilterLabel}</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className="h-4 w-4 text-[#999999]"
                    />
                  </button>

                  {isStatusMenuOpen && (
                    <div className="absolute right-0 top-[26px] z-10 w-[96px] rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_4px_8px_rgba(15,23,42,0.08)]">
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

                {/* 정렬 순서 드롭다운 (최신순 / 오래된 순) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortMenuOpen((prev) => !prev)}
                    className="flex flex-row items-center gap-1"
                  >
                    <span>{sortOrderLabel}</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className="h-4 w-4 text-[#999999]"
                    />
                  </button>

                  {isSortMenuOpen && (
                    <div className="absolute right-0 top-[26px] z-10 w-[110px] rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_4px_8px_rgba(15,23,42,0.08)]">
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder("DESC"); // 최신순
                          setIsSortMenuOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#111827] hover:bg-[#F3F4F6]"
                      >
                        최신순
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder("ASC"); // 오래된 순
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

            {/* 리스트 영역 */}
            <div className="flex w-full flex-col">
              {isLoading && (
                <div className="py-10 text-center text-sm text-gray-500">
                  취소 내역을 불러오는 중입니다...
                </div>
              )}

              {errorMsg && !isLoading && (
                <div className="pb-2 text-center text-xs text-red-500">
                  {errorMsg}
                </div>
              )}

              {!isLoading && filteredItems.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-400">
                  취소 내역이 없습니다.
                </div>
              )}

              {!isLoading &&
                filteredItems.map((item, index) => {
                  const bgClass = index % 2 === 1 ? "bg-[#F6F7FB]" : "bg-white";
                  const writtenDate = formatWrittenDate(item.canceledAt);
                  const badge = getStatusBadge(item.status);

                  const isClickable = item.status === "CANCEL_REQUESTED";

                  return (
                    <button
                      key={item.orderCode}
                      type="button"
                      onClick={() => handleCardClick(item)}
                      disabled={!isClickable}
                      className={[
                        "w-full",
                        bgClass,
                        "px-5",
                        "border-b border-[#F3F4F5]",
                        "disabled:cursor-default",
                      ].join(" ")}
                    >
                      <div className="mx-auto flex h-[101px] w-[350px] flex-row items-center justify-between">
                        {/* 좌측 텍스트 영역 */}
                        <div className="flex h-[69px] w-[207px] flex-col justify-between gap-1 text-left">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold leading-[21px] tracking-[-0.2px] text-[#000000]">
                              {item.shopName}
                            </span>
                            <span className="mt-[2px] text-[16px] font-normal leading-[26px] tracking-[-0.2px] text-[#000000]">
                              {item.productName}
                            </span>
                          </div>
                          <span className="text-[12px] font-normal leading-[18px] tracking-[-0.1px] text-[#999999]">
                            작성일 {writtenDate}
                          </span>
                        </div>

                        {/* 우측 상태 배지 */}
                        <div
                          className={[
                            "flex h-[33px] w-[48px] items-center justify-center rounded-[20px] px-3 py-[6px]",
                            badge.className,
                          ].join(" ")}
                        >
                          <span className="text-[14px] font-medium leading-[21px] tracking-[-0.2px]">
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
