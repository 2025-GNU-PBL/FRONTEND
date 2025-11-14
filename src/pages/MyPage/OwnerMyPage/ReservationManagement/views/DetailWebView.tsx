// src/pages/Customer/Reservation/DetailWebView.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../../../lib/api/axios";

/** ====== 서버 응답 DTO (Swagger 기준) ====== */
type ReservationDetailApiResponse = {
  id: number;
  ownerId: number;
  customerId: number;
  productId: number;
  status: string; // WAITING / APPROVE / CANCEL ...
  reservationTime: string; // "2025-11-14"
  storeName: string;
  productName: string;
  price: number;
  customerName: string;
  customerPhoneNumber: string;
  customerEmail: string;
  title: string;
  content: string;
};

/** ====== UI용 타입 ====== */
type ReservationDetailStatus = "예약중" | "확정" | "취소";

type ReservationDetail = {
  id: number;
  status: ReservationDetailStatus;
  date: string; // YYYY.MM.DD
  productBrand: string;
  productTitle: string;
  price: number;
  thumbnailUrl?: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  requestMessage: string;
};

/** 서버 status → 상세 화면 status 매핑 */
function mapDetailStatus(status: string): ReservationDetailStatus {
  const upper = (status || "").toUpperCase();
  if (upper === "CANCEL" || upper === "CANCELED") return "취소";
  if (
    upper === "APPROVE" ||
    upper === "APPROVED" ||
    upper === "CONFIRM" ||
    upper === "CONFIRMED"
  )
    return "확정";
  // 나머지는 전부 예약 진행 중으로 처리
  return "예약중";
}

/** ISO 날짜 → YYYY.MM.DD */
function formatDateDot(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** ====== 컴포넌트 ====== */
export default function DetailWebView() {
  const { reservationId } = useParams<{ reservationId: string }>();

  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** accessor 쿼리 파라미터 */
  const accessorParam = useMemo(() => {
    try {
      const raw = localStorage.getItem("accessor");
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, []);

  /** 상세 조회 API 호출 */
  useEffect(() => {
    if (!reservationId) {
      setError("예약 ID가 없습니다.");
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = {
          params: {
            accessor: accessorParam ?? {},
          },
        };

        const { data } = await api.get<ReservationDetailApiResponse>(
          `/api/v1/reservation/${reservationId}`,
          config
        );

        const ui: ReservationDetail = {
          id: data.id,
          status: mapDetailStatus(data.status),
          date: formatDateDot(data.reservationTime),
          productBrand: data.storeName,
          productTitle: data.productName,
          price: data.price,
          thumbnailUrl: undefined, // swagger에 이미지 필드 없어서 비워둠
          customerName: data.customerName,
          customerPhone: data.customerPhoneNumber,
          customerId: data.customerEmail || String(data.customerId),
          requestMessage: data.content || "",
        };

        setDetail(ui);
      } catch (e) {
        console.error("[Reservation/DetailWebView] fetchDetail error:", e);
        setError("예약 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reservationId, accessorParam]);

  /** 가격 포맷 */
  const formatPrice = (n: number) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB]">
      {/* 글로벌 헤더는 레이아웃에서 렌더된다고 가정하고, 여기서는 본문만 */}
      <div className="max-w-[1040px] mx-auto px-6 pt-25 pb-24">
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm py-16 px-8 text-center text-[14px] text-[#6B7280]">
            예약 상세 정보를 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm py-16 px-8 text-center text-[14px] text-[#EB5147] whitespace-pre-line">
            {error}
          </div>
        ) : !detail ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm py-16 px-8 text-center text-[14px] text-[#6B7280]">
            예약 정보를 찾을 수 없습니다.
          </div>
        ) : (
          <div className="space-y-10">
            {/* 상품정보 카드 - 폭 전체 사용 */}
            <section className="bg-white rounded-[18px] border border-[#F3F4F5] shadow-sm px-10 py-8">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-[18px] font-semibold text-[#1E2124] tracking-[-0.2px]">
                  상품정보
                </h2>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[13px] text-[#999999]">
                    {detail.date}
                  </span>
                  <span className="text-[13px] text-[#FF2233] font-semibold">
                    {detail.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* 썸네일 자리 */}
                <div className="w-[96px] h-[96px] rounded-[10px] bg-[#F6F7FB] border border-[#F3F4F5] flex-shrink-0 overflow-hidden">
                  {detail.thumbnailUrl ? (
                    <img
                      src={detail.thumbnailUrl}
                      alt={detail.productTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                <div className="flex-1 flex items-center justify-between gap-6 min-w-0">
                  <div className="min-w-0">
                    <div className="text-[14px] text-[#999999] tracking-[-0.2px]">
                      {detail.productBrand}
                    </div>
                    <div className="mt-1 text-[15px] text-[#1E2124] tracking-[-0.2px] leading-[22px] break-words">
                      {detail.productTitle}
                    </div>
                  </div>
                  <div className="text-[18px] font-semibold text-[#1E2124] whitespace-nowrap">
                    {formatPrice(detail.price)}
                  </div>
                </div>
              </div>
            </section>

            {/* 고객정보 카드 */}
            <section className="bg-white rounded-[18px] border border-[#F3F4F5] shadow-sm px-10 py-8">
              <h2 className="text-[18px] font-semibold text-[#1E2124] tracking-[-0.2px] mb-6">
                고객정보
              </h2>

              <div className="space-y-4 text-[14px]">
                <InfoRow label="이름" value={detail.customerName} />
                <InfoRow label="전화번호" value={detail.customerPhone} />
                <InfoRow label="고객 ID" value={detail.customerId} />
              </div>
            </section>

            {/* 요청사항 카드 */}
            <section className="bg-white rounded-[18px] border border-[#F3F4F5] shadow-sm px-10 py-8">
              <h2 className="text-[18px] font-semibold text-[#1E2124] tracking-[-0.2px] mb-6">
                요청사항
              </h2>
              <div className="bg-[#F8F8F8] rounded-[12px] px-6 py-5 min-h-[80px] flex items-center">
                <p className="text-[14px] leading-[22px] text-[#1E2124] tracking-[-0.2px] whitespace-pre-line">
                  {detail.requestMessage}
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

/** ====== 서브 컴포넌트 ====== */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[14px] leading-[22px]">
      <span className="text-[#777777]">{label}</span>
      <span className="text-[#1E2124] text-right break-words">
        {value || "-"}
      </span>
    </div>
  );
}
