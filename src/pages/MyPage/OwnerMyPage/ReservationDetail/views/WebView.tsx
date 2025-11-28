// src/pages/Customer/Reservation/DetailWebView.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../../../../../lib/api/axios";

/** ====== 유틸: Date -> YYYY-MM-DD ====== */
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** ====== 서버 응답 DTO ====== */
type ReservationDetailApiResponse = {
  id: number;
  ownerId: number;
  customerId: number;
  productId: number;
  status: string; // PENDING / APPROVE / DENY ...
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
  createdAt: string;
};

/** ====== UI용 타입 ====== */
type ReservationDetailStatus = "예약중" | "확정" | "취소";

type ReservationDetail = {
  id: number;
  status: ReservationDetailStatus;
  rawStatus: string;
  date: string; // YYYY.MM.DD
  reservationDateIso: string; // 승인용 기본 날짜 (YYYY-MM-DD)
  productBrand: string;
  productTitle: string;
  price: number;
  thumbnail?: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  requestMessage: string;
  createdAt: string;
};

/** 승인용 Request Body 타입 */
type ReservationApproveRequest = {
  status: "APPROVE";
  reservationStartDate: string; // "YYYY-MM-DD"
  reservationEndDate: string; // "YYYY-MM-DD"
  reservationStartTime: string; // "HH:mm"
  reservationEndTime: string; // "HH:mm"
};

/** 거절용 Request Body 타입 */
type ReservationRejectRequest = {
  status: "DENY";
};

