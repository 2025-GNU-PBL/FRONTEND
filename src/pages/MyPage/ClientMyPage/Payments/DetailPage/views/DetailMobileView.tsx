import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../../../lib/api/axios";

/** 결제 상세 DTO  */
interface PaymentDetailResponse {
  approvedAt: string; // "2025-11-22T19:13:00"
  cancelReason: string | null;
  canceledAt: string | null;
  customerEmail: string;
  customerName: string;
  customerPhoneNumber: string;
  discountAmount: number; // 쿠폰/할인 금액
  orderCode: string;
  originalPrice: number; // 원래 상품 금액
  paidAmount: number; // 실제 결제 금액
  paymentKey: string;
  paymentMethod: string; // "간편결제"
  pgProvider: string; // "tosspayments"
  productName: string; // "스튜디오 395"
  receiptUrl: string;
  rejectReason: string | null;
  rejectedAt: string | null;
  shopName: string; // "(주) 성우"
  status: "DONE" | "CANCELED" | "FAILED" | "CANCEL_REQUEST" | string;
  thumbnailUrl?: string; // "https://...jpg"
  totalPrice: number;
}

/** 화면 상태 라벨 */
type PaymentStatusLabel = "예약중" | "결제완료" | "취소요청" | "취소완료";

/** 백엔드 status → 라벨 */
function mapStatusToLabel(
  status: PaymentDetailResponse["status"]
): PaymentStatusLabel {
  switch (status) {
    case "DONE":
      return "결제완료";
    case "CANCEL_REQUEST":
      return "취소요청";
    case "CANCELED":
      return "취소완료";
    default:
      return "예약중";
  }
}

