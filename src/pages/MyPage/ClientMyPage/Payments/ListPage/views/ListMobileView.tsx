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
  status: string;
  approvedAt: string;
  shopName: string;
  paymentKey: string;
  productId: number;

  // 실제 API 응답 필드명 반영
  thumbnailUrl?: string;
}

/** 화면 상태 라벨 */
type PaymentStatus = "예약중" | "예약완료" | "이용완료";

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

/** status → 라벨 */
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

  // 취소 요청 모달 관련 상태
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] =
    React.useState<PaymentItem | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

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

  const reserved = payments.filter(
    (p) => p.status === "예약중" || p.status === "예약완료"
  );
  const completed = payments.filter((p) => p.status === "이용완료");
  const hasPayments = payments.length > 0;
  const isNotCustomer = role && role !== "CUSTOMER";

  // 취소 요청 버튼 클릭 → 모달 열기
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

  // 취소 요청 API 호출
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

      // 필요 시: 결제 목록 재조회도 가능
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
              <PaymentSection
                status="예약중"
                items={reserved}
                onCancelRequest={handleOpenCancelModal}
              />

              {reserved.length > 0 && completed.length > 0 && (
                <div className="w-[390px] h-2 bg-[#F7F9FA] -mx-5 my-4" />
              )}

              <PaymentSection
                status="이용완료"
                items={completed}
                onCancelRequest={handleOpenCancelModal}
              />
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

        {/* 취소 요청 모달 - 중앙 정렬 */}
        {cancelModalOpen && selectedPayment && (
          <div className="absolute inset-0 z-30 bg-[rgba(0,0,0,0.45)] flex items-center justify-center px-5">
            <div className="w-full max-w-[390px] rounded-[24px] bg-white px-5 pt-5 pb-4 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
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
                <div className="mb-2 text-[12px] text-red-500">
                  {cancelError}
                </div>
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
    </div>
  );
}
