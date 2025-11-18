import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";

/** 서버 결제 상태 타입 (필요 시 확장 가능) */
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

/** 웹용 공용 섹션 카드 */
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
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/5">
              <Icon icon={icon} className="h-5 w-5 text-[#1E2124]" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate text-[18px] font-semibold tracking-[-0.3px] text-gray-900">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
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

/** 사장(OWNER) 마이페이지 - 취소 내역 (Web, 모바일 뷰와 동작/구조 맞춤) */
export default function WebView() {
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const [items, setItems] = useState<CancelPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
            "[취소 내역 웹] API 응답이 비어 있어 더미 데이터를 사용합니다."
          );
          setItems(MOCK_ITEMS);
        }
      } catch (error) {
        console.error(
          "[취소 내역 웹] API 호출 오류, 더미 데이터로 대체:",
          error
        );
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
    if (item.status !== "CANCEL_REQUESTED") return; // 요청 상태일 때만 이동 (모바일과 동일)
    nav(
      `/my-page/owner/payments/cancel/detail?paymentKey=${encodeURIComponent(
        item.paymentKey
      )}`
    );
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
    <main className="flex min-h-screen w-full flex-col bg-[#F6F7FB] text-gray-900">
      {/* 상단 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="mx-auto max-w-[960px] px-6 space-y-8">
          {/* 상단 타이틀 영역 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-gray-900">
                취소 내역
              </h1>
              <p className="mt-1 text-sm tracking-[-0.2px] text-gray-500">
                {displayStoreName}의 결제 취소 요청 내역을 확인할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 취소 내역 리스트 카드 */}
          <SectionCard
            title="결제 취소 요청 내역"
            subtitle="승인 대기 중인 취소 요청과 완료된 취소 내역을 한 번에 확인해 보세요."
            icon="solar:bell-bing-bold-duotone"
          >
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
              <div className="mt-4 flex flex-col gap-3">
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
                          "relative flex w-full items-center gap-4 rounded-2xl border border-[#F3F4F5] bg-white px-5 py-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,23,42,0.09)]",
                          isUnread ? "cursor-pointer" : "cursor-default",
                        ].join(" ")}
                      >
                        {/* 아이콘 영역 */}
                        <div className="relative flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-full bg-[#F5F5F8]">
                          <Icon
                            icon="duo-icons:bell"
                            className="h-6 w-6 text-[#803BFF]"
                          />
                        </div>

                        {/* 텍스트 영역 */}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-[#F6F7FB] px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                              {item.orderCode}
                            </span>
                            <span className="text-[12px] text-[#999999]">
                              {item.shopName}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-[14px] font-semibold leading-[21px] tracking-[-0.1px] text-black/80">
                            {item.productName}
                          </p>
                          <p className="mt-0.5 text-[13px] text-[#4B5563] line-clamp-1">
                            {item.cancelReason}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[12px] text-[#999999]">
                            <Icon
                              icon="solar:clock-circle-bold-duotone"
                              className="h-3.5 w-3.5"
                            />
                            <span>{elapsedLabel}</span>
                            {isUnread && (
                              <span className="rounded-full bg-[#FFF1F0] px-2 py-0.5 text-[11px] font-medium text-[#F04438]">
                                승인 요청
                              </span>
                            )}
                            {item.status === "CANCELED" && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                취소 완료
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 읽지 않은 알림 빨간 점 */}
                        {isUnread && (
                          <span className="absolute right-[14px] top-[12px] h-2 w-2 rounded-full bg-[#F11F2F]" />
                        )}
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
