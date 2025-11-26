// src/pages/Customer/Reservation/DetailWebView.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../../../lib/api/axios";

/** ====== 서버 응답 DTO  ====== */
type ReservationDetailApiResponse = {
  id: number;
  ownerId: number;
  customerId: number;
  productId: number;
  status: string; // PENDING / APPROVE / DENY...
  reservationTime: string; // "2025-11-14"
  storeName: string;
  productName: string;
  price: number;
  customerName: string;
  customerPhoneNumber: string;
  customerEmail: string;
  title: string;
  content: string;
  thumbnail: string;
};

/** ====== UI용 타입 ====== */
type ReservationDetailStatus = "예약중" | "확정" | "취소";

type ReservationDetail = {
  id: number;
  status: ReservationDetailStatus;
  rawStatus: string; // 서버에서 내려온 원본 status
  date: string; // YYYY.MM.DD
  reservationDateIso: string; // "2025-11-14"
  productBrand: string;
  productTitle: string;
  price: number;
  thumbnail?: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  requestMessage: string;
};

/** 서버 status → 상세 화면 status 매핑 */
function mapDetailStatus(status: string): ReservationDetailStatus {
  const upper = (status || "").toUpperCase();
  if (upper === "DENY") return "취소";
  if (upper === "APPROVE") return "확정";
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

/** API 응답 → UI 타입 매핑 */
function mapApiToUi(data: ReservationDetailApiResponse): ReservationDetail {
  return {
    id: data.id,
    status: mapDetailStatus(data.status),
    rawStatus: data.status,
    date: formatDateDot(data.reservationTime),
    reservationDateIso: data.reservationTime,
    productBrand: data.storeName,
    productTitle: data.productName,
    price: data.price,
    thumbnail: data.thumbnail,
    customerName: data.customerName,
    customerPhone: data.customerPhoneNumber,
    customerId: data.customerEmail || String(data.customerId),
    requestMessage: data.content || "",
  };
}

/** 상태 뱃지 스타일 */
function getStatusBadgeClasses(status: ReservationDetailStatus) {
  if (status === "확정") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }
  if (status === "취소") {
    return "bg-red-50 text-red-600 border border-red-100";
  }
  return "bg-gray-50 text-gray-700 border border-gray-200";
}

/** 가격 포맷 */
const formatPrice = (n: number) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

/** ====== 메인 컴포넌트 ====== */
export default function DetailWebView() {
  // 모바일과 동일하게 inquiryId 파라미터 사용
  const params = useParams<{
    inquiryId?: string;
  }>();

  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** accessor 쿼리 파라미터 (GET 전용, 모바일과 동일 로직) */
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

  /** 상세 조회 */
  useEffect(() => {
    if (!params.inquiryId) {
      setError("예약 ID가 없습니다.");
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<ReservationDetailApiResponse>(
          `/api/v1/reservation/${params.inquiryId}`,
          {
            params: {
              accessor: accessorParam ?? {},
            },
          }
        );

        const ui = mapApiToUi(data);
        setDetail(ui);
      } catch (e) {
        console.error("[Reservation/DetailWebView] fetchDetail error:", e);
        setError("예약 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [params.inquiryId, accessorParam]);

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB]">
      {/* 상단 얇은 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="mx-auto max-w-[1120px] px-6 lg:px-10 py-10 lg:py-14">
        {loading ? (
          <div className="rounded-3xl border border-[#E5E7EB] bg-white py-16 px-10 text-center text-[14px] text-[#6B7280] shadow-sm">
            예약 상세 정보를 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-[#E5E7EB] bg-white py-16 px-10 text-center text-[14px] text-[#EB5147] shadow-sm whitespace-pre-line">
            {error}
          </div>
        ) : !detail ? (
          <div className="rounded-3xl border border-[#E5E7EB] bg-white py-16 px-10 text-center text-[14px] text-[#6B7280] shadow-sm">
            예약 정보를 찾을 수 없습니다.
          </div>
        ) : (
          <>
            {/* ====== 상단 타이틀 + 상태/날짜 ====== */}
            <header className="mt-10 mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#111827]">
                  예약 상세
                </h1>
                <p className="mt-1 text-sm text-[#6B7280] tracking-[-0.2px]">
                  예약 내역을 확인할 수 있어요.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 font-medium",
                    getStatusBadgeClasses(detail.status),
                  ].join(" ")}
                >
                  {detail.status}
                </span>
                <span className="text-[#9CA3AF]">
                  예약일&nbsp;{detail.date}
                </span>
              </div>
            </header>

            {/* ====== 상품정보 카드 ====== */}
            <section className="mb-6 rounded-3xl border border-[#E5E7EB] bg-white px-8 py-7 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.2px] text-[#111827]">
                    상품정보
                  </h2>
                  <p className="mt-1 text-xs text-[#9CA3AF] tracking-[-0.2px]">
                    예약한 상품 정보를 확인할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                {/* 썸네일 */}
                <div className="flex h-[110px] w-[110px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[#F3F4F6] bg-[#F9FAFB]">
                  {detail.thumbnail ? (
                    <img
                      src={detail.thumbnail}
                      alt={detail.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>

                {/* 텍스트 영역 */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p className="text-[14px] text-[#9CA3AF] tracking-[-0.2px]">
                    {detail.productBrand}
                  </p>
                  <p className="text-[16px] leading-[24px] tracking-[-0.2px] text-[#111827] break-words">
                    {detail.productTitle}
                  </p>
                  <p className="mt-2 text-right text-[20px] font-semibold tracking-[-0.3px] text-[#111827]">
                    {formatPrice(detail.price)}
                  </p>
                </div>
              </div>
            </section>

            {/* ====== 요청사항 카드 ====== */}
            <section className="mb-8 rounded-3xl border border-[#E5E7EB] bg-white px-8 py-7 shadow-sm">
              <h2 className="mb-4 text-[16px] font-semibold tracking-[-0.2px] text-[#111827]">
                요청사항
              </h2>
              <div className="min-h-[120px] rounded-2xl bg-[#F9FAFB] px-6 py-5">
                <p className="whitespace-pre-line text-[14px] leading-[22px] tracking-[-0.2px] text-[#111827]">
                  {detail.requestMessage || "요청사항이 없습니다."}
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