/** 서버 status → 상세 화면 status 매핑 */
function mapDetailStatus(status: string): ReservationDetailStatus {
  const upper = (status || "").toUpperCase();
  if (upper === "DENY") return "취소";
  if (upper === "APPROVE") return "확정";
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

/** API 응답 → UI 타입 매핑 */
function mapApiToUi(data: ReservationDetailApiResponse): ReservationDetail {
  return {
    id: data.id,
    status: mapDetailStatus(data.status),
    rawStatus: data.status,
    date: formatDateDot(data.createdAt),
    reservationDateIso: data.reservationTime,
    productBrand: data.storeName,
    productTitle: data.productName,
    price: data.price,
    thumbnail: data.thumbnail,
    customerName: data.customerName,
    customerPhone: data.customerPhoneNumber,
    customerId: data.customerEmail || String(data.customerId),
    requestMessage: data.content || "",
    createdAt: data.createdAt,
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

/** ====== 메인 컴포넌트 ====== */
export default function WebView() {
  const { reservationId } = useParams<{ reservationId: string }>();

  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 승인용 입력 값 (날짜/시간) */
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  /** 날짜/시간 에러 메시지 상태 */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** accessor 쿼리 파라미터 (GET 전용) */
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

  /** ====== 유효성 검사 ====== */
  const validate = useCallback(() => {
    const next: Record<string, string> = {};

    if (!startDate) next.startDate = "시작 일자를 선택해 주세요.";
    if (!endDate) next.endDate = "종료 일자를 선택해 주세요.";

    // 오늘 날짜(YYYY-MM-DD) 문자열
    const todayStr = toDateInput(new Date());

    // 시작일이 오늘 이전이면 에러
    if (startDate && startDate < todayStr) {
      next.startDate = "시작일은 오늘 이후 날짜만 선택할 수 있습니다.";
    }

    // 종료일이 오늘 이전이면 에러
    if (endDate && endDate < todayStr) {
      next.endDate = "종료일은 오늘 이후 날짜만 선택할 수 있습니다.";
    }

    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);

      if (sd > ed) {
        next.endDate = "종료일은 시작일 이후여야 합니다.";
      }
    }

    if (!startTime || !endTime) {
      next.time = "시작/종료 시간을 모두 선택해 주세요.";
    } else {
      const [sh, sm] = startTime.split(":").map((v) => Number(v));
      const [eh, em] = endTime.split(":").map((v) => Number(v));
      if (
        !Number.isNaN(sh) &&
        !Number.isNaN(sm) &&
        !Number.isNaN(eh) &&
        !Number.isNaN(em)
      ) {
        const startTotal = sh * 60 + sm;
        const endTotal = eh * 60 + em;
        if (startTotal >= endTotal) {
          next.time = "종료 시간은 시작 시간보다 늦게 설정해 주세요.";
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [startDate, endDate, startTime, endTime]);

  /** 상세 조회 */
  useEffect(() => {
    if (!reservationId) {
      setError("예약 ID가 없습니다.");
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<ReservationDetailApiResponse>(
          `/api/v1/reservation/${reservationId}`,
          {
            params: {
              accessor: accessorParam ?? {},
            },
          }
        );

        const ui = mapApiToUi(data);
        setDetail(ui);

        // 승인용 기본값 세팅
        const baseDate = ui.reservationDateIso?.slice(0, 10) || "";
        setStartDate((prev) => prev || baseDate);
        setEndDate((prev) => prev || baseDate);
        setStartTime((prev) => prev || "13:30");
        setEndTime((prev) => prev || "15:00");
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

  /** 거절하기 */
  const handleReject = async () => {
    if (!detail) return;
    if (detail.status !== "예약중") return;

    const ok = window.confirm("해당 예약을 거절하시겠습니까?");
    if (!ok) return;

    try {
      setActionLoading(true);

      const body: ReservationRejectRequest = {
        status: "DENY",
      };

      const { data } = await api.patch<ReservationDetailApiResponse>(
        `/api/v1/reservation/${detail.id}/reject`,
        body
      );

      setDetail(mapApiToUi(data));
      window.alert("예약이 거절되었습니다.");
    } catch (e) {
      console.error("[Reservation/DetailWebView] reject error:", e);
      window.alert("예약 거절 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  /** 승인하기 */
  const handleApprove = async () => {
    if (!detail) return;
    if (detail.status !== "예약중") return;

    // 유효성 검사 먼저 실행 (alert 대신 errors 상태만 세팅)
    const isValid = validate();
    if (!isValid) {
      // 에러가 있으면 그냥 반환, 화면에 빨간 글씨로 표시됨
      return;
    }

    const ok = window.confirm("해당 예약을 승인하시겠습니까?");
    if (!ok) return;

    try {
      setActionLoading(true);

      const body: ReservationApproveRequest = {
        status: "APPROVE",
        reservationStartDate: startDate,
        reservationEndDate: endDate,
        reservationStartTime: startTime,
        reservationEndTime: endTime,
      };

      const { data } = await api.patch<ReservationDetailApiResponse>(
        `/api/v1/reservation/${detail.id}/approve`,
        body
      );

      setDetail(mapApiToUi(data));
      window.alert("예약이 승인되었습니다.");
    } catch (e) {
      console.error("[Reservation/DetailWebView] approve error:", e);
      window.alert("예약 승인 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

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
            {/* 페이지 타이틀 + 상태 */}
            <header className="mt-10 mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#111827]">
                  예약 상세
                </h1>
                <p className="mt-1 text-sm text-[#6B7280] tracking-[-0.2px]">
                  스튜디오 예약 요청 내역을 확인하고 승인/거절할 수 있습니다.
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
                  예약 요청일&nbsp;{detail.date}
                </span>
              </div>
            </header>

            {/* 메인 정보 카드 */}
            <section className="mb-6 rounded-3xl border border-[#E5E7EB] bg-white px-8 py-7 shadow-sm">
              {/* 상품정보 헤더 라인 */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.2px] text-[#111827]">
                    상품정보
                  </h2>
                  <p className="mt-1 text-xs text-[#9CA3AF] tracking-[-0.2px]">
                    예약 상품과 고객 정보를 한눈에 확인할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 상품 + 고객 + 예약시간을 한 카드 안에서 구성 */}
              <div className="space-y-8">
                {/* 상품정보 블록 */}
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
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

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="text-[14px] text-[#9CA3AF] tracking-[-0.2px]">
                      {detail.productBrand}
                    </p>
                    <p className="text-[16px] leading-[24px] tracking-[-0.2px] text-[#111827] break-words">
                      {detail.productTitle}
                    </p>
                    <p className="text-right text-[20px] font-semibold tracking-[-0.3px] text-[#111827]">
                      {formatPrice(detail.price)}
                    </p>
                  </div>
                </div>

                <div className="h-px w-full bg-[#F3F4F6]" />

                {/* 고객정보 + 예약 시간 설정 (내부 2컬럼, 카드 밖은 1장) */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* 고객정보 */}
                  <div className="rounded-2xl bg-[#F9FAFB] px-6 py-5">
                    <h3 className="mb-4 text-[15px] font-semibold tracking-[-0.2px] text-[#111827]">
                      고객정보
                    </h3>
                    <div className="space-y-3 text-[14px]">
                      <InfoRow label="이름" value={detail.customerName} />
                      <InfoRow label="전화번호" value={detail.customerPhone} />
                      <InfoRow label="고객 이메일" value={detail.customerId} />
                    </div>
                  </div>

                  {/* 예약 시간 설정 : 예약중일 때만 노출 */}
                  {detail.status === "예약중" && (
                    <div className="rounded-2xl bg-[#F9FAFB] px-6 py-5">
                      <h3 className="mb-4 text-[15px] font-semibold tracking-[-0.2px] text-[#111827]">
                        예약 시간 설정
                      </h3>

                      <div className="grid gap-3 text-[13px]">
                        <TimeFieldRow label="시작 날짜">
                          <input
                            type="date"
                            className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-right text-[13px] leading-[20px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </TimeFieldRow>

                        <TimeFieldRow label="종료 날짜">
                          <input
                            type="date"
                            className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-right text-[13px] leading-[20px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </TimeFieldRow>

                        {/* 날짜 관련 에러 메시지 */}
                        {(errors.startDate || errors.endDate) && (
                          <p className="col-span-2 mt-1 text-right text-[12px] leading-[18px] text-[#EB5147]">
                            {errors.startDate || errors.endDate}
                          </p>
                        )}

                        <TimeFieldRow label="시작 시간">
                          <input
                            type="time"
                            className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-right text-[13px] leading-[20px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                          />
                        </TimeFieldRow>

                        <TimeFieldRow label="종료 시간">
                          <input
                            type="time"
                            className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-right text-[13px] leading-[20px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                        </TimeFieldRow>

                        {/* 시간 관련 에러 메시지 */}
                        {errors.time && (
                          <p className="col-span-2 mt-1 text-right text-[12px] leading-[18px] text-[#EB5147]">
                            {errors.time}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 요청사항 카드 (아래 넓게) */}
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

            {/* 하단 버튼 카드: 예약중일 때만 노출 */}
            {detail.status === "예약중" && (
              <section className="mb-4 rounded-3xl border border-[#F3F4F6] bg-white px-8 py-5 shadow-sm">
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-xs text-[#9CA3AF] tracking-[-0.2px]">
                    예약 일정을 확인한 뒤 승인 또는 거절을 선택해 주세요.
                  </p>
                  <div className="flex w-full justify-end gap-3 sm:w-auto">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={actionLoading}
                      className={`inline-flex flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] px-5 py-2.5 text-[14px] font-medium text-[#6B7280] transition hover:bg-[#F9FAFB] sm:flex-none sm:min-w-[120px] ${
                        actionLoading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      거절하기
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className={`inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF4646] to-[#FF2233] px-6 py-2.5 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(255,34,51,0.35)] transition hover:brightness-105 sm:flex-none sm:min-w-[120px] ${
                        actionLoading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      승인하기
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/** ====== 서브 컴포넌트 ====== */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[14px] leading-[22px]">
      <span className="text-[#6B7280]">{label}</span>
      <span className="break-words text-right text-[#111827]">
        {value || "-"}
      </span>
    </div>
  );
}

function TimeFieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-3">
      <span className="text-[13px] text-[#6B7280]">{label}</span>
      {children}
    </div>
  );
}
