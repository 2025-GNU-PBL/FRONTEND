import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import type { UserRole } from "../../../../../../store/thunkFunctions";
import type { UserData } from "../../../../../../store/userSlice";
import { useAppSelector } from "../../../../../../store/hooks";
import api from "../../../../../../lib/api/axios";

/* -------------------------------------------------------------------------- */
/*  타입 정의                                                                 */
/* -------------------------------------------------------------------------- */

/** /api/v1/payments/me 응답 DTO (shopName, thumbnailUrl 포함) */
export interface PaymentMeItem {
  orderCode: string; // 결제/주문 식별자
  productName: string; // 상품명
  amount: number; // 결제 금액
  status: string; // "CANCELED" | "CANCEL_REQUESTED" | "DONE" | "FAILED" ...
  approvedAt: string; // 결제 승인 일시 (ISO)
  shopName: string; // 업체명
  paymentKey: string; // 결제 키
  productId: number; // 상품 ID

  // 실제 API 응답 필드명 반영
  thumbnailUrl?: string; // 썸네일 URL
}

type PaymentStatus = "취소완료" | "취소요청됨" | "결제완료" | "결제실패";

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
    case "CANCELED":
      return "취소완료";
    case "CANCEL_REQUESTED":
      return "취소요청됨";
    case "DONE":
      return "결제완료";
    case "FAILED":
    default:
      return "결제실패";
  }
}

/** ISO 날짜 → YYYY.MM.DD  */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** API DTO → 화면용 아이템 변환 */
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

  const isCancelable = item.status !== "취소요청됨";

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
        {isCancelable && (
          <button
            type="button"
            className="px-3 py-2 border border-[#E4E4E4] rounded-lg text-[13px] text-[#333333] tracking-[-0.2px]"
            onClick={() => onCancelRequest(item)}
          >
            취소 요청
          </button>
        )}
        <button
          type="button"
          className="px-3 py-2 border border-[#E4E4E4] rounded-lg text-[13px] text-[#333333] tracking-[-0.2px]"
          onClick={() => {
            nav(`/my-page/client/payments/${item.paymentKey}`);
          }}
        >
          결제 상세
        </button>
        <button
          type="button"
          className="px-3 py-2 border border-[#E4E4E4] rounded-lg text-[13px] text-[#333333] tracking-[-0.2px]"
          onClick={() => {
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

/** 상태별 섹션 */
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

/** 고객 마이페이지 결제내역  */
export default function ListWebView() {
  const nav = useNavigate();

  const { role } = useAppSelector((state) => state.user) as {
    userData: UserData | null;
    role: UserRole | null;
  };

  const [payments, setPayments] = React.useState<PaymentItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // CUSTOMER가 아니면 호출 안 함
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
  const cancelRequested = payments.filter((p) => p.status === "취소요청됨");
  const completed = payments.filter((p) => p.status === "결제완료");
  const failed = payments.filter((p) => p.status === "결제실패");

  const hasPayments = payments.length > 0;
  const isNotCustomer = role && role !== "CUSTOMER";

  const handleGoRefundRequest = (item: PaymentItem) => {
    nav(`/my-page/client/payments/refund/${item.paymentKey}`, {
      state: {
        paymentKey: item.paymentKey,
        shopName: item.shopName,
        productName: item.productName,
        amount: item.price,
        thumbnailUrl: item.thumbnail,
      },
    });
  };

  return (
    <div className="mt-15 w-full min-h-screen bg-[#F6F7FB] relative">
      {/* 본문 */}
      <div className="max-w-[1040px] mx-auto px-6 py-6">
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
            {cancelRequested.length > 0 && (
              <PaymentSection
                status="취소요청됨"
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
    </div>
  );
}
