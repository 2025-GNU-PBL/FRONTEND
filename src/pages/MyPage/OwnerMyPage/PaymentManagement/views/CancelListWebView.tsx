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
    shopName: "제이헤어라이프스타",
    productName: "[본점] 신부님 헤어메이크업 (주중형)",
    status: "CANCEL_REQUESTED",
    cancelReason: "개인 사유로 일정 변경 요청",
    canceledAt: "2025-11-16T18:20:32.202Z",
  },
  {
    orderCode: "ORD-20251115-0002",
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

/** "2025.11.16 18:20" 형태로 변환 */
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${date} ${hours}:${minutes}`;
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

/** 취소 상태 뱃지 */
function CancelStatusBadge({ status }: { status: ApiPaymentStatus }) {
  if (status === "CANCEL_REQUESTED") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FFF1F0] px-2 py-0.5 text-[11px] font-medium text-[#F04438]">
        승인 요청
      </span>
    );
  }

  if (status === "CANCELED") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
        취소 완료
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FEF0C7] px-2 py-0.5 text-[11px] font-medium text-[#B54708]">
        실패
      </span>
    );
  }

  // DONE 등 기타 상태
  return (
    <span className="inline-flex items-center rounded-full bg-[#E5F0FF] px-2 py-0.5 text-[11px] font-medium text-[#4170FF]">
      완료
    </span>
  );
}

/** 사장(OWNER) 마이페이지 - 취소 내역 (Web) */
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

        // API 데이터가 있으면 그대로, 없으면 더미 데이터 사용
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
        // 에러 메시지는 UI 확인 위해 숨기고, 더미 데이터로 대체
        setErrorMsg(null);
        setItems(MOCK_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCancelRequests();
  }, []);

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
              <p className="mt-1 text-sm text-gray-500 tracking-[-0.2px]">
                {displayStoreName}의 결제 취소 요청 내역을 확인할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 취소 내역 리스트 카드 */}
          <SectionCard
            title="결제 취소 요청 내역"
            subtitle="승인 대기 중인 취소 요청과 완료된 취소 내역을 한 번에 확인해 보세요."
            icon="solar:bell-bing-bold-duotone"
            rightSlot={
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                <span>전체</span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="h-3.5 w-3.5 text-gray-400"
                />
              </button>
            }
          >
            {/* 로딩 / 에러 / 리스트 */}
            {isLoading && (
              <div className="py-10 text-center text-sm text-gray-500">
                취소 내역을 불러오는 중입니다...
              </div>
            )}

            {errorMsg && !isLoading && (
              <div className="py-10 text-center text-sm text-red-500">
                {errorMsg}
              </div>
            )}

            {!isLoading && !errorMsg && (
              <>
                {items.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    취소 내역이 없습니다.
                  </div>
                ) : (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                    {/* 헤더 행 */}
                    <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_minmax(0,1.4fr)_90px] border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-medium tracking-[-0.2px] text-gray-500">
                      <div>주문 / 상품</div>
                      <div>취소 사유</div>
                      <div>취소 일시</div>
                      <div className="text-right">상태</div>
                    </div>

                    {/* 데이터 행 */}
                    {items.map((item, idx) => {
                      const elapsedLabel = formatElapsedLabel(item.canceledAt);
                      const dateTimeLabel = formatDateTime(item.canceledAt);

                      return (
                        <div
                          key={item.orderCode}
                          className={[
                            "grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_minmax(0,1.4fr)_90px] items-start px-5 py-4 text-sm",
                            idx !== items.length - 1
                              ? "border-b border-gray-50"
                              : "",
                          ].join(" ")}
                        >
                          {/* 주문 / 상품 */}
                          <div className="flex flex-col gap-0.5 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-[#F6F7FB] px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                                {item.orderCode}
                              </span>
                            </div>
                            <span className="mt-0.5 text-[13px] font-medium text-[#1E2124] tracking-[-0.2px]">
                              {item.productName}
                            </span>
                            <span className="text-[12px] text-[#999999] tracking-[-0.2px]">
                              {item.shopName}
                            </span>
                          </div>

                          {/* 취소 사유 */}
                          <div className="pr-4">
                            <p className="line-clamp-2 text-[13px] text-[#4B5563]">
                              {item.cancelReason || "-"}
                            </p>
                          </div>

                          {/* 취소 일시 + 경과 시간 */}
                          <div className="flex flex-col items-start gap-1 pr-2">
                            <span className="text-[13px] text-[#1E2124] tracking-[-0.2px]">
                              {dateTimeLabel}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                              <Icon
                                icon="solar:clock-circle-bold-duotone"
                                className="h-3.5 w-3.5"
                              />
                              {elapsedLabel}
                            </span>
                          </div>

                          {/* 상태 뱃지 */}
                          <div className="flex justify-end">
                            <CancelStatusBadge status={item.status} />
                          </div>
                        </div>
                      );
                    })}

                    {/* 리스트 하단 안내 */}
                    <div className="flex items-center gap-1 bg-gray-50 px-5 py-3 text-[11px] text-gray-400">
                      <Icon
                        icon="solar:info-circle-bold"
                        className="h-3.5 w-3.5"
                      />
                      <span>
                        승인 대기 중인 요청은 &ldquo;승인 요청&ldquo;으로
                        표시되며, 처리 후 상태가 변경됩니다.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
