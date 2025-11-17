import React, { useEffect, useState } from "react";
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

/** 프론트에서 UI 확인용 더미 데이터 */
const MOCK_ITEMS: CancelPaymentItem[] = [
  {
    orderCode: "ORD-20251116-0001",
    paymentKey: "pay_mock_1",
    shopName: "제이헤어라이프스타",
    productName: "[본점] 신부님 헤어메이크업 (주중형)",
    status: "CANCEL_REQUESTED",
    cancelReason: "개인 사유로 일정 변경 요청",
    canceledAt: "2025-11-16T18:20:32.202Z",
  },
  {
    orderCode: "ORD-20251115-0002",
    paymentKey: "pay_mock_2",
    shopName: "제이헤어라이프스타",
    productName: "[본점] 신부님 헤어메이크업 (주말형)",
    status: "CANCELED",
    cancelReason: "고객 요청에 의해 취소 처리 완료",
    canceledAt: "2025-11-15T14:05:10.000Z",
  },
];

/** "1일 전" 형태로 변환하는 헬퍼 */
function formatElapsedLabel(iso: string): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return "-";

  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

/** 사장(OWNER) 마이페이지 */
export default function MobileView() {
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const [items, setItems] = useState<CancelPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 로그인 안 됐거나 OWNER가 아니면 안내
  if (!owner) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto flex h-[844px] w-[390px] flex-col bg-white">
          <div className="sticky top-0 z-20 border-b border-gray-200 bg-white">
            <MyPageHeader
              title="취소 내역"
              onBack={() => nav(-1)}
              showMenu={false}
            />
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pt-20 text-sm text-gray-500">
            사장님 정보가 없습니다. 다시 로그인해주세요.
          </div>
        </div>
      </div>
    );
  }

  /** 취소 요청 목록 조회 */
  useEffect(() => {
    const fetchCancelRequests = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const res = await api.get<CancelPaymentItem[]>(
          "/api/v1/payments/cancel-requests/me"
        );

        const data = Array.isArray(res.data) ? res.data : [];

        if (data.length > 0) {
          setItems(data);
        } else {
          console.warn(
            "[취소 내역] API 응답이 비어 있어 더미 데이터를 사용합니다."
          );
          setItems(MOCK_ITEMS);
        }
      } catch (error) {
        console.error("[취소 내역] API 호출 오류, 더미 데이터로 대체:", error);
        setErrorMsg("취소 내역을 불러오는 중 오류가 발생했습니다.");
        setItems(MOCK_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCancelRequests();
  }, []);

  /** 카드 클릭 → 취소 상세 페이지로 이동 (paymentKey 전달) */
  const handleCardClick = (item: CancelPaymentItem) => {
    if (item.status !== "CANCEL_REQUESTED") return; // 요청 상태일 때만 이동
    nav(
      `/my-page/owner/payments/cancel/detail?paymentKey=${encodeURIComponent(
        item.paymentKey
      )}`
    );
  };

  return (
    <div className="w-full bg-white">
      {/* 디바이스 프레임 390 x 844 */}
      <div className="relative mx-auto flex h-[844px] w-[390px] flex-col bg-white">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white">
          <MyPageHeader
            title="취소 내역"
            onBack={() => nav(-1)}
            showMenu={true}
          />
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-auto px-5 pt-15 pb-8">
          {/* 로딩 표시 */}
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
            <div className="mt-5 flex flex-col gap-4">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  취소 내역이 없습니다.
                </div>
              ) : (
                items.map((item) => {
                  const elapsedLabel = formatElapsedLabel(item.canceledAt);
                  const isUnread = item.status === "CANCEL_REQUESTED";

                  return (
                    <button
                      key={item.orderCode}
                      type="button"
                      onClick={() => handleCardClick(item)}
                      className={[
                        "relative w-full rounded-[12px] border border-[#F6F6F6] bg-white px-5 py-5 text-left",
                        isUnread ? "active:bg-gray-50" : "cursor-default",
                      ].join(" ")}
                    >
                      <div className="flex flex-row items-center gap-[18px]">
                        {/* 아이콘 */}
                        <div className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#F5F5F8]">
                          <Icon
                            icon="duo-icons:bell"
                            className="h-6 w-6 text-[#803BFF]"
                          />
                        </div>

                        {/* 텍스트 영역 */}
                        <div className="flex w-[248px] flex-col justify-between">
                          <span className="text-[14px] font-semibold leading-[21px] tracking-[-0.1px] text-black/80">
                            [{item.orderCode}]
                          </span>
                          <span className="mt-0.5 text-[14px] font-semibold leading-[21px] tracking-[-0.1px] text-black/80">
                            취소 승인이 요청되었어요.
                          </span>
                          <span className="mt-1 text-[12px] font-normal leading-[18px] tracking-[-0.1px] text-[#999999]">
                            {elapsedLabel}
                          </span>
                        </div>
                      </div>

                      {/* 읽지 않은 알림 빨간 점 */}
                      {isUnread && (
                        <span className="absolute right-[10px] top-[10px] h-2 w-2 rounded-full bg-[#F11F2F]" />
                      )}
                    </button>
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
