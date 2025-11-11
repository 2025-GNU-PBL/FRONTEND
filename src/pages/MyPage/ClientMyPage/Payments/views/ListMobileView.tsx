import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";
import { useAppSelector } from "../../../../../store/hooks";
import type { UserData, UserRole } from "../../../../../store/userSlice";

/** 백엔드 응답 DTO */
export interface PaymentMeItem {
  orderCode: string; // 결제/주문 식별자
  productName: string; // 상품명
  amount: number; // 결제 금액
  status: string; // READY / PAID / COMPLETED ...
  approvedAt: string; // 결제 승인 일시 (ISO)
  shopName: string; // 업체명
  thumbnail?: string; // 썸네일 URL
}

/** 화면 상태 라벨 */
type PaymentStatus = "예약중" | "예약완료" | "이용완료";

interface PaymentItem {
  id: string; // orderCode 기반
  status: PaymentStatus;
  date: string; // YYYY.MM.DD
  shopName: string;
  productName: string;
  price: number;
  thumbnail?: string;
}

/** accessor 쿼리 객체 */
interface Accessor {
  socialId: string;
  userRole: UserRole;
  owner: boolean;
  customer: boolean;
}

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
      return "이용완료";
    default:
      return "예약중";
  }
}

/** ISO → YYYY.MM.DD */
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
    thumbnail: dto.thumbnail || undefined,
  };
}

/** 개별 카드 */
function PaymentCard({ item }: { item: PaymentItem }) {
  return (
    <div className="w-full">
      <div className="flex">
        <div
          className="w-20 h-20 rounded-[4px] border border-[#F5F5F5] bg-[#F5F5F5] bg-cover bg-center"
          style={
            item.thumbnail
              ? { backgroundImage: `url(${item.thumbnail})` }
              : undefined
          }
        />
        <div className="flex-1 ml-4 flex flex-col justify-between">
          <div>
            <p className="w-full text-[14px] leading-[21px] text-[rgba(0,0,0,0.4)] text-left tracking-[-0.2px]">
              {item.shopName}
            </p>
            <p className="mt-1 w-full text-[14px] leading-[21px] text-[#1E2124] tracking-[-0.2px]">
              {item.productName}
            </p>
          </div>
        </div>
        <div className="ml-2 flex items-end">
          <p className="text-[16px] leading-[26px] font-semibold text-[#1E2124] tracking-[-0.2px]">
            {item.price.toLocaleString()}원
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-[6px]">
        <button
          type="button"
          className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#333333] tracking-[-0.2px]"
          onClick={() => {
            // TODO: 취소 요청 연동 (/api/v1/payments/cancel-request)
          }}
        >
          취소 요청
        </button>
        <button
          type="button"
          className="flex-1 h-10 flex items-center justify-center px-2 border border-[#E4E4E4] rounded-[8px] text-[14px] text-[#333333] tracking-[-0.2px]"
          onClick={() => {
            // TODO: 결제 상세 페이지로 이동
            // e.g. nav(`/mypage/payment/${item.id}`)
          }}
        >
          결제 상세
        </button>
      </div>
    </div>
  );
}

