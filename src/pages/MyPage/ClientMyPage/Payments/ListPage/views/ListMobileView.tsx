// src/pages/Customer/Payments/ListMobileView.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAppSelector } from "../../../../../../store/hooks";
import type { UserData } from "../../../../../../store/userSlice";
import type { UserRole } from "../../../../../../store/thunkFunctions";
import api from "../../../../../../lib/api/axios";
import MyPageHeader from "../../../../../../components/MyPageHeader";

/* -------------------------------------------------------------------------- */
/*  타입 정의                                                                 */
/* -------------------------------------------------------------------------- */

/** 백엔드 응답 DTO */
export interface PaymentMeItem {
  orderCode: string;
  productName: string;
  amount: number;
  status: string; // "CANCELED" | "CANCEL_REQUESTED" | "DONE" | "FAILED" ...
  approvedAt: string;
  shopName: string;
  paymentKey: string;
  productId: number;

  // 실제 API 응답 필드명 반영
  thumbnailUrl?: string;
}

/** 화면 상태 라벨 */
type PaymentStatus = "취소완료" | "취소요청" | "결제완료" | "결제실패";

interface PaymentItem {
  id: string;
  status: PaymentStatus;
  date: string;
  shopName: string;
  productName: string;
  price: number;
  thumbnail?: string;
  productId: number;
  paymentKey: string;
}

interface PaymentCardProps {
  item: PaymentItem;
  onCancelRequest: (item: PaymentItem) => void;
}

interface PaymentSectionProps {
  status: PaymentStatus;
  items: PaymentItem[];
  onCancelRequest: (item: PaymentItem) => void;
}

/* -------------------------------------------------------------------------- */
/*  유틸 함수                                                                 */
/* -------------------------------------------------------------------------- */

/** 백엔드 status → 화면 라벨 */
function mapStatusToLabel(status: string): PaymentStatus {
  switch (status) {
    case "CANCELED":
      return "취소완료";
    case "CANCEL_REQUESTED":
      return "취소요청";
    case "DONE":
      return "결제완료";
    case "FAILED":
    default:
      return "결제실패";
  }
}

