import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../../../../lib/api/axios";
import MyPageHeader from "../../../../../../components/MyPageHeader";
import { toast } from "react-toastify";

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

type DetailPaymentStatus = "CANCEL_REQUESTED" | "CANCELED";

type CancelDetailLocationState = {
  paymentKey?: string;
  paymentStatus?: DetailPaymentStatus;
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
  customerEmail?: string;
  canApprove?: boolean;
};

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
  paymentKey?: string;
  paymentStatus?: DetailPaymentStatus;
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
  canApprove?: boolean;
  onApproved?: () => void;
}

const MobileView: React.FC<MobileCancelDetailViewProps> = (props) => {
  const location = useLocation();
  const nav = useNavigate();
  const state = location.state as CancelDetailLocationState | undefined;

  const paymentKey = props.paymentKey ?? state?.paymentKey ?? "";
  const initialStatus: DetailPaymentStatus = (props.paymentStatus ??
    state?.paymentStatus ??
    "CANCEL_REQUESTED") as DetailPaymentStatus;

  const canApprove = props.canApprove ?? state?.canApprove ?? true;

  const [product, setProduct] = useState<ProductInfo | undefined>(
    props.product ?? state?.product
  );
  const [customer, setCustomer] = useState<CustomerInfo | undefined>(
    props.customer ?? state?.customer
  );
  const [cancelReason, setCancelReason] = useState<string>(
    props.cancelReason ?? state?.cancelReason ?? ""
  );

  const [paymentStatus, setPaymentStatus] =
    useState<DetailPaymentStatus>(initialStatus);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [approveLoading, setApproveLoading] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const formattedPrice =
    product?.paidAmount != null
      ? product.paidAmount.toLocaleString("ko-KR") + "원"
      : "-";

  useEffect(() => {
    if (!paymentKey) return;

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
        console.error(error);
        setDetailError("취소 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [paymentKey, product, customer, cancelReason]);

  const isRequested = paymentStatus === "CANCEL_REQUESTED";
  const showApproveUI = isRequested && canApprove;

  const handleApprove = async () => {
    if (!paymentKey) return;
    if (!showApproveUI) return;

    try {
      setApproveLoading(true);
      await api.post(`/api/v1/payments/${paymentKey}/cancel-approve`);

      setToastMessage("취소요청이 승인됐어요");
      setShowToast(true);
      setPaymentStatus("CANCELED");
      props.onApproved?.();

      setTimeout(() => setShowToast(false), 2500);
    } catch (error) {
      console.error(error);
      toast.error("승인 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setApproveLoading(false);
    }
  };

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
      setPaymentStatus("CANCELED");
      props.onApproved?.();

      setTimeout(() => setShowToast(false), 2500);
    } catch (error) {
      console.error(error);
      toast.error("취소 요청 거절 처리에 실패했습니다.");
    } finally {
      setApproveLoading(false);
    }
  };

  if (!paymentKey) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow">
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

  if (detailLoading && (!product || !customer)) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow">
          <p className="mb-3 text-sm text-gray-700">
            취소 상세 정보를 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  if ((!product || !customer) && !detailLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F5F6F8] px-5">
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
            className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex min-h-screen w-full flex-col bg-[#F5F6F8] pb-32">
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="취소요청 상세내역"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 본문: max-w 제거 → 카드 전체 화면 확장 */}
        <div className="w-full px-5 pt-20">
          <section className="relative mb-4 h-[150px] w-full rounded-[12px] border border-[#F3F4F5] bg-white shadow">
            <div className="absolute left-4 top-4 text-[16px] font-semibold text-[#1E2124]">
              상품정보
            </div>

            <div className="absolute left-4 top-[54px] flex pr-4">
              <div className="h-20 w-20 rounded-[4px] border border-[#F5F5F5] bg-cover bg-center">
                {product?.thumbnailUrl && (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.productName}
                    className="h-full w-full rounded-[4px] object-cover"
                  />
                )}
              </div>

              <div className="ml-4 flex flex-1 flex-col justify-between">
                <p className="text-[14px] text-black/40">{product?.shopName}</p>
                <p className="mt-1 line-clamp-2 text-[14px] text-[#1E2124]">
                  {product?.productName}
                </p>
              </div>
            </div>

            <div className="absolute right-4 top-[108px] text-[16px] font-semibold text-[#1E2124]">
              {formattedPrice}
            </div>
          </section>

          <section className="mb-4 w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4 shadow">
            <div className="mb-4 text-[16px] font-semibold text-[#1E2124]">
              고객정보
            </div>

            <div className="flex flex-col gap-2 text-[12px] text-[#1E2124]">
              <div className="flex items-center justify-between gap-4">
                <span>이름</span>
                <span className="flex-1 text-right">{customer?.name}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>전화번호</span>
                <span className="flex-1 text-right">{customer?.phone}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>고객 이메일</span>
                <span className="flex-1 truncate text-right">
                  {customer?.customerEmail}
                </span>
              </div>
            </div>
          </section>

          <section className="mb-4 w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4">
            <div className="mb-3 text-[16px] font-semibold text-[#1E2124]">
              취소 사유
            </div>

            <div className="flex min-h-[61px] w-full items-center justify-center rounded-[8px] bg-[#F6F7FB] px-4 py-5">
              <p className="w-full whitespace-pre-line text-[14px] text-black">
                {cancelReason}
              </p>
            </div>
          </section>
        </div>

        {showApproveUI && (
          <div className="fixed bottom-5 left-0 right-0 z-30 border-t border-[#F3F4F5] bg-[#F6F7FB] px-5">
            <div className="flex w-full flex-row items-center gap-[12px] py-3">
              <button
                type="button"
                onClick={handleReject}
                disabled={approveLoading}
                className={`flex h-[48px] flex-1 items-center justify-center rounded-[12px] border border-[#E1E1E1] bg-[#F6F7FB] text-[14px] text-[#999] ${
                  approveLoading ? "opacity-60" : ""
                }`}
              >
                거절하기
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={approveLoading}
                className={`flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-[#FF2233] text-[14px] text-white ${
                  approveLoading ? "opacity-60" : ""
                }`}
              >
                승인하기
              </button>
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-6 left-0 right-0 z-40 px-5">
          <div className="w-full rounded-[30px] bg-[#4D4D4D] px-5 py-3">
            <div className="flex items-center gap-[8px]">
              <Icon
                icon="icon-park-solid:check-one"
                className="h-5 w-5 text-white"
              />
              <span className="text-[16px] font-semibold text-white">
                {toastMessage || "처리가 완료됐어요"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileView;