/** 상태별 섹션 */
function PaymentSection({
  status,
  items,
}: {
  status: PaymentStatus;
  items: PaymentItem[];
}) {
  if (items.length === 0) return null;

  const baseDate = items[0]?.date ?? "";

  return (
    <section className="mb-6">
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[18px] leading-[29px] font-semibold text-[#1E2124] tracking-[-0.2px]">
            {status}
          </span>
          {baseDate && (
            <span className="text-[14px] leading-[21px] text-[rgba(0,0,0,0.4)] tracking-[-0.2px]">
              {baseDate}
            </span>
          )}
        </div>
        <button
          type="button"
          className="w-5 h-5 rounded-full border border-[#999999] flex items-center justify-center"
        >
          <Icon
            icon="meteor-icons:xmark"
            className="w-3.5 h-3.5 text-[#999999]"
          />
        </button>
      </div>

      {items.map((item) => (
        <div key={item.id} className="mb-6 last:mb-0">
          <PaymentCard item={item} />
        </div>
      ))}
    </section>
  );
}

/** 고객 마이페이지 결제내역 (Mobile) */
export default function ListMobileView() {
  const nav = useNavigate();

  const { userData, role } = useAppSelector((state) => state.user) as {
    userData: UserData | null;
    role: UserRole | null;
  };

  const [payments, setPayments] = React.useState<PaymentItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const accessor: Accessor | null =
    userData && role
      ? {
          socialId: userData.socialId,
          userRole: role,
          owner: role === "OWNER",
          customer: role === "CUSTOMER",
        }
      : null;

  React.useEffect(() => {
    // CUSTOMER가 아니면 호출 안 함
    if (!accessor || !accessor.customer) {
      setPayments([]);
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<PaymentMeItem[]>("/api/v1/payments/me", {
          params: {
            accessor: JSON.stringify(accessor),
          },
        });

        let mapped = (data || []).map(mapToPaymentItem);

        // 개발 모드 & 실제 데이터가 없을 때: 더미 데이터 주입
        if (mapped.length === 0 && import.meta.env.DEV) {
          mapped = [
            mapToPaymentItem({
              orderCode: "TEST-ORDER-001",
              productName: "[촬영] 신부신랑 헤어메이크업 (부원장)",
              amount: 323000,
              status: "READY",
              approvedAt: "2025-10-14T09:00:00",
              shopName: "제이바이로이스타",
              thumbnail: "/images/sample-payment.png",
            }),
            mapToPaymentItem({
              orderCode: "TEST-ORDER-002",
              productName: "[촬영] 신부신랑 헤어메이크업 (부원장)",
              amount: 323000,
              status: "COMPLETED",
              approvedAt: "2025-10-14T11:00:00",
              shopName: "제이바이로이스타",
              thumbnail: "/images/sample-payment.png",
            }),
          ];
        }

        setPayments(mapped);
      } catch (e) {
        // 에러 시에도 개발모드라면 더미데이터로 UI 확인 가능하게 처리
        if (import.meta.env.DEV) {
          const fallback = [
            mapToPaymentItem({
              orderCode: "DEV-ERROR-ORDER-001",
              productName: "[DEV] 결제 목록 더미 (READY)",
              amount: 111000,
              status: "READY",
              approvedAt: "2025-10-10T10:00:00",
              shopName: "더미 스튜디오",
              thumbnail: "/images/sample-payment.png",
            }),
            mapToPaymentItem({
              orderCode: "DEV-ERROR-ORDER-002",
              productName: "[DEV] 결제 목록 더미 (COMPLETED)",
              amount: 222000,
              status: "COMPLETED",
              approvedAt: "2025-10-11T11:00:00",
              shopName: "더미 스튜디오",
              thumbnail: "/images/sample-payment.png",
            }),
          ];
          setPayments(fallback);
        } else {
          setError(
            "결제 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [accessor?.socialId, accessor?.userRole, accessor?.customer]);

  const reserved = payments.filter(
    (p) => p.status === "예약중" || p.status === "예약완료"
  );
  const completed = payments.filter((p) => p.status === "이용완료");
  const hasPayments = payments.length > 0;
  const isNotCustomer = role && role !== "CUSTOMER";

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-[390px] h-[844px] bg-[#FFFFFF] flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-gray-200">
          <MyPageHeader
            title="결제 내역"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-0">
          <div className="w-[390px] h-2 bg-[#F7F9FA] -mx-5 mb-5" />

          {isNotCustomer && (
            <div className="w-full h-full flex items-center justify-center text-[14px] text-[#777777]">
              고객 전용 페이지입니다.
            </div>
          )}

          {!isNotCustomer && loading && (
            <div className="w-full h-full flex items-center justify-center text-[14px] text-[#777777]">
              결제 내역을 불러오는 중입니다...
            </div>
          )}

          {!isNotCustomer && !loading && error && (
            <div className="w-full h-full flex items-center justify-center text-[14px] text-red-500">
              {error}
            </div>
          )}

          {!isNotCustomer && !loading && !error && hasPayments && (
            <>
              <PaymentSection status="예약중" items={reserved} />

              {reserved.length > 0 && completed.length > 0 && (
                <div className="w-[390px] h-2 bg-[#F7F9FA] -mx-5 my-4" />
              )}

              <PaymentSection status="이용완료" items={completed} />
            </>
          )}

          {!isNotCustomer && !loading && !error && !hasPayments && (
            <div className="w-full h-full flex flex-col items-center justify-center">
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
    </div>
  );
}
