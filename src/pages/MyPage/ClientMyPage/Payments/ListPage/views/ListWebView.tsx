// src/pages/mypage/customer/payment/ListWebView.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import type { UserRole } from "../../../../../../store/thunkFunctions";
import type { UserData } from "../../../../../../store/userSlice";
import { useAppSelector } from "../../../../../../store/hooks";
import api from "../../../../../../lib/api/axios";
import MyPageHeader from "../../../../../../components/MyPageHeader";

/* -------------------------------------------------------------------------- */
/*  타입 정의                                                                 */
/* -------------------------------------------------------------------------- */

/** /api/v1/payments/me 응답 DTO (shopName, thumbnailUrl 포함) */
export interface PaymentMeItem {
  orderCode: string; // 결제/주문 식별자
  productName: string; // 상품명
  amount: number; // 결제 금액
  status: string; // 결제 상태 (READY, PAID, COMPLETED, ...)
  approvedAt: string; // 결제 승인 일시 (ISO)
  shopName: string; // 업체명
  paymentKey: string; // 결제 키
  productId: number; // 상품 ID

  // 실제 API 응답 필드명 반영
  thumbnailUrl?: string; // 썸네일 URL
}

/** 화면에서 사용하는 상태 라벨 */
type PaymentStatus = "예약중" | "예약완료" | "이용완료";

interface PaymentItem {
  id: string; // orderCode
  status: PaymentStatus;
  date: string; // YYYY.MM.DD
  shopName: string;
  productName: string;
  price: number;
  thumbnail?: string;
  productId: number;
  paymentKey: string;
}

/* -------------------------------------------------------------------------- */
/*  유틸 함수                                                                 */
/* -------------------------------------------------------------------------- */

/** 백엔드 status → 화면 라벨 매핑 (모바일과 동일) */
function mapStatusToLabel(status: string): PaymentStatus {
  switch (status) {
    case "READY":
      return "예약중";
    case "PAID":
      return "예약완료";
    case "COMPLETED":
    case "SUCCESS":
    case "APPROVED":
    case "DONE":
      return "이용완료";
    default:
      return "예약중";
  }
}

/** ISO 날짜 → YYYY.MM.DD (모바일과 동일) */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** API DTO → 화면용 아이템 변환 (모바일과 동일 필드) */
function mapToPaymentItem(dto: PaymentMeItem): PaymentItem {
  return {
    id: dto.orderCode,
    status: mapStatusToLabel(dto.status),
    date: formatDate(dto.approvedAt),
    shopName: dto.shopName,
    productName: dto.productName,
    price: dto.amount,
    thumbnail: dto.thumbnailUrl || undefined,
    productId: dto.productId,
    paymentKey: dto.paymentKey,
  };
}

/* -------------------------------------------------------------------------- */
/*  프레젠테이션 컴포넌트                                                     */
/* -------------------------------------------------------------------------- */

