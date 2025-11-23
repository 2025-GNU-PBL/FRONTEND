import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";

/** 서버 결제 상태 타입 */
type ApiPaymentStatus = "DONE" | "CANCELED" | "CANCEL_REQUESTED" | "FAILED";

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** API 응답 아이템 타입 — 취소 요청 목록에서 사용 */
interface CancelPaymentItem {
  orderCode: string;
  paymentKey: string;
  shopName: string;
  productName: string;
  status: ApiPaymentStatus;
  cancelReason: string;
  requestedAt: string; // 작성일
}

/** 작성일 포맷 */
function formatWrittenDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 배지 스타일 */
function getStatusBadge(status: ApiPaymentStatus) {
  if (status === "CANCEL_REQUESTED")
    return { label: "대기", className: "bg-[#FA9538] text-white" };
  if (status === "CANCELED")
    return { label: "취소", className: "bg-[#EB5147] text-white" };
  if (status === "FAILED")
    return { label: "실패", className: "bg-[#4B5563] text-white" };

  return { label: "완료", className: "bg-[#10B981] text-white" };
}

/** 정렬 타입 */
type SortOrder = "DESC" | "ASC";

/** 사장(OWNER) 취소 요청 내역 — 최신/오래된 순 필터 포함 */
export default function MobileView() {
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const [items, setItems] = useState<CancelPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**  정렬 순서 상태 */
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // 로그인 예외 처리
  if (!owner) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto flex h-[844px] w-[390px] flex-col bg-white">
          <div className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white">
            <MyPageHeader
              title="취소 요청 내역"
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

  /** 취소 요청 목록 불러오기 */
  useEffect(() => {
    const fetchCancelRequests = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const { data } = await api.get<CancelPaymentItem[]>(
          "/api/v1/payments/cancel-requests/me"
        );
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("[취소 요청 내역] fetch error:", error);
        setErrorMsg("취소 요청 내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCancelRequests();
  }, []);

  /**  최신/오래된순 정렬 */
  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const da = new Date(a.requestedAt).getTime();
        const db = new Date(b.requestedAt).getTime();
        return sortOrder === "DESC" ? db - da : da - db;
      }),
    [items, sortOrder]
  );

  const totalCount = sortedItems.length;

  /** 상세 페이지 이동 */
  const handleCardClick = (item: CancelPaymentItem) => {
    nav("/my-page/owner/cancels/detail/request", {
      state: {
        paymentKey: item.paymentKey,
        paymentStatus: "CANCEL_REQUESTED",
      },
    });
  };

  /** 정렬 라벨 */
  const sortOrderLabel = sortOrder === "DESC" ? "최신순" : "오래된 순";

  return (
    <div className="w-full bg-white">
      <div className="relative mx-auto flex h-[844px] w-[390px] flex-col bg-white">
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="취소 요청 내역"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mt-[90px] flex flex-col items-center gap-6">
            {/* 상단 라벨 */}
            <div className="flex h-[21px] w-[350px] flex-row items-center justify-between">
              <span className="text-[14px] text-[#000000]">
                취소 요청 내역 {totalCount}
              </span>

              {/* 정렬 드롭다운 버튼 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortMenuOpen((prev) => !prev)}
                  className="flex flex-row items-center gap-1 text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000]"
                >
                  <span>{sortOrderLabel}</span>
                  <Icon
                    icon="solar:alt-arrow-down-linear"
                    className="h-4 w-4 text-[#999999]"
                  />
                </button>

                {isSortMenuOpen && (
                  <div className="absolute right-0 top-[26px] z-10 w-[96px] rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_4px_8px_rgba(15,23,42,0.08)]">
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

            {/* 리스트 */}
            <div className="flex w-full flex-col">
              {isLoading && (
                <div className="py-10 text-center text-sm text-gray-500">
                  취소 요청 내역을 불러오는 중입니다...
                </div>
              )}

              {errorMsg && !isLoading && (
                <div className="pb-2 text-center text-xs text-red-500">
                  {errorMsg}
                </div>
              )}

              {!isLoading && sortedItems.length === 0 && !errorMsg && (
                <div className="py-10 text-center text-sm text-gray-400">
                  취소 요청 내역이 없습니다.
                </div>
              )}

              {!isLoading &&
                sortedItems.map((item, index) => {
                  const writtenDate = formatWrittenDate(item.requestedAt);
                  const badge = getStatusBadge(item.status);
                  const bgClass = index % 2 === 1 ? "bg-[#F6F7FB]" : "bg-white";

                  return (
                    <button
                      key={item.orderCode}
                      type="button"
                      onClick={() => handleCardClick(item)}
                      className={`w-full ${bgClass} px-5 border-b border-[#F3F4F5] cursor-pointer`}
                    >
                      <div className="mx-auto flex h-[101px] w-[350px] flex-row items-center justify-between">
                        <div className="flex h-[69px] w-[207px] flex-col justify-between gap-1 text-left">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-[#000000]">
                              {item.shopName}
                            </span>
                            <span className="mt-[2px] text-[16px] text-[#000000]">
                              {item.productName}
                            </span>
                          </div>

                          <span className="text-[12px] text-[#999999]">
                            작성일 {writtenDate}
                          </span>
                        </div>

                        <div
                          className={`flex h-[33px] min-w-[48px] items-center justify-center rounded-[20px] px-3 py-[6px] ${badge.className}`}
                        >
                          <span className="text-[14px] font-medium">
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
