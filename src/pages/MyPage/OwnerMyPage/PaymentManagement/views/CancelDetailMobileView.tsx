// MobileCancelDetailView.tsx
import React, { useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";

type ProductInfo = {
  shopName: string;
  productName: string;
  price: number;
  imageUrl: string;
};

type CustomerInfo = {
  name: string;
  phone: string;
  customerId: string;
};

type CancelDetailLocationState = {
  paymentKey: string;
  product: ProductInfo;
  customer: CustomerInfo;
  cancelReason: string;
};

interface MobileCancelDetailViewProps {
  /** 이제는 옵션: 없으면 location.state 에서 가져옴 */
  paymentKey?: string;
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
  /** 승인 완료 후 상위에서 추가 작업이 필요하면 넘겨서 사용 */
  onApproved?: () => void;
}

const MobileCancelDetailView: React.FC<MobileCancelDetailViewProps> = (
  props
) => {
  const location = useLocation();
  const nav = useNavigate();
  const state = location.state as CancelDetailLocationState | undefined;

  // 1순위: props, 2순위: location.state
  const paymentKey = props.paymentKey ?? state?.paymentKey ?? "";
  const product = props.product ?? state?.product;
  const customer = props.customer ?? state?.customer;
  const cancelReason = props.cancelReason ?? state?.cancelReason ?? "";

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const formattedPrice =
    product?.price != null ? product.price.toLocaleString("ko-KR") + "원" : "-";

  const handleApproveClick = () => {
    setConfirmOpen(true);
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
  };

  const handleApproveConfirm = async () => {
    if (!paymentKey) return;

    try {
      setLoading(true);
      // Swagger 에 있는 경로 그대로 사용
      await axios.post(`/api/v1/payments/${paymentKey}/cancel-approve`);

      setConfirmOpen(false);
      setShowToast(true);
      props.onApproved?.();

      // 토스트 자동 닫힘
      setTimeout(() => {
        setShowToast(false);
      }, 2500);
    } catch (error) {
      console.error(error);
      alert("승인 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 필수 데이터가 없을 때 (URL 직접 입력 등) 처리
  if (!paymentKey || !product || !customer) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] items-center justify-center bg-[#F5F6F8] px-5">
        <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow">
          <p className="mb-3 text-sm text-gray-700">
            취소 상세 정보를 찾을 수 없습니다.
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

  return (
    <>
      {/* 전체 화면 컨테이너 (헤더 제외) */}
      <div className="relative mx-auto min-h-screen w-full max-w-[390px] bg-[#F5F6F8] pb-32">
        {/* 상단 여백 (헤더와 겹치지 않도록 필요에 맞게 조절) */}
        <div className="px-5 pt-4">
          {/* 상품정보 카드 */}
          <section className="relative mb-4 h-[150px] w-full rounded-[12px] border border-[#F3F4F5] bg-white shadow-[0_0_0_rgba(0,0,0,0.06)]">
            <div className="absolute left-4 top-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
              상품정보
            </div>

            <div className="absolute left-4 top-[54px] flex">
              {/* 썸네일 */}
              <div className="h-20 w-20 rounded-[4px] border border-[#F5F5F5] bg-cover bg-center">
                {product.imageUrl && (
                  // 실제 이미지가 필요하면 img 사용
                  <img
                    src={product.imageUrl}
                    alt={product.productName}
                    className="h-full w-full rounded-[4px] object-cover"
                  />
                )}
              </div>

              {/* 텍스트 영역 */}
              <div className="ml-4 flex w-[159px] flex-col justify-between">
                <p className="h-[21px] text-center text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-black/40">
                  {product.shopName}
                </p>
                <p className="mt-1 h-[42px] text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-[#1E2124]">
                  {product.productName}
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
                <span className="text-right">{customer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>전화번호</span>
                <span className="text-right">{customer.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>고객 ID</span>
                <span className="text-right">{customer.customerId}</span>
              </div>
            </div>
          </section>

          {/* 취소 사유 카드 */}
          <section className="mb-4 w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4">
            <div className="mb-3 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
              취소 사유
            </div>

            <div className="flex h-[61px] w-full items-center justify-center rounded-[8px] bg-[#F6F7FB] px-4 py-5">
              <p className="w-full text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-black">
                {cancelReason}
              </p>
            </div>
          </section>
        </div>

        {/* 하단 승인하기 버튼 영역 (홈 인디케이터 없음) */}
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex justify-center">
          <div className="pointer-events-auto w-full max-w-[390px] px-5 pb-6 pt-4">
            <button
              type="button"
              onClick={handleApproveClick}
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-[12px] bg-[#FF2233] text-[16px] font-semibold leading-[24px] tracking-[-0.2px] text-white disabled:opacity-60"
            >
              {loading ? "승인 중..." : "승인하기"}
            </button>
          </div>
        </div>
      </div>

      {/* 승인 확인 모달 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="relative h-[188px] w-[335px] rounded-[14px] bg-white shadow-[4px_4px_10px_rgba(0,0,0,0.06)]">
            {/* 상단 내용 */}
            <div className="flex h-[100px] w-full flex-col gap-[10px] px-5 pt-6">
              <div className="flex h-6 items-center">
                <p className="text-[16px] font-bold leading-[24px] tracking-[-0.2px] text-[#1E2124]">
                  취소 요청을 승인 하시겠어요?
                </p>
              </div>
              <p className="h-[42px] text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#9D9D9D]">
                요청 승인 시 주문은 취소되며,
                <br />
                결제금액은 고객에게 환불됩니다.
              </p>
            </div>

            {/* 하단 버튼 영역 */}
            <div className="absolute bottom-0 flex h-[78px] w-full items-center gap-2 px-5 pb-6 pt-2">
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={loading}
                className="flex h-11 w-[142px] items-center justify-center rounded-[10px] bg-[#F3F4F5] text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#999999] disabled:opacity-60"
              >
                취소하기
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                disabled={loading}
                className="flex h-11 w-[143px] flex-1 items-center justify-center rounded-[10px] bg-[#FF2233] text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-white disabled:opacity-60"
              >
                {loading ? "승인 중..." : "승인하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승인 완료 토스트 */}
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
              취소요청이 승인 됐어요
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileCancelDetailView;
