// WebView.tsx (사장_마이페이지_취소 상세 내역 - Web)
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../../../lib/api/axios";

/** 상품 정보 타입 */
type ProductInfo = {
  shopName: string;
  productName: string;
  price: number;
  imageUrl: string;
};

/** 고객 정보 타입 */
type CustomerInfo = {
  name: string;
  phone: string;
  customerId: string;
};

/** location.state 로 전달되는 타입 */
type CancelDetailLocationState = {
  paymentKey: string;
  product: ProductInfo;
  customer: CustomerInfo;
  cancelReason: string;
};

interface WebCancelDetailViewProps {
  /** 옵션: 없으면 location.state 에서 가져옴 */
  paymentKey?: string;
  product?: ProductInfo;
  customer?: CustomerInfo;
  cancelReason?: string;
  /** 승인 완료 후 상위에서 추가 작업이 필요하면 사용 */
  onApproved?: () => void;
}

/** 공용 섹션 카드 (웹 디자인 참고용) */
function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="flex items-center justify-between px-8 pt-6 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5">
              <Icon icon={icon} className="h-5 w-5 text-[#1E2124]" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-[20px] font-semibold tracking-[-0.3px] text-gray-900">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-8">
        <div className="h-px bg-gray-100" />
      </div>
      <div className="px-8 py-6">{children}</div>
    </section>
  );
}

const WebView: React.FC<WebCancelDetailViewProps> = (props) => {
  const nav = useNavigate();
  const location = useLocation();
  const state = location.state as CancelDetailLocationState | undefined;

  // 1순위: props, 2순위: location.state
  const paymentKey = props.paymentKey ?? state?.paymentKey ?? "";
  const product = props.product ?? state?.product;
  const customer = props.customer ?? state?.customer;
  const cancelReason = props.cancelReason ?? state?.cancelReason ?? "";

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
      // Swagger 에 있는 경로 그대로 사용 (공용 api 인스턴스)
      await api.post(`/api/v1/payments/${paymentKey}/cancel-approve`);

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

  // 필수 데이터가 없을 때 처리 (URL 직접 입력 등)
  if (!paymentKey || !product || !customer) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#F6F7FB] px-4">
        <div className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-10 text-center shadow">
          <h1 className="mb-2 text-[18px] font-semibold text-gray-900">
            취소 상세 정보를 찾을 수 없습니다.
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            올바르지 않은 접근이거나, 필요한 데이터가 전달되지 않았습니다.
          </p>
          <button
            type="button"
            onClick={() => nav(-1)}
            className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            뒤로가기
          </button>
        </div>
      </main>
    );
  }

  const formattedPrice = product.price.toLocaleString("ko-KR") + "원";

  return (
    <>
      {/* 전체 웹 레이아웃 */}
      <main className="flex min-h-screen w-full flex-col bg-[#F6F7FB] text-gray-900">
        {/* 상단 그라디언트 바 */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

        <div className="pt-12 pb-20">
          <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-6">
            {/* 상단 타이틀 + 뒤로가기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => nav(-1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="h-4 w-4"
                  />
                </button>
                <div>
                  <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-gray-900">
                    취소 상세 내역
                  </h1>
                  <p className="mt-1 text-sm tracking-[-0.2px] text-gray-500">
                    고객의 결제 취소 요청 정보를 확인하고 승인할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 상세 카드 */}
            <SectionCard
              title="결제 취소 상세"
              subtitle="상품 정보, 고객 정보, 취소 사유를 확인 후 승인해 주세요."
              icon="solar:document-text-bold-duotone"
            >
              {/* 모바일 디자인을 웹용으로 재구성한 영역 */}
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                {/* 왼쪽: 상품 + 고객 */}
                <div className="space-y-5">
                  {/* 상품정보 카드 (모바일 디자인 기반) */}
                  <div className="relative h-[170px] w-full rounded-[16px] border border-[#F3F4F5] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between px-5 pt-4">
                      <h3 className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                        상품정보
                      </h3>
                    </div>

                    <div className="flex px-5 pb-5 pt-3">
                      {/* 썸네일 */}
                      <div className="h-24 w-24 flex-shrink-0 rounded-[6px] border border-[#F5F5F5] bg-[#F9FAFB]">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="h-full w-full rounded-[6px] object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* 텍스트 영역 */}
                      <div className="ml-4 flex min-w-0 flex-1 flex-col justify-between">
                        <p className="line-clamp-1 text-[13px] font-normal leading-[21px] tracking-[-0.2px] text-black/40">
                          {product.shopName}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-[#1E2124]">
                          {product.productName}
                        </p>
                        <p className="mt-3 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                          {formattedPrice}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 고객정보 카드 */}
                  <div className="rounded-[16px] border border-[#F3F4F5] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                    <h3 className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      고객정보
                    </h3>

                    <div className="flex flex-col gap-3 text-[13px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">이름</span>
                        <span className="text-right font-medium">
                          {customer.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">전화번호</span>
                        <span className="text-right font-medium">
                          {customer.phone}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">고객 ID</span>
                        <span className="text-right font-medium">
                          {customer.customerId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 취소 사유 + 승인 버튼 */}
                <div className="flex flex-col gap-5">
                  {/* 취소 사유 카드 */}
                  <div className="rounded-[16px] border border-[#F3F4F5] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                    <h3 className="mb-3 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      취소 사유
                    </h3>
                    <div className="rounded-[10px] bg-[#F6F7FB] px-4 py-4">
                      <p className="min-h-[60px] whitespace-pre-line text-[14px] font-normal leading-[21px] tracking-[-0.2px] text-black">
                        {cancelReason}
                      </p>
                    </div>
                    <p className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
                      <Icon
                        icon="solar:info-circle-bold"
                        className="h-3.5 w-3.5"
                      />
                      승인 후 취소가 완료되며, 결제금액은 고객에게 환불됩니다.
                    </p>
                  </div>

                  {/* 승인 버튼 영역 */}
                  <div className="mt-auto rounded-2xl bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[14px] font-semibold text-[#1E2124]">
                          취소 요청 승인
                        </p>
                        <p className="text-[12px] text-gray-500">
                          요청 내용을 확인하셨다면 아래 버튼을 눌러 취소를
                          승인해 주세요.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleApproveClick}
                        disabled={loading}
                        className="inline-flex h-11 min-w-[130px] items-center justify-center rounded-[10px] bg-[#FF2233] px-4 text-[14px] font-semibold leading-[21px] tracking-[-0.2px] text-white shadow-sm hover:bg-[#ff1124] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "승인 중..." : "승인하기"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </main>

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

export default WebView;
