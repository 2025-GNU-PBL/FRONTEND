import React from "react";
import { useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import type { UserRole } from "../../../../../../store/thunkFunctions";
import api from "../../../../../../lib/api/axios";
import { useAppSelector } from "../../../../../../store/hooks";
import type { UserData } from "../../../../../../store/userSlice";

/** 결제 상세 DTO (백엔드 응답 스펙) */
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
type PaymentStatusLabel = "실패" | "결제완료" | "취소요청됨" | "취소완료";

/** 백엔드 status → 라벨 */
function mapStatusToLabel(
  status?: PaymentDetailResponse["status"]
): PaymentStatusLabel {
  switch (status) {
    case "DONE":
      return "결제완료";
    case "CANCEL_REQUESTED":
      return "취소요청됨";
    case "CANCELED":
      return "취소완료";
    default:
      return "실패"; // fallback
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

/** 고객 마이페이지 결제 내역 상세 */
export default function DetailWebView() {
  const { paymentKey } = useParams<{ paymentKey: string }>();

  const { role } = useAppSelector((state) => state.user) as {
    userData: UserData;
    role: UserRole | null;
  };

  const [detail, setDetail] = React.useState<PaymentDetailResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isNotCustomer = role && role !== "CUSTOMER";

  React.useEffect(() => {
    if (isNotCustomer) {
      setDetail(null);
      return;
    }

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
          // 모바일과 동일하게 최소 안전 기본값 제공
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
            status: "FAILED",
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
  }, [paymentKey, isNotCustomer]);

  const statusLabel = mapStatusToLabel(detail?.status);
  const dateLabel = detail ? formatDate(detail.approvedAt) : "";

  // 금액 매핑
  const productAmount = detail?.originalPrice ?? detail?.totalPrice ?? 0; // "상품 금액"
  const couponDiscount = detail?.discountAmount ?? 0; // "쿠폰 할인"
  const paymentAmount =
    detail?.paidAmount ?? productAmount - (couponDiscount ?? 0); // "총 결제 금액"
  const pgLabel = mapPgProvider(detail?.pgProvider);

  return (
    <div className="w-full min-h-screen bg-[#F8F8F8] mt-15 -mb-15">
      <div className="max-w-[1024px] mx-auto px-8 py-10">
        {/* 상태 / 로딩 / 에러 */}
        {isNotCustomer && (
          <div className="mt-6 flex items-center justify-center text-[15px] text-[#777777]">
            고객 전용 페이지입니다.
          </div>
        )}

        {!isNotCustomer && loading && (
          <div className="mt-10 flex items-center justify-center text-[15px] text-[#777777]">
            상세 정보를 불러오는 중입니다...
          </div>
        )}

        {!isNotCustomer && !loading && error && (
          <div className="mt-10 flex items-center justify-center text-[15px] text-red-500">
            {error}
          </div>
        )}

        {!isNotCustomer && !loading && !error && !detail && (
          <div className="mt-10 flex flex-col items-center justify-center text-[15px] text-[#777777]">
            <Icon
              icon="mdi:file-document-outline"
              className="w-10 h-10 mb-2 text-[#D9D9D9]"
            />
            결제 내역 상세를 찾을 수 없습니다.
          </div>
        )}

        {/* 상세 본문 */}
        {!isNotCustomer && !loading && !error && detail && (
          <div className="bg-white border border-[#E5E5E5] rounded-[16px] shadow-sm p-8">
            {/* 상단 상태 */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[18px] font-semibold text-[#1E2124]">
                {statusLabel}
              </span>
              {dateLabel && (
                <span className="text-[15px] text-[rgba(0,0,0,0.4)]">
                  {dateLabel}
                </span>
              )}
            </div>

            {/* 상품 정보 */}
            <section className="mb-10">
              <h2 className="mb-4 text-[18px] font-semibold text-[#1E2124]">
                상품정보
              </h2>
              <div className="flex items-center gap-6 border border-[#F3F4F5] rounded-[12px] p-6 bg-[#FFFFFF]">
                <div
                  className="w-28 h-28 rounded-[6px] border border-[#F5F5F5] bg-[#F5F5F5] bg-cover bg-center flex-shrink-0"
                  style={
                    detail.thumbnailUrl
                      ? { backgroundImage: `url(${detail.thumbnailUrl})` }
                      : undefined
                  }
                />
                <div className="flex-1">
                  <p className="text-[15px] text-[rgba(0,0,0,0.4)] mb-1">
                    {detail.shopName}
                  </p>
                  <p className="text-[16px] font-medium text-[#1E2124]">
                    {detail.productName}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[18px] font-semibold text-[#1E2124]">
                    {formatCurrency(productAmount)}
                  </p>
                </div>
              </div>
            </section>

            {/* 결제 내역 */}
            <section>
              <h3 className="mb-4 text-[18px] font-semibold text-[#1E2124]">
                결제내역
              </h3>
              <div className="border border-[#F3F4F5] rounded-[12px] bg-[#FFFFFF] p-6">
                {/* 상품 금액 */}
                <div className="flex justify-between text-[14px] mb-3">
                  <span>상품 금액</span>
                  <span>{formatCurrency(productAmount)}</span>
                </div>

                {/* 쿠폰 할인 */}
                <div className="flex justify-between text-[14px] mb-3">
                  <span>쿠폰 할인</span>
                  <span>
                    {couponDiscount
                      ? `-${Math.abs(couponDiscount).toLocaleString()}원`
                      : "0원"}
                  </span>
                </div>

                {/* 구분선 */}
                <div className="w-full h-px bg-[#EEEEEE] my-4" />

                {/* 결제 수단 (PG) */}
                <div className="flex justify-between text-[14px] mb-3">
                  <span>{pgLabel}</span>
                  <span>{formatCurrency(paymentAmount)}</span>
                </div>

                {/* 총 결제 금액 */}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[16px] font-semibold text-[#1E2124]">
                    총 결제 금액
                  </span>
                  <span className="text-[16px] font-semibold text-[#1E2124]">
                    {formatCurrency(paymentAmount)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
