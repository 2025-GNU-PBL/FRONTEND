import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../../store/hooks";
import type { UserData } from "../../../../../../store/userSlice";
import type { UserRole } from "../../../../../../store/thunkFunctions";
import api from "../../../../../../lib/api/axios";
import MyPageHeader from "../../../../../../components/MyPageHeader";

/* -------------------------------------------------------------------------- */
/*  타입 정의                                                                 */
/* -------------------------------------------------------------------------- */

export interface PaymentMeItem {
  orderCode: string;
  productName: string;
  amount: number;
  status: string;
  approvedAt: string;
  shopName: string;
  paymentKey: string;
  productId: number;
  thumbnailUrl?: string;
}

// 내 리뷰 목록 응답 타입 ( /api/v1/reviews/me )
interface ReviewMeItem {
  id: number;
  customerId: number;
  customerName: string;
  productId: number;
  star: number;
  title: string;
  comment: string;
  imageUrl: string;
  satisfaction: string; // "SATISFIED" | "DISSATISFIED" 등
}

interface ReviewMeResponse {
  content: ReviewMeItem[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

type PaymentStatus = "취소완료" | "취소요청됨" | "결제완료" | "결제실패";

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

  // 이 결제(상품)에 대한 리뷰가 이미 작성되었는지 여부
  isReviewed?: boolean;
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

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}.${m}.${day}`;
}

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

  // 취소요청, 취소완료 둘 다 취소요청 버튼 비노출
  const isCancelable =
    item.status !== "취소요청됨" && item.status !== "취소완료";

  const isCancelRequested = item.status === "취소요청됨";
  const isCanceled = item.status === "취소완료";

  // 리뷰 작성 가능: "결제완료" 상태이면서 아직 리뷰를 안 쓴 경우
  const canWriteReview = item.status === "결제완료" && !item.isReviewed;

  return (
    <div className="w-full relative">
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
        {isCancelable && (
          <button
            type="button"
            className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#333333]"
            onClick={() => onCancelRequest(item)}
          >
            취소 요청
          </button>
        )}

        <button
          type="button"
          className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#333333]"
          onClick={() => nav(`/my-page/client/payments/${item.paymentKey}`)}
        >
          결제 상세
        </button>

        {/* 리뷰 관련 버튼 영역 */}
        {isCancelRequested || isCanceled ? (
          // 취소요청/취소완료 결제건: 리뷰 작성 불가
          <button
            type="button"
            disabled
            className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#BDBDBD] bg-[#F5F5F5] cursor-default"
          >
            작성 불가
          </button>
        ) : canWriteReview ? (
          // 리뷰 작성 가능
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
                  paymentKey: item.paymentKey,
                },
              })
            }
          >
            리뷰 작성
          </button>
        ) : (
          // 이미 리뷰를 작성한 결제의 경우
          <button
            type="button"
            disabled
            className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#BDBDBD] bg-[#F5F5F5] cursor-default"
          >
            작성 완료
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentSection({
  status,
  items,
  onCancelRequest,
}: PaymentSectionProps) {
  if (items.length === 0) return null;

  const baseDate = items[0]?.date ?? "";

  return (
    <section className="mb-6">
      <div className="w-full flex items-center mb-3">
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

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 결제 내역 + 내 리뷰 목록을 함께 불러옴
        const [paymentsRes, reviewsRes] = await Promise.all([
          api.get<PaymentMeItem[]>("/api/v1/payments/me"),
          api.get<ReviewMeResponse>("/api/v1/reviews/me"),
        ]);

        const paymentData = paymentsRes.data || [];
        const reviewData = reviewsRes.data?.content || [];

        // 리뷰가 작성된 productId 집합
        const reviewedProductIdSet = new Set(
          reviewData.map((review) => review.productId)
        );

        // 결제 아이템에 isReviewed 플래그를 붙여서 저장
        const mapped = paymentData.map((dto) => {
          const base = mapToPaymentItem(dto);
          return {
            ...base,
            isReviewed: reviewedProductIdSet.has(dto.productId),
          };
        });

        setPayments(mapped);
      } catch (e) {
        console.log(e);
        setError("결제 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

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

  const sections = [
    { items: cancelRequested, label: "취소요청됨" as PaymentStatus },
    { items: canceled, label: "취소완료" as PaymentStatus },
    { items: completed, label: "결제완료" as PaymentStatus },
    { items: failed, label: "결제실패" as PaymentStatus },
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#FFFFFF] flex flex-col">
      <div className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-gray-200">
        <MyPageHeader
          title="결제 내역"
          onBack={() => nav(-1)}
          showMenu={false}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-15">
        <div className="w-full h-2 bg-[#F7F9FA] -mx-5 mb-5" />

        {isNotCustomer && (
          <div className="w-full mt-10 flex justify-center text-[14px] text-[#777777]">
            고객 전용 페이지입니다.
          </div>
        )}

        {!isNotCustomer && loading && (
          <div className="w-full mt-10 flex justify-center text-[14px] text-[#777777]">
            결제 내역을 불러오는 중입니다...
          </div>
        )}

        {!isNotCustomer && !loading && error && (
          <div className="w-full mt-10 flex justify-center text-[14px] text-red-500">
            {error}
          </div>
        )}

        {!isNotCustomer && !loading && !error && hasPayments && (
          <>
            {sections.map((s, idx) =>
              s.items.length > 0 ? (
                <React.Fragment key={s.label}>
                  {idx > 0 && <div className="w-full h-2 bg-[#F7F9FA] my-5" />}
                  <PaymentSection
                    status={s.label}
                    items={s.items}
                    onCancelRequest={handleGoRefundRequest}
                  />
                </React.Fragment>
              ) : null
            )}
          </>
        )}

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
  );
}
