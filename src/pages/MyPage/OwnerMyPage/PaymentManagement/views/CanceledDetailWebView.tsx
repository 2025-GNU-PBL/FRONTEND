import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../../lib/api/axios";

/** 상품 정보 */
type ProductInfo = {
  shopName: string;
  productName: string;
  paidAmount: number;
  thumbnailUrl: string;
};

/** 고객 정보 */
type CustomerInfo = {
  name: string;
  phone: string;
  customerEmail: string;
};

/** 리스트 → 상세로 전달되는 state 타입 (취소 완료 전용) */
type CanceledDetailLocationState = {
  paymentKey?: string;
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
};

/** 취소 완료 상세 조회 API 응답 DTO
 *  (GET /api/v1/payments/cancels/{paymentKey})
 */
type CanceledDetailApiResponse = {
  paymentKey: string;
  orderCode: string;
  shopName: string;
  productName: string;
  thumbnailUrl?: string;
  customerEmail: string;
  customerName: string;
  customerPhoneNumber: string;
  originalPrice: number;
  totalPrice: number;
  discountAmount: number;
  paidAmount: number;
  paymentMethod: string;
  pgProvider: string;
  receiptUrl: string;
  status: string;
  approvedAt: string;
  canceledAt: string;
  cancelReason: string;
  rejectReason: string | null;
  rejectedAt: string | null;
};

interface WebCanceledDetailViewProps {
  /** 옵션: 없으면 location.state 에서 가져옴 */
  paymentKey?: string;
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
}

/** 금액 포맷터 */
function formatAmount(amount?: number): string {
  if (amount == null) return "0원";
  return `${amount.toLocaleString("ko-KR")}원`;
}

/* 공용 섹션 카드 (다른 웹뷰와 동일 스타일) */
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