/** 개별 결제 카드 */
function PaymentCard({
  item,
  onCancelRequest,
}: {
  item: PaymentItem;
  onCancelRequest: (item: PaymentItem) => void;
}) {
  const nav = useNavigate();

  return (
    <div className="w-full border border-[#E5E7EB] rounded-xl bg-white px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-[4px] border border-[#F5F5F5] bg-[#F5F5F5] bg-cover bg-center flex-shrink-0"
          style={
            item.thumbnail
              ? { backgroundImage: `url("${item.thumbnail}")` }
              : undefined
          }
        />
        <div className="flex-1 flex flex-col justify-between">
          <p className="text-[13px] leading-[19px] text-[rgba(0,0,0,0.4)] tracking-[-0.2px]">
            {item.shopName}
          </p>
          <p className="mt-1 text-[15px] leading-[22px] text-[#1E2124] tracking-[-0.2px]">
            {item.productName}
          </p>
          <p className="mt-1 text-[12px] text-[#9CA3AF] tracking-[-0.2px]">
            {item.date}
          </p>
        </div>
        <div className="flex flex-col items-end justify-between h-20">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border border-[#E5E7EB] text-[#6B7280]">
            {item.status}
          </span>
          <p className="text-[17px] leading-[26px] font-semibold text-[#1E2124] tracking-[-0.2px]">
            {item.price.toLocaleString()}원
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="px-3 py-2 border border-[#E4E4E4] rounded-lg text-[13px] text-[#333333] tracking-[-0.2px]"
          onClick={() => onCancelRequest(item)}
        >
          취소 요청
        </button>
        <button
          type="button"
          className="px-3 py-2 border border-[#E4E4E4] rounded-lg text-[13px] text-[#333333] tracking-[-0.2px]"
          onClick={() => {
            // 모바일과 동일: paymentKey 기반 상세 페이지
            nav(`/my-page/client/payments/${item.paymentKey}`);
          }}
        >
          결제 상세
        </button>
        <button
          type="button"
          className="px-3 py-2 border border-[#E4E4E4] rounded-lg text-[13px] text-[#333333] tracking-[-0.2px]"
          onClick={() => {
            // 모바일과 동일: state로 리뷰 작성 페이지 이동
            nav("/my-page/client/payments/review", {
              state: {
                productId: item.productId,
                shopName: item.shopName,
                productName: item.productName,
                thumbnailUrl: item.thumbnail,
              },
            });
          }}
        >
          리뷰 작성
        </button>
      </div>
    </div>
  );
}

/** 상태별 섹션 (예약중/예약완료/이용완료) */
function PaymentSection({
  status,
  items,
  onCancelRequest,
}: {
  status: PaymentStatus;
  items: PaymentItem[];
  onCancelRequest: (item: PaymentItem) => void;
}) {
  if (items.length === 0) return null;

  const baseDate = items[0]?.date ?? "";

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[18px] font-semibold text-[#111827] tracking-[-0.2px]">
            {status}
          </h2>
          {baseDate && (
            <span className="text-[13px] text-[rgba(0,0,0,0.45)] tracking-[-0.2px]">
              {baseDate}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <PaymentCard
            key={item.id}
            item={item}
            onCancelRequest={onCancelRequest}
          />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  컨테이너 컴포넌트                                                         */
/* -------------------------------------------------------------------------- */

/** 고객 마이페이지 결제내역 - Web View */
export default function ListWebView() {
  const nav = useNavigate();

  const { role } = useAppSelector((state) => state.user) as {
    userData: UserData | null;
    role: UserRole | null;
  };

  const [payments, setPayments] = React.useState<PaymentItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 취소 요청 모달 관련 상태 (모바일과 동일 로직)
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] =
    React.useState<PaymentItem | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // 모바일과 동일: CUSTOMER가 아니면 호출 안 함
    if (!role || role !== "CUSTOMER") {
      setPayments([]);
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<PaymentMeItem[]>("/api/v1/payments/me");

        const mapped = (data || []).map(mapToPaymentItem);
        setPayments(mapped);
      } catch (e) {
        console.log(e);
        setError("결제 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [role]);

  const reserved = payments.filter(
    (p) => p.status === "예약중" || p.status === "예약완료"
  );
  const completed = payments.filter((p) => p.status === "이용완료");
  const hasPayments = payments.length > 0;
  const isNotCustomer = role && role !== "CUSTOMER";

  // 취소 요청 버튼 클릭 → 모달 열기 (모바일과 동일)
  const handleOpenCancelModal = (item: PaymentItem) => {
    setSelectedPayment(item);
    setCancelReason("");
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    if (cancelLoading) return;
    setCancelModalOpen(false);
    setSelectedPayment(null);
    setCancelReason("");
    setCancelError(null);
  };

  // 취소 요청 API 호출 (모바일과 동일)
  const handleSubmitCancel = async () => {
    if (!selectedPayment) return;

    if (!cancelReason.trim()) {
      setCancelError("취소 사유를 입력해주세요.");
      return;
    }

    try {
      setCancelLoading(true);
      setCancelError(null);

      await api.post("/api/v1/payments/cancel-request", {
        paymentKey: selectedPayment.paymentKey,
        cancelReason: cancelReason.trim(),
      });

      window.alert("취소 요청이 접수되었습니다.");

      // 필요 시: 결제 목록 재조회 가능 (모바일과 동일 주석)
      // const { data } = await api.get<PaymentMeItem[]>("/api/v1/payments/me");
      // setPayments((data || []).map(mapToPaymentItem));

      setCancelModalOpen(false);
      setSelectedPayment(null);
      setCancelReason("");
    } catch (e) {
      console.log(e);
      setCancelError("취소 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="mt-15 w-full min-h-screen bg-[#F6F7FB] relative">
      {/* 본문 */}
      <div className="max-w-[1040px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">
            결제 내역을 확인하세요
          </h1>
          <p className="mt-1 text-[13px] text-[#6B7280] tracking-[-0.2px]">
            최근 결제하신 상품과 이용 완료 내역을 한눈에 확인할 수 있어요.
          </p>
        </div>

        {isNotCustomer && (
          <div className="flex items-center justify-center h-[240px] rounded-2xl bg-white border border-[#E5E7EB]">
            <p className="text-[14px] text-[#6B7280]">
              고객 전용 페이지입니다. 고객 계정으로 로그인해주세요.
            </p>
          </div>
        )}

        {!isNotCustomer && loading && (
          <div className="flex items-center justify-center h-[240px] rounded-2xl bg-white border border-[#E5E7EB]">
            <p className="text-[14px] text-[#6B7280]">
              결제 내역을 불러오는 중입니다...
            </p>
          </div>
        )}

        {!isNotCustomer && !loading && error && (
          <div className="flex items-center justify-center h-[240px] rounded-2xl bg-white border border-red-200">
            <p className="text-[14px] text-red-500">{error}</p>
          </div>
        )}

        {!isNotCustomer && !loading && !error && hasPayments && (
          <>
            <PaymentSection
              status="예약중"
              items={reserved}
              onCancelRequest={handleOpenCancelModal}
            />

            {reserved.length > 0 && completed.length > 0 && (
              <div className="h-[1px] bg-[#E5E7EB] my-6" />
            )}

            <PaymentSection
              status="이용완료"
              items={completed}
              onCancelRequest={handleOpenCancelModal}
            />
          </>
        )}

        {!isNotCustomer && !loading && !error && !hasPayments && (
          <div className="flex flex-col items-center justify-center h-[260px] rounded-2xl bg-white border border-[#E5E7EB]">
            <Icon
              icon="mdi:file-document-outline"
              className="w-14 h-14 mb-3 text-[#D9D9D9]"
            />
            <p className="text-[14px] text-[#777777] tracking-[-0.2px]">
              결제 내역이 없어요
            </p>
          </div>
        )}
      </div>

      {/* 취소 요청 모달 (모바일 로직 그대로, 웹 전역 오버레이) */}
      {cancelModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-30 bg-[rgba(0,0,0,0.45)] flex items-center justify-center px-5">
          <div className="w-full max-w-[480px] rounded-[24px] bg-white px-5 pt-5 pb-4 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-[14px] text-[rgba(0,0,0,0.45)] mb-0.5">
                  예약 결제 취소
                </span>
                <span className="text-[18px] font-semibold text-[#1E2124]">
                  취소 사유를 알려주세요
                </span>
              </div>
            </div>

            {/* 결제 정보 카드 */}
            <div className="mb-4 rounded-[12px] border border-[#F0F0F0] bg-[#F9FAFB] px-3 py-2.5 flex">
              <div
                className="w-[52px] h-[52px] rounded-[6px] bg-[#F0F0F0] bg-cover bg-center border border-[#F2F2F2] mr-3 flex-shrink-0"
                style={
                  selectedPayment.thumbnail
                    ? {
                        backgroundImage: `url("${selectedPayment.thumbnail}")`,
                      }
                    : undefined
                }
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[rgba(0,0,0,0.45)] truncate mb-0.5">
                  {selectedPayment.shopName}
                </p>
                <p className="text-[14px] font-medium text-[#1E2124] line-clamp-2 mb-1">
                  {selectedPayment.productName}
                </p>
                <p className="text-[13px] text-[#333333] font-semibold">
                  {selectedPayment.price.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 안내 문구 */}
            <p className="text-[13px] leading-[19px] text-[rgba(0,0,0,0.6)] mb-2">
              취소 요청 사유를 작성해 주세요.
              <br />
              매장 검토 후 승인 여부가 확정됩니다.
            </p>

            {/* 취소 사유 입력 */}
            <div className="mb-2">
              <div className="relative">
                <textarea
                  className="w-full h-32 rounded-[12px] border border-[#E4E4E4] bg-[#FFFFFF] px-3.5 py-2.5 text-[13px] text-[#1E2124] resize-none outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                  placeholder="예) 일정이 변경되어 방문이 어려워 취소가 필요합니다."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength={300}
                  disabled={cancelLoading}
                />
                <div className="pointer-events-none absolute bottom-1.5 right-2.5 text-[11px] text-[rgba(0,0,0,0.35)]">
                  {cancelReason.length} / 300
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {cancelError && (
              <div className="mb-2 text-[12px] text-red-500">{cancelError}</div>
            )}

            {/* 버튼 영역 */}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="flex-1 h-11 rounded-[10px] border border-[#E4E4E4] text-[14px] text-[#555555] flex items-center justify-center"
                onClick={handleCloseCancelModal}
                disabled={cancelLoading}
              >
                닫기
              </button>
              <button
                type="button"
                className={`flex-1 h-11 rounded-[10px] text-[14px] font-semibold flex items-center justify-center ${
                  cancelLoading
                    ? "bg-[#D0D3DA] text-white"
                    : "bg-[#111111] text-white"
                }`}
                onClick={handleSubmitCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? "요청 중..." : "취소 요청 보내기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
