import React, { useEffect, useState } from "react";
import api from "../../../../../lib/api/axios";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";

type ProductInfo = {
  shopName: string;
  productName: string;
  paidAmount: number;
  thumbnailUrl: string;
};

type CustomerInfo = {
  name: string;
  phone: string;
  customerEmail: string;
};

/** 상세 화면에서 실제로 쓸 상태 */
type DetailPaymentStatus = "CANCEL_REQUESTED" | "CANCELED";

/** 리스트 → 상세로 전달되는 state 타입 */
type CancelDetailLocationState = {
  paymentKey?: string;
  paymentStatus?: DetailPaymentStatus; // 어떤 상태인지 같이 전달(요청/완료)
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
  customerEmail?: string;
  /** 매출 관리에서 읽기 전용으로 열 때 승인 버튼 숨기기 용도 */
  canApprove?: boolean;
};

/** 취소 요청 상세 조회 API 응답 DTO
 *  (GET /api/v1/payments/cancel-requests/{paymentKey})
 */
type CancelDetailApiResponse = {
  paymentKey: string;
  shopName: string;
  productName: string;
  paidAmount: number;
  thumbnailUrl?: string;
  customerName: string;
  customerPhoneNumber: string;
  cancelReason: string;
  customerEmail: string;
};

interface MobileCancelDetailViewProps {
  /** 옵션: 없으면 location.state 에서 가져옴 */
  paymentKey?: string;
  paymentStatus?: DetailPaymentStatus;
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
  /** 상위에서 강제로 승인 버튼 노출 여부 제어하고 싶을 때 */
  canApprove?: boolean;
  /** 승인/거절 완료 후 상위에서 추가 작업이 필요하면 넘겨서 사용 */
  onApproved?: () => void;
}