/** PG provider → 화면 표시용 라벨 */
function mapPgProvider(pg?: string): string {
  if (!pg) return "토스페이먼츠";
  const lower = pg.toLowerCase();
  if (lower === "tosspayments") return "토스페이먼츠";
  return pg;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function formatCurrency(value?: number): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value.toLocaleString()}원`;
}

/** 고객 마이페이지 결제 내역 상세 - 최종 디자인 이식 버전 */
export default function DetailMobileView() {
  const nav = useNavigate();
  const { paymentKey } = useParams<{ paymentKey: string }>();

  const [detail, setDetail] = React.useState<PaymentDetailResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!paymentKey) {
      setError("유효하지 않은 결제 정보입니다.");
      setDetail(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<PaymentDetailResponse>(
          `/api/v1/payments/${paymentKey}`
        );

        if (!data || !data.orderCode || !data.productName || !data.shopName) {
          // 최소 안전 기본값 제공 (디자인 변화 없음)
          setDetail({
            approvedAt: "",
            cancelReason: null,
            canceledAt: null,
            customerEmail: "",
            customerName: "",
            customerPhoneNumber: "",
            discountAmount: 0,
            orderCode: paymentKey,
            originalPrice: 0,
            paidAmount: 0,
            paymentKey,
            paymentMethod: "",
            pgProvider: "",
            productName: "",
            receiptUrl: "",
            rejectReason: null,
            rejectedAt: null,
            shopName: "",
            status: "DONE", // 기본값
            thumbnailUrl: "",
            totalPrice: 0,
          });
        } else {
          setDetail(data);
        }
      } catch {
        setError(
          "결제 내역 상세를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
        );
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [paymentKey]);

  const statusLabel = detail ? mapStatusToLabel(detail.status) : "예약중";
  const dateLabel = detail ? formatDate(detail.approvedAt) : "";

  // 금액 매핑 (디자인 그대로 사용)
  const productAmount = detail?.originalPrice ?? detail?.totalPrice ?? 0; // "상품 금액"
  const couponDiscount = detail?.discountAmount ?? 0; // "쿠폰 할인"
  const paymentAmount =
    detail?.paidAmount ?? productAmount - (couponDiscount ?? 0); // "총 결제 금액"
  const pgLabel = mapPgProvider(detail?.pgProvider);

  return (
    <div className="w-full min-h-screen bg-[#F5F6F8] flex justify-center">
      {/* 390px 고정 모바일 래퍼 */}
      <div className="w-[390px] min-h-screen bg-[#F5F6F8] flex flex-col">
        {/* 상단 헤더 */}
        <header className="h-[60px] bg-white flex items-center px-5 relative">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center"
            onClick={() => nav(-1)}
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="w-6 h-6 text-black"
            />
          </button>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] leading-[1.6] font-semibold tracking-[-0.2px] text-black">
            결제 내역 상세
          </h1>
        </header>

        {/* 콘텐츠 영역 */}
        <main className="flex-1 pb-[90px]">
          {/* 로딩 / 에러 / 빈 상태 처리 */}
          {loading && (
            <div className="mt-6 px-5 flex items-center justify-center text-[13px] text-[#777777]">
              상세 정보를 불러오는 중입니다...
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 px-5 flex items-center justify-center text-[13px] text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && !detail && (
            <div className="mt-6 px-5 flex flex-col items-center justify-center text-[13px] text-[#777777]">
              <Icon
                icon="mdi:file-document-outline"
                className="w-10 h-10 mb-2 text-[#D9D9D9]"
              />
              결제 내역 상세를 찾을 수 없습니다.
            </div>
          )}

          {/* 실제 상세 UI (디자인 이식) */}
          {!loading && !error && detail && (
            <>
              {/* 예약 상태 & 날짜 */}
              <section className="mt-5 px-5 flex items-center justify-between">
                <span className="text-[16px] leading-[1.6] font-semibold tracking-[-0.2px] text-[#1E2124]">
                  {statusLabel}
                </span>
                <span className="text-[14px] leading-[1.5] tracking-[-0.2px] text-black/40">
                  {dateLabel}
                </span>
              </section>

              {/* 상품 정보 카드 (타이틀 포함) */}
              <section className="mt-4 px-5">
                <div className="w-full bg-white border border-[#F3F4F5] rounded-[12px] px-4 py-4">
                  {/* 카드 안의 타이틀 */}
                  <p className="text-[16px] leading-[1.6] font-semibold tracking-[-0.2px] text-[#1E2124] mb-3">
                    상품정보
                  </p>

                  <div className="flex gap-4">
                    {/* 썸네일 이미지 */}
                    <div
                      className="w-20 h-20 rounded border border-[#F5F5F5] bg-gray-100 overflow-hidden flex-shrink-0 bg-cover bg-center"
                      style={
                        detail.thumbnailUrl
                          ? { backgroundImage: `url(${detail.thumbnailUrl})` }
                          : undefined
                      }
                    />

                    {/* 텍스트 영역 */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="text-[14px] leading-[1.5] tracking-[-0.2px] text-black/40">
                          {detail.shopName}
                        </p>
                        <p className="text-[14px] leading-[1.5] tracking-[-0.2px] text-[#1E2124] whitespace-pre-line">
                          {detail.productName}
                        </p>
                      </div>

                      <p className="text-[16px] leading-[1.6] font-semibold tracking-[-0.2px] text-[#1E2124] text-right">
                        {formatCurrency(productAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 결제내역 카드 */}
              <section className="mt-6 px-5">
                <div className="w-full bg-white border border-[#F3F4F5] rounded-[12px] p-4">
                  <div className="flex flex-col gap-4">
                    {/* 타이틀 */}
                    <p className="text-[16px] leading-[1.6] font-semibold tracking-[-0.2px] text-[#1E2124]">
                      결제내역
                    </p>

                    {/* 상품 금액 / 쿠폰 할인 */}
                    <div className="flex flex-col gap-3">
                      {/* 상품 금액 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[#1E2124]">
                          상품 금액
                        </span>
                        <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[#1E2124] text-right">
                          {formatCurrency(productAmount)}
                        </span>
                      </div>

                      {/* 쿠폰 할인 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[#1E2124]">
                          쿠폰 할인
                        </span>
                        <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[#1E2124] text-right">
                          {couponDiscount
                            ? `-${Math.abs(couponDiscount).toLocaleString()}원`
                            : "0원"}
                        </span>
                      </div>
                    </div>

                    {/* 구분선 */}
                    <div className="border-t border-[#EEEEEE]" />

                    {/* 결제 수단 & 총 결제 금액 */}
                    <div className="flex flex-col gap-2">
                      {/* 결제 수단 (PG) */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[#1E2124]">
                          {pgLabel}
                        </span>
                        <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[#1E2124] text-right">
                          {formatCurrency(paymentAmount)}
                        </span>
                      </div>

                      {/* 총 결제 금액 */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[14px] leading-[1.5] font-semibold tracking-[-0.2px] text-[#1E2124]">
                          총 결제 금액
                        </span>
                        <span className="text-[14px] leading-[1.5] font-semibold tracking-[-0.2px] text-[#1E2124]">
                          {formatCurrency(paymentAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        {/* 하단 GNB (Home Indicator 없음) */}
        <nav className="w-full max-w-[390px] h-[56px] border-t border-[#D9D9D9] bg-white px-[35px] flex items-center justify-between">
          {/* 홈 */}
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center"
          >
            <Icon
              icon="solar:home-2-linear"
              className="w-6 h-6 text-[#999999]"
            />
          </button>

          {/* 찜/하트 */}
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center"
          >
            <Icon
              icon="solar:heart-linear"
              className="w-6 h-6 text-[#999999]"
            />
          </button>

          {/* 검색 */}
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center"
          >
            <Icon
              icon="solar:magnifer-linear"
              className="w-6 h-6 text-[#999999]"
            />
          </button>

          {/* 채팅 */}
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center"
          >
            <Icon
              icon="solar:chat-round-line-outline"
              className="w-6 h-6 text-[#999999]"
            />
          </button>

          {/* 마이페이지 */}
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center"
          >
            <Icon
              icon="solar:user-rounded-linear"
              className="w-6 h-6 text-black"
            />
          </button>
        </nav>
      </div>
    </div>
  );
}
