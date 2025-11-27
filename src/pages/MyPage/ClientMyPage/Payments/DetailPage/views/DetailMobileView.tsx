import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../../../lib/api/axios";

/** 결제 상세 DTO  */
interface PaymentDetailResponse {
  approvedAt: string;
  cancelReason: string | null;
  canceledAt: string | null;
  customerEmail: string;
  customerName: string;
  customerPhoneNumber: string;
  discountAmount: number;
  orderCode: string;
  originalPrice: number;
  paidAmount: number;
  paymentKey: string;
  paymentMethod: string;
  pgProvider: string;
  productName: string;
  receiptUrl: string;
  rejectReason: string | null;
  rejectedAt: string | null;
  shopName: string;
  status: "DONE" | "CANCELED" | "FAILED" | "CANCEL_REQUEST" | string;
  thumbnailUrl?: string;
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
  }, [paymentKey]);

  const statusLabel = mapStatusToLabel(detail?.status);
  const dateLabel = detail ? formatDate(detail.approvedAt) : "";

  const productAmount = detail?.originalPrice ?? detail?.totalPrice ?? 0;
  const couponDiscount = detail?.discountAmount ?? 0;
  const paymentAmount =
    detail?.paidAmount ?? productAmount - (couponDiscount ?? 0);
  const pgLabel = mapPgProvider(detail?.pgProvider);

  return (
    <div className="w-full min-h-screen bg-[#F5F6F8] flex flex-col">
      {/* 헤더 */}
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
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] font-semibold text-black">
          결제 내역 상세
        </h1>
      </header>

      {/* 내용 */}
      <main className="flex-1 pb-[90px]">
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
          <div className="mt-6 px-5 flex flex-col items-center text-[13px] text-[#777777]">
            <Icon
              icon="mdi:file-document-outline"
              className="w-10 h-10 mb-2 text-[#D9D9D9]"
            />
            결제 내역 상세를 찾을 수 없습니다.
          </div>
        )}

        {!loading && !error && detail && (
          <>
            {/* 상태 + 날짜 */}
            <section className="mt-5 px-5 flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#1E2124]">
                {statusLabel}
              </span>
              <span className="text-[14px] text-black/40">{dateLabel}</span>
            </section>

            {/* 상품 정보 */}
            <section className="mt-4 px-5">
              <div className="w-full bg-white border border-[#F3F4F5] rounded-[12px] px-4 py-4">
                <p className="text-[16px] font-semibold mb-3 text-[#1E2124]">
                  상품정보
                </p>

                <div className="flex gap-4">
                  <div
                    className="w-20 h-20 rounded border border-[#F5F5F5] bg-gray-100 bg-cover bg-center overflow-hidden"
                    style={
                      detail.thumbnailUrl
                        ? { backgroundImage: `url(${detail.thumbnailUrl})` }
                        : undefined
                    }
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <p className="text-[14px] text-black/40">
                        {detail.shopName}
                      </p>
                      <p className="text-[14px] text-[#1E2124] whitespace-pre-line">
                        {detail.productName}
                      </p>
                    </div>

                    <p className="text-[16px] font-semibold text-[#1E2124] text-right">
                      {formatCurrency(productAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 결제내역 */}
            <section className="mt-6 px-5">
              <div className="w-full bg-white border border-[#F3F4F5] rounded-[12px] p-4">
                <div className="flex flex-col gap-4">
                  <p className="text-[16px] font-semibold text-[#1E2124]">
                    결제내역
                  </p>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#1E2124]">
                        상품 금액
                      </span>
                      <span className="text-[12px] text-[#1E2124]">
                        {formatCurrency(productAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#1E2124]">
                        쿠폰 할인
                      </span>
                      <span className="text-[12px] text-[#1E2124]">
                        {couponDiscount
                          ? `-${Math.abs(couponDiscount).toLocaleString()}원`
                          : "0원"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#EEEEEE]" />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#1E2124]">
                        {pgLabel}
                      </span>
                      <span className="text-[12px] text-[#1E2124]">
                        {formatCurrency(paymentAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[14px] font-semibold text-[#1E2124]">
                        총 결제 금액
                      </span>
                      <span className="text-[14px] font-semibold text-[#1E2124]">
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
    </div>
  );
}