/** 사장님 - 결제 취소요청 상세 */
const CancelRequestDetailMobileView: React.FC<MobileCancelDetailViewProps> = (
  props
) => {
  const location = useLocation();
  const nav = useNavigate();
  const state = location.state as CancelDetailLocationState | undefined;

  const paymentKey = props.paymentKey ?? state?.paymentKey ?? "";

  /** 처음 넘어온 상태값 (요청/완료) */
  const initialStatus: DetailPaymentStatus = (props.paymentStatus ??
    state?.paymentStatus ??
    "CANCEL_REQUESTED") as DetailPaymentStatus;

  /** 승인 버튼 노출 여부 (매출관리 → 상세는 false로 들어옴) */
  const canApprove = props.canApprove ?? state?.canApprove ?? true;

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

  /** 현재 결제 상태 (요청 / 완료) */
  const [paymentStatus, setPaymentStatus] =
    useState<DetailPaymentStatus>(initialStatus);

  /** 상세 조회 로딩 / 에러 */
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  /** 승인/거절 API 로딩 */
  const [approveLoading, setApproveLoading] = useState(false);

  /** 승인/거절 완료 토스트 */
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  /** 금액 포맷 */
  const formattedPrice =
    product?.paidAmount != null
      ? product.paidAmount.toLocaleString("ko-KR") + "원"
      : "-";

  /** 취소 요청 상세 조회
   *  -> 항상 /api/v1/payments/cancel-requests/{paymentKey} 만 호출
   */
  useEffect(() => {
    if (!paymentKey) return;

    // 이미 필요한 정보가 다 있으면 API 호출 생략
    if (product && customer && cancelReason) return;

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);

        const { data } = await api.get<CancelDetailApiResponse>(
          `/api/v1/payments/cancel-requests/${paymentKey}`
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
        console.error("[CancelDetail] fetchDetail error:", error);
        setDetailError("취소 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [paymentKey, product, customer, cancelReason]);

  const isRequested = paymentStatus === "CANCEL_REQUESTED";
  /** 실제로 승인/거절 UI를 보여줄지 여부 */
  const showApproveUI = isRequested && canApprove;

  /** 승인 처리
   *  POST /api/v1/payments/{paymentKey}/cancel-approve
   */
  const handleApprove = async () => {
    if (!paymentKey) return;
    if (!showApproveUI) return;

    try {
      setApproveLoading(true);
      await api.post(`/api/v1/payments/${paymentKey}/cancel-approve`);

      setToastMessage("취소요청이 승인됐어요");
      setShowToast(true);
      setPaymentStatus("CANCELED"); // 완료 상태로 전환
      props.onApproved?.();

      setTimeout(() => {
        setShowToast(false);
      }, 2500);
    } catch (error) {
      console.error(error);
      alert("승인 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setApproveLoading(false);
    }
  };

  /** 취소 요청 거절
   *  POST /api/v1/payments/{paymentKey}/cancel-reject
   */
  const handleReject = async () => {
    if (!paymentKey) return;
    if (!showApproveUI) return;

    try {
      setApproveLoading(true);
      await api.post(`/api/v1/payments/${paymentKey}/cancel-reject`, {
        rejectReason: "사장님이 취소 요청을 거절했습니다.",
      });

      setToastMessage("취소요청을 거절했어요");
      setShowToast(true);
      // 이 화면에서는 더 이상 승인/거절 버튼이 보이지 않도록 상태 변경
      setPaymentStatus("CANCELED");
      props.onApproved?.();

      setTimeout(() => {
        setShowToast(false);
      }, 2500);
    } catch (error) {
      console.error(error);
      alert("취소 요청 거절 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setApproveLoading(false);
    }
  };

  /** 필수 데이터가 없을 때 */
  if (!paymentKey) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow">
          <p className="mb-3 text-sm text-gray-700">
            취소 상세 정보를 찾을 수 없습니다. (paymentKey 없음)
          </p>
          <button
            type="button"
            onClick={() => nav(-1)}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
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
      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow">
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
      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow">
          <p className="mb-2 text-sm text-gray-700">
            취소 상세 정보를 찾을 수 없습니다.
          </p>
          {detailError && (
            <p className="mb-3 text-xs text-red-500">{detailError}</p>
          )}
          <button
            type="button"
            onClick={() => nav(-1)}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 전체 화면 컨테이너 */}
      <div className="relative mx-auto min-h-screen w-full max-w-[390px] bg-[#F5F6F8] pb-32">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="취소요청 상세내역"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 상단 여백 + 본문 */}
        <div className="px-5 pt-20">
          {/* 상품정보 카드 */}
          <section className="relative mb-4 h-[150px] w-full rounded-[12px] border border-[#F3F4F5] bg-white shadow-[0_0_0_rgba(0,0,0,0.06)]">
            <div className="absolute left-4 top-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
              상품정보
            </div>

            <div className="absolute left-4 top-[54px] flex">
              {/* 썸네일 */}
              <div className="h-20 w-20 rounded-[4px] border border-[#F5F5F5] bg-cover bg-center">
                {product?.thumbnailUrl && (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.productName}
                    className="h-full w-full rounded-[4px] object-cover"
                  />
                )}
              </div>

              {/* 텍스트 영역 */}
              <div className="ml-4 flex w-[159px] flex-col justify-between">
                <p className="h-[21px] text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-black/40">
                  {product?.shopName}
                </p>
                <p className="mt-1 h-[42px] text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-[#1E2124]">
                  {product?.productName}
                </p>
              </div>
            </div>

            {/* 가격 */}
            <div className="absolute right-4 top-[108px] h-[26px] text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
              {formattedPrice}
            </div>
          </section>

          {/* 고객정보 카드 */}
          <section className="mb-4 w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4 shadow-[0_0_0_rgba(0,0,0,0.06)]">
            <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
              고객정보
            </div>

            <div className="flex flex-col gap-2 text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
              <div className="flex items-center justify-between">
                <span>이름</span>
                <span className="text-right">{customer?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>전화번호</span>
                <span className="text-right">{customer?.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>고객 이메일</span>
                <span className="text-right">{customer?.customerEmail}</span>
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

        {/* 하단 버튼 영역 (요청 상태 + canApprove=true 일 때만) */}
        {showApproveUI && (
          <div className="fixed bottom-18 left-1/2 z-30 w-full max-w-[390px] -translate-x-1/2 border-t border-[#F3F4F5] bg-[#F6F7FB]">
            <div className="flex w-full flex-row items-center gap-[12px] px-5 py-3">
              <button
                type="button"
                onClick={handleReject}
                disabled={approveLoading}
                className={`flex h-[48px] flex-1 flex-row items-center justify-center rounded-[12px] border border-[#E1E1E1] bg-[#F6F7FB] text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#999999] ${
                  approveLoading ? "opacity-60" : ""
                }`}
              >
                거절하기
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={approveLoading}
                className={`flex h-[48px] flex-1 flex-row items-center justify-center rounded-[12px] bg-[#FF2233] text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-white ${
                  approveLoading ? "opacity-60" : ""
                }`}
              >
                승인하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 승인 / 거절 완료 토스트 */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-40 w-[350px] -translate-x-1/2 rounded-[30px] bg-[#4D4D4D] px-5 py-3">
          <div className="flex items-center gap-[8px]">
            <div className="flex h-5 w-5 items-center justify-center">
              <Icon
                icon="icon-park-solid:check-one"
                className="h-5 w-5 text-white"
              />
            </div>
            <span className="text-[16px] font-semibold leading-[24px] tracking-[-0.2px] text-white">
              {toastMessage || "처리가 완료됐어요"}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default CancelRequestDetailMobileView;
