import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../../lib/api/axios";

type ApiPaymentStatus = "DONE" | "CANCELED" | "CANCEL_REQUESTED" | "FAILED";

interface PaymentDetailResponse {
  orderCode: string;
  shopName: string;
  productName: string;
  thumbnailUrl: string | null;
  originalPrice: number;
  discountAmount: number;
  totalPrice: number;
  paidAmount: number;
  status: ApiPaymentStatus;
  approvedAt: string; // ISO
  canceledAt: string | null;
  cancelReason: string | null;
  receiptUrl: string | null;
  paymentMethod: string;
  pgProvider: string;
}

/** 금액 포맷터: 123456 -> "123,456원" */
function formatAmount(amount?: number): string {
  if (amount == null) return "0원";
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 날짜 포맷터: ISO -> "2025.10.14" */
function formatDateLabel(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${date}`;
}

/** 상태 한글 라벨 */
function getStatusLabel(status?: ApiPaymentStatus): string {
  if (!status) return "예약중";
  switch (status) {
    case "DONE":
      return "예약완료";
    case "CANCELED":
      return "예약취소";
    case "CANCEL_REQUESTED":
      return "취소요청";
    case "FAILED":
      return "결제실패";
    default:
      return "예약중";
  }
}

/** 상태 뱃지 컬러 */
function getStatusBadgeClass(status?: ApiPaymentStatus): string {
  if (!status) {
    return "bg-gray-100 text-gray-600";
  }
  switch (status) {
    case "DONE":
      return "bg-[#E5F0FF] text-[#4170FF]";
    case "CANCELED":
    case "CANCEL_REQUESTED":
    case "FAILED":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

/* 공용 섹션 카드 (웹뷰 디자인 참고) */
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
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {subtitle}
              </p>
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

/* 결제 내역 상세 - WebView */
export default function WebView() {
  const nav = useNavigate();
  const { paymentKey: paymentKeyFromParams } = useParams<{
    paymentKey: string;
  }>();
  const location = useLocation();

  const paymentKeyFromQuery = new URLSearchParams(location.search).get(
    "paymentKey"
  );
  const paymentKey = paymentKeyFromParams || paymentKeyFromQuery || "";

  const [payment, setPayment] = useState<PaymentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentKey) {
      setErrorMsg("결제 키가 없습니다.");
      return;
    }

    const fetchPaymentDetail = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        // GET /api/v1/payments/{paymentKey}
        const res = await api.get<PaymentDetailResponse>(
          `/api/v1/payments/${paymentKey}`
        );
        setPayment(res.data);
      } catch (err) {
        console.error(err);
        setErrorMsg("결제 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetail();
  }, [paymentKey]);

  const dateLabel = formatDateLabel(payment?.approvedAt);
  const statusLabel = getStatusLabel(payment?.status);
  const statusBadgeClass = getStatusBadgeClass(payment?.status);

  const productPrice = formatAmount(payment?.originalPrice);
  const discountAmount = payment?.discountAmount ?? 0;
  const discountText =
    discountAmount > 0
      ? `-${discountAmount.toLocaleString("ko-KR")}원`
      : `${discountAmount.toLocaleString("ko-KR")}원`;
  const paidAmount = formatAmount(payment?.paidAmount);

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
      {/* 상단 얇은 그라데이션 바 (웹뷰 공통 스타일) */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 페이지 타이틀 */}
          <header className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-gray-900">
                결제 내역 상세
              </h1>
              <p className="mt-1 text-sm text-gray-500 truncate">
                주문번호 {payment?.orderCode ?? "-"}
              </p>
            </div>
          </header>

          {/* 로딩 / 에러 */}
          {isLoading && (
            <SectionCard
              title="결제 정보 로딩 중"
              subtitle="잠시만 기다려 주세요."
              icon="solar:card-recive-bold-duotone"
            >
              <div className="py-6 text-center text-sm text-gray-500">
                결제 정보를 불러오는 중입니다...
              </div>
            </SectionCard>
          )}

          {errorMsg && !isLoading && (
            <SectionCard
              title="결제 정보를 불러오지 못했습니다"
              subtitle="잠시 후 다시 시도해 주세요."
              icon="solar:shield-warning-bold-duotone"
            >
              <div className="py-6 text-center text-sm text-red-500">
                {errorMsg}
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => nav(-1)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
                >
                  <Icon
                    icon="solar:arrow-left-linear"
                    className="w-4 h-4 text-gray-500"
                  />
                  목록으로 돌아가기
                </button>
              </div>
            </SectionCard>
          )}

          {!isLoading && !errorMsg && payment && (
            <>
              {/* 상품 정보 섹션 */}
              <SectionCard
                title="상품정보"
                subtitle="결제하신 상품 정보를 확인해보세요."
                icon="solar:bag-3-bold-duotone"
              >
                <div className="flex flex-wrap items-center gap-5">
                  {/* 썸네일 */}
                  <div className="w-[96px] h-[96px] rounded-[8px] border border-[#F3F4F5] overflow-hidden bg-[#F9F9F9] flex-shrink-0">
                    {payment.thumbnailUrl ? (
                      <img
                        src={payment.thumbnailUrl}
                        alt={payment.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">
                        이미지 없음
                      </div>
                    )}
                  </div>

                  {/* 텍스트 정보 */}
                  <div className="flex-1 min-w-[220px] flex flex-col gap-1">
                    <p className="text-[13px] text-black/40">
                      {payment.shopName}
                    </p>
                    <p className="text-[15px] font-medium text-[#1E2124] leading-[1.5]">
                      {payment.productName}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      주문번호 {payment.orderCode}
                    </p>
                  </div>

                  {/* 상품 금액 */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-500">상품 금액</span>
                    <span className="text-[18px] font-semibold text-[#1E2124]">
                      {productPrice}
                    </span>
                  </div>
                </div>
              </SectionCard>

              {/* 결제 내역 섹션 */}
              <SectionCard
                title="결제내역"
                subtitle="할인 내역과 최종 결제 금액을 확인할 수 있습니다."
                icon="solar:bill-list-bold-duotone"
              >
                <div className="flex flex-col gap-4">
                  {/* 상단: 상품 금액 / 쿠폰 할인 */}
                  <div className="flex flex-col gap-3 border-b border-[#EEEEEE] pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        상품 금액
                      </span>
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        {productPrice}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        쿠폰 할인
                      </span>
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        {discountText}
                      </span>
                    </div>
                  </div>

                  {/* 하단: 결제 수단 / 총 결제 금액 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        {payment.pgProvider ||
                          payment.paymentMethod ||
                          "결제 수단"}
                      </span>
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        {paidAmount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[14px] font-semibold leading-[21px] tracking-[-0.2px] text-[#1E2124]">
                        총 결제 금액
                      </span>
                      <span className="text-[18px] font-semibold leading-[24px] tracking-[-0.2px] text-[#1E2124]">
                        {paidAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* 하단 안내 + 뒤로가기 버튼 (모바일에서도 보이도록) */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Icon
                    icon="solar:info-circle-bold"
                    className="w-3.5 h-3.5 flex-shrink-0"
                  />
                  <span>
                    결제/취소 처리 상태는 PG사(결제 대행사)의 사정에 따라 일부
                    지연될 수 있습니다.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => nav(-1)}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
                  뒤로가기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