/** YYYY.MM.DD 포맷 */
function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}.${m}.${day}`;
}

/** DTO → 화면 아이템 */
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

function PaymentCard({ item, onCancelRequest }: PaymentCardProps) {
  const nav = useNavigate();

  return (
    <div className="w-full">
      <div className="flex">
        <div
          className="w-20 h-20 rounded-[4px] border border-[#F5F5F5] bg-[#F5F5F5] bg-cover bg-center"
          style={
            item.thumbnail
              ? {
                  backgroundImage: `url("${item.thumbnail}")`,
                }
              : undefined
          }
        />
        <div className="flex-1 ml-4 flex flex-col justify-between">
          <div>
            <p className="w-full text-[14px] leading-[21px] text-[rgba(0,0,0,0.4)]">
              {item.shopName}
            </p>
            <p className="mt-1 w-full text-[14px] leading-[21px] text-[#1E2124]">
              {item.productName}
            </p>
          </div>
        </div>
        <div className="ml-2 flex items-end">
          <p className="text-[16px] leading-[26px] font-semibold text-[#1E2124]">
            {item.price.toLocaleString()}원
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-[6px]">
        {/* 취소 요청 → 환불 요청 페이지로 이동 */}
        <button
          type="button"
          className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#333333]"
          onClick={() => onCancelRequest(item)}
        >
          취소 요청
        </button>

        <button
          type="button"
          className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#333333]"
          onClick={() => nav(`/my-page/client/payments/${item.paymentKey}`)}
        >
          결제 상세
        </button>

        <button
          type="button"
          className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#333333]"
          onClick={() =>
            nav("/my-page/client/payments/review", {
              state: {
                productId: item.productId,
                shopName: item.shopName,
                productName: item.productName,
                thumbnailUrl: item.thumbnail,
              },
            })
          }
        >
          리뷰 작성
        </button>
      </div>
    </div>
  );
}

/** 상태별 섹션 */
function PaymentSection({
  status,
  items,
  onCancelRequest,
}: PaymentSectionProps) {
  if (items.length === 0) return null;

  const baseDate = items[0]?.date ?? "";

  return (
    <section className="mb-6">
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[18px] leading-[29px] font-semibold text-[#1E2124]">
            {status}
          </span>
          {baseDate && (
            <span className="text-[14px] leading-[21px] text-[rgba(0,0,0,0.4)]">
              {baseDate}
            </span>
          )}
        </div>
        <button
          type="button"
          className="w-5 h-5 rounded-full flex items-center justify-center"
        >
          <Icon icon="meteor-icons:xmark" className="w-5 h-5 text-[#999999]" />
        </button>
      </div>

      {items.map((item) => (
        <div key={item.id} className="mb-6 last:mb-0">
          <PaymentCard item={item} onCancelRequest={onCancelRequest} />
        </div>
      ))}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  컨테이너 컴포넌트                                                         */
/* -------------------------------------------------------------------------- */

export default function ListMobileView() {
  const nav = useNavigate();

  const { role } = useAppSelector((state) => state.user) as {
    userData: UserData | null;
    role: UserRole | null;
  };

  const [payments, setPayments] = React.useState<PaymentItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
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

  // 상태별 분류
  const canceled = payments.filter((p) => p.status === "취소완료");
  const cancelRequested = payments.filter((p) => p.status === "취소요청");
  const completed = payments.filter((p) => p.status === "결제완료");
  const failed = payments.filter((p) => p.status === "결제실패");

  const hasPayments = payments.length > 0;
  const isNotCustomer = role && role !== "CUSTOMER";

  /* 취소 요청 버튼 클릭 → 환불 요청 페이지로 이동 */
  const handleGoRefundRequest = (item: PaymentItem) => {
    nav(`/my-page/client/payments/refund/${item.paymentKey}`, {
      state: {
        paymentKey: item.paymentKey,
        shopName: item.shopName,
        productName: item.productName,
        amount: item.price,
        thumbnailUrl: item.thumbnail,
        // 필요하면 쿠폰/환불 예상 금액/수단 등 추가
      },
    });
  };

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-[390px] h-[844px] bg-[#FFFFFF] flex flex-col relative">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-gray-200">
          <MyPageHeader
            title="결제 내역"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 pt-8 pb-0">
          <div className="w-[390px] h-2 bg-[#F7F9FA] -mx-5 mb-5" />

          {/* 고객이 아닌 경우 */}
          {isNotCustomer && (
            <div className="w-full mt-10 flex justify-center text-[14px] text-[#777777]">
              고객 전용 페이지입니다.
            </div>
          )}

          {/* 로딩 */}
          {!isNotCustomer && loading && (
            <div className="w-full mt-10 flex justify-center text-[14px] text-[#777777]">
              결제 내역을 불러오는 중입니다...
            </div>
          )}

          {/* 에러 */}
          {!isNotCustomer && !loading && error && (
            <div className="w-full mt-10 flex justify-center text-[14px] text-red-500">
              {error}
            </div>
          )}

          {/* 데이터 있을 때 */}
          {!isNotCustomer && !loading && !error && hasPayments && (
            <>
              {cancelRequested.length > 0 && (
                <PaymentSection
                  status="취소요청"
                  items={cancelRequested}
                  onCancelRequest={handleGoRefundRequest}
                />
              )}

              {canceled.length > 0 && (
                <PaymentSection
                  status="취소완료"
                  items={canceled}
                  onCancelRequest={handleGoRefundRequest}
                />
              )}

              {completed.length > 0 && (
                <PaymentSection
                  status="결제완료"
                  items={completed}
                  onCancelRequest={handleGoRefundRequest}
                />
              )}

              {failed.length > 0 && (
                <PaymentSection
                  status="결제실패"
                  items={failed}
                  onCancelRequest={handleGoRefundRequest}
                />
              )}
            </>
          )}

          {/* 데이터 없을 때 */}
          {!isNotCustomer && !loading && !error && !hasPayments && (
            <div className="w-full flex flex-col items-center mt-70">
              <img
                src="/images/document.png"
                className="w-20 h-20 mb-3 text-[#D9D9D9]"
              />
              <p className="text-[18px] font-semibold text-[#333333]">
                결제 내역이 없어요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