/** 결제 취소 완료 상세 (웹뷰) */
const WebCanceledDetailView: React.FC<WebCanceledDetailViewProps> = (props) => {
  const location = useLocation();
  const nav = useNavigate();
  const state = location.state as CanceledDetailLocationState | undefined;

  const paymentKey = props.paymentKey ?? state?.paymentKey ?? "";

  /** product / customer / cancelReason 은 내부 state 로 관리 */
  const [product, setProduct] = useState<ProductInfo | undefined>(
    props.product ?? state?.product
  );
  const [customer, setCustomer] = useState<CustomerInfo | undefined>(
    props.customer ?? state?.customer
  );
  const [cancelReason, setCancelReason] = useState<string>(
    props.cancelReason ?? state?.cancelReason ?? ""
  );
  const [orderCode, setOrderCode] = useState<string | undefined>(undefined);

  /** 상세 조회 로딩 / 에러 */
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  /** 취소 완료 상세 조회 (항상 /cancels/{paymentKey} 사용) */
  useEffect(() => {
    if (!paymentKey) return;

    // 이미 필요한 정보가 다 있으면 API 호출 생략
    if (product && customer && cancelReason) return;

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);

        const { data } = await api.get<CanceledDetailApiResponse>(
          `/api/v1/payments/cancels/${paymentKey}`
        );

        const mappedProduct: ProductInfo = {
          shopName: data.shopName,
          productName: data.productName,
          paidAmount: data.paidAmount,
          thumbnailUrl: data.thumbnailUrl ?? "",
        };

        const mappedCustomer: CustomerInfo = {
          name: data.customerName,
          phone: data.customerPhoneNumber,
          customerEmail: data.customerEmail,
        };

        setProduct((prev) => prev ?? mappedProduct);
        setCustomer((prev) => prev ?? mappedCustomer);
        setCancelReason((prev) =>
          prev && prev.trim() ? prev : data.cancelReason
        );
        setOrderCode((prev) => prev ?? data.orderCode);
      } catch (error) {
        console.error("[CanceledDetail/Web] fetchDetail error:", error);
        setDetailError("취소 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
    // 모바일과 동일한 로직 유지
  }, [paymentKey, product, customer, cancelReason]);

  /** 필수 데이터가 없을 때 */
  if (!paymentKey) {
    return (
      <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />
        <div className="pt-16 pb-16">
          <div className="max-w-[960px] mx-auto px-6">
            <SectionCard
              title="취소 상세 정보를 찾을 수 없습니다."
              subtitle="paymentKey가 전달되지 않았습니다."
              icon="solar:shield-warning-bold-duotone"
            >
              <div className="py-8 text-center text-sm text-gray-600">
                취소 상세 정보를 찾을 수 없습니다. (paymentKey 없음)
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
                  뒤로가기
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    );
  }

  /** 상세 로딩 중일 때 */
  if (detailLoading && (!product || !customer)) {
    return (
      <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />
        <div className="pt-16 pb-16">
          <div className="max-w-[960px] mx-auto px-6">
            <SectionCard
              title="취소 상세 정보를 불러오는 중입니다."
              subtitle="잠시만 기다려 주세요."
              icon="solar:card-recive-bold-duotone"
            >
              <div className="py-8 text-center text-sm text-gray-600">
                취소 상세 정보를 불러오는 중입니다...
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    );
  }

  /** 로딩은 끝났는데도 필수 데이터가 없으면 에러 처리 */
  if ((!product || !customer) && !detailLoading) {
    return (
      <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />
        <div className="pt-16 pb-16">
          <div className="max-w-[960px] mx-auto px-6">
            <SectionCard
              title="취소 상세 정보를 찾을 수 없습니다."
              subtitle="잠시 후 다시 시도해 주세요."
              icon="solar:shield-warning-bold-duotone"
            >
              <div className="py-8 text-center text-sm text-gray-600">
                취소 상세 정보를 찾을 수 없습니다.
              </div>
              {detailError && (
                <div className="mt-2 text-xs text-red-500 text-center">
                  {detailError}
                </div>
              )}
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
                  뒤로가기
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    );
  }

  const formattedPrice = formatAmount(product?.paidAmount);

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
      {/* 상단 얇은 그라데이션 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 페이지 타이틀 */}
          <header className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-gray-900">
                취소 완료 상세 내역
              </h1>
              <p className="mt-1 text-sm text-gray-500 truncate">
                {orderCode
                  ? `주문번호 ${orderCode}`
                  : "취소된 주문의 상세 정보입니다."}
              </p>
            </div>
          </header>

          {/* 상품정보 카드 (모바일 상품정보 섹션 웹 스타일화) */}
          <SectionCard
            title="상품정보"
            subtitle="취소된 결제의 상품 정보를 확인할 수 있습니다."
            icon="solar:bag-3-bold-duotone"
          >
            <div className="flex flex-wrap items-center gap-5">
              {/* 썸네일 */}
              <div className="w-[96px] h-[96px] rounded-[8px] border border-[#F3F4F5] overflow-hidden bg-[#F9F9F9] flex-shrink-0">
                {product?.thumbnailUrl ? (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.productName}
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
                <p className="text-[13px] text-black/40">{product?.shopName}</p>
                <p className="text-[15px] font-medium text-[#1E2124] leading-[1.5]">
                  {product?.productName}
                </p>
              </div>

              {/* 금액 */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-500">결제 금액</span>
                <span className="text-[18px] font-semibold text-[#1E2124]">
                  {formattedPrice}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* 고객정보 카드 */}
          <SectionCard
            title="고객정보"
            subtitle="해당 주문을 진행한 고객 정보를 확인할 수 있습니다."
            icon="solar:user-bold-duotone"
          >
            <div className="flex flex-col gap-3 text-[13px] text-[#1E2124]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">이름</span>
                <span className="text-[13px] font-medium">
                  {customer?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">전화번호</span>
                <span className="text-[13px] font-medium">
                  {customer?.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">고객 이메일</span>
                <span className="text-[13px] font-medium">
                  {customer?.customerEmail}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* 취소 사유 카드 */}
          <SectionCard
            title="취소 사유"
            subtitle="고객이 남긴 취소 사유를 확인할 수 있습니다."
            icon="solar:document-text-bold-duotone"
          >
            <div className="rounded-[10px] bg-[#F6F7FB] px-4 py-4 min-h-[72px]">
              <p className="whitespace-pre-line text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                {cancelReason || "취소 사유가 입력되지 않았습니다."}
              </p>
            </div>
          </SectionCard>

          {/* 하단 안내 + 뒤로가기 버튼 */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <Icon
                icon="solar:info-circle-bold"
                className="w-3.5 h-3.5 flex-shrink-0"
              />
              <span>
                취소 완료된 주문은 정산 내역에서 제외되며, 추가 변경이
                불가능합니다.
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
        </div>
      </div>
    </main>
  );
};

export default WebCanceledDetailView;
