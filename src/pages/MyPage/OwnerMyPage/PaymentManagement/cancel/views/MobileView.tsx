import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../../../../lib/api/axios";
import MyPageHeader from "../../../../../../components/MyPageHeader";

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

interface MobileCanceledDetailViewProps {
  /** 옵션: 없으면 location.state 에서 가져옴 */
  paymentKey?: string;
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
}

/** 결제 취소 완료 상세 (모바일) - 반응형 */
const MobileView: React.FC<MobileCanceledDetailViewProps> = (props) => {
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

  /** 상세 조회 로딩 / 에러 */
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  /** 금액 포맷 */
  const formattedPrice =
    product?.paidAmount != null
      ? product.paidAmount.toLocaleString("ko-KR") + "원"
      : "-";

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
      } catch (error) {
        console.error("[CanceledDetail] fetchDetail error:", error);
        setDetailError("취소 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [paymentKey, product, customer, cancelReason]);

  /** 필수 데이터가 없을 때 */
  if (!paymentKey) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 text-center shadow">
          <p className="mb-3 text-sm text-gray-700">
            취소 상세 정보를 찾을 수 없습니다. (paymentKey 없음)
          </p>
          <button
            type="button"
            onClick={() => nav(-1)}
            className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  /** 상세 로딩 중일 때 */
  if (detailLoading && (!product || !customer)) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 text-center shadow">
          <p className="mb-3 text-sm text-gray-700">
            취소 상세 정보를 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  /** 로딩은 끝났는데도 필수 데이터가 없으면 에러 처리 */
  if ((!product || !customer) && !detailLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 text-center shadow">
          <p className="mb-2 text-sm text-gray-700">
            취소 상세 정보를 찾을 수 없습니다.
          </p>
          {detailError && (
            <p className="mb-3 text-xs text-red-500">{detailError}</p>
          )}
          <button
            type="button"
            onClick={() => nav(-1)}
            className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#F5F6F8] pb-10">
      {/* 헤더: 취소 완료 상세 내역 */}
      <div className="sticky top-0 z-20 bg-white">
        <MyPageHeader
          title="취소 완료 상세 내역"
          onBack={() => nav(-1)}
          showMenu={false}
        />
      </div>

      {/* 본문 */}
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-20">
        {/* 상품정보 카드 */}
        <section className="mb-4 w-full rounded-[12px] border border-[#F3F4F5] bg-white p-4 shadow-[0_0_0_rgba(0,0,0,0.06)]">
          <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
            상품정보
          </div>

          <div className="flex items-start justify-between gap-4">
            {/* 썸네일 + 텍스트 */}
            <div className="flex flex-1 items-start gap-4">
              {/* 썸네일 */}
              <div className="h-20 w-20 flex-shrink-0 rounded-[4px] border border-[#F5F5F5] bg-cover bg-center">
                {product?.thumbnailUrl && (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.productName}
                    className="h-full w-full rounded-[4px] object-cover"
                  />
                )}
              </div>

              {/* 텍스트 영역 */}
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-black/40">
                  {product?.shopName}
                </p>
                <p className="mt-1 line-clamp-2 text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-[#1E2124]">
                  {product?.productName}
                </p>
              </div>
            </div>

            {/* 가격 */}
            <div className="flex flex-col items-end justify-start">
              <span className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124] whitespace-nowrap">
                {formattedPrice}
              </span>
            </div>
          </div>
        </section>

        {/* 고객정보 카드 */}
        <section className="mb-4 w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4 shadow-[0_0_0_rgba(0,0,0,0.06)]">
          <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
            고객정보
          </div>

          <div className="flex flex-col gap-2 text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
            <div className="flex items-center justify-between gap-4">
              <span>이름</span>
              <span className="flex-1 text-right break-all">
                {customer?.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>전화번호</span>
              <span className="flex-1 text-right break-all">
                {customer?.phone}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>고객 이메일</span>
              <span className="flex-1 text-right break-all">
                {customer?.customerEmail}
              </span>
            </div>
          </div>
        </section>

        {/* 취소 사유 카드 */}
        <section className="mb-4 w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4">
          <div className="mb-3 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
            취소 사유
          </div>

          <div className="flex min-h-[61px] w-full items-center justify-center rounded-[8px] bg-[#F6F7FB] px-4 py-5">
            <p className="w-full whitespace-pre-line text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-black">
              {cancelReason}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileView;
