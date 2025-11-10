import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";
import { useAppSelector } from "../../../../../store/hooks";
import type { UserData, UserRole } from "../../../../../store/userSlice";

/** 결제 상세 DTO */
interface PaymentDetailResponse {
  orderCode: string;
  shopName: string;
  thumbnail?: string;
  productName: string;
  status:
    | "READY"
    | "PAID"
    | "COMPLETED"
    | "CANCELLED"
    | "CANCEL_REQUEST"
    | string;
  approvedAt: string;
  productAmount: number;
  couponDiscountAmount: number;
  paymentAmount: number;
  pgProvider: string;
}

/** 화면 상태 라벨 */
type PaymentStatusLabel =
  | "예약중"
  | "예약완료"
  | "이용완료"
  | "취소요청"
  | "취소완료";

interface Accessor {
  socialId: string;
  userRole: UserRole;
  owner: boolean;
  customer: boolean;
}

/** 개발용 더미 데이터 */
const DEV_MOCK_DETAIL: PaymentDetailResponse = {
  orderCode: "TEST-ORDER-DETAIL-001",
  shopName: "제이바이로이스타",
  thumbnail: "/images/sample-payment.png",
  productName: "[촬영] 신부신랑 헤어메이크업 (부원장)",
  status: "PAID",
  approvedAt: "2025-10-14T09:00:00",
  productAmount: 323000,
  couponDiscountAmount: 32300,
  paymentAmount: 290700,
  pgProvider: "토스페이먼츠",
};

/** 백엔드 status → 라벨 */
function mapStatusToLabel(
  status: PaymentDetailResponse["status"]
): PaymentStatusLabel {
  switch (status) {
    case "READY":
      return "예약중";
    case "PAID":
      return "예약완료";
    case "COMPLETED":
      return "이용완료";
    case "CANCEL_REQUEST":
      return "취소요청";
    case "CANCELLED":
      return "취소완료";
    default:
      return "예약중";
  }
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatCurrency(value?: number): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value.toLocaleString()}원`;
}

/** 고객 마이페이지 결제 내역 상세 (Web) */
export default function DetailWebView() {
  const nav = useNavigate();
  const { paymentKey } = useParams<{ paymentKey: string }>();

  const { userData, role } = useAppSelector((state) => state.user) as {
    userData: UserData | null;
    role: UserRole | null;
  };

  const [detail, setDetail] = React.useState<PaymentDetailResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const accessor: Accessor | null =
    userData && role
      ? {
          socialId: userData.socialId,
          userRole: role,
          owner: role === "OWNER",
          customer: role === "CUSTOMER",
        }
      : null;

  const isNotCustomer = role && role !== "CUSTOMER";

  React.useEffect(() => {
    if (!accessor || !accessor.customer) {
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
          `/api/v1/payments/${paymentKey}`,
          {
            params: {
              accessor: JSON.stringify(accessor),
            },
          }
        );

        // ✅ API 성공했지만 비어있을 때 → DEV 모드에서만 더미 사용
        if (
          import.meta.env.DEV &&
          (!data || !data.orderCode || !data.productName || !data.shopName)
        ) {
          setDetail({
            ...DEV_MOCK_DETAIL,
            orderCode: paymentKey,
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
  }, [paymentKey, accessor?.socialId, accessor?.userRole, accessor?.customer]);

  const statusLabel = detail ? mapStatusToLabel(detail.status) : "예약중";
  const dateLabel = detail ? formatDate(detail.approvedAt) : "";

  const productAmount = detail?.productAmount ?? 0;
  const couponDiscount = detail?.couponDiscountAmount ?? 0;
  const paymentAmount = detail?.paymentAmount ?? productAmount - couponDiscount;
  const pgLabel = detail?.pgProvider || "토스페이먼츠";

  return (
    <div className="w-full min-h-screen bg-[#F8F8F8]">
      {/* 상단 공통 헤더 */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <MyPageHeader
          title="결제 내역 상세"
          onBack={() => nav(-1)}
          showMenu={false}
        />
      </div>

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
                    detail.thumbnail
                      ? { backgroundImage: `url(${detail.thumbnail})` }
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
                <div className="flex justify-between text-[14px] mb-3">
                  <span>상품 금액</span>
                  <span>{formatCurrency(productAmount)}</span>
                </div>

                <div className="flex justify-between text-[14px] mb-3">
                  <span>쿠폰 할인</span>
                  <span>
                    {couponDiscount
                      ? `-${Math.abs(couponDiscount).toLocaleString()}원`
                      : "0원"}
                  </span>
                </div>

                <div className="w-full h-px bg-[#EEEEEE] my-4" />

                <div className="flex justify-between text-[14px] mb-3">
                  <span>{pgLabel}</span>
                  <span>{formatCurrency(paymentAmount)}</span>
                </div>

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
