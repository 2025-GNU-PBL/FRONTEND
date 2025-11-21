import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";

/** ====== 서버 응답 DTO  ====== */
type ReservationDetailApiResponse = {
  id: number;
  ownerId: number;
  customerId: number;
  productId: number;
  status: string; // PENDING / APPROVE / DENY...
  reservationTime: string; // "2025-11-14" (기본 예약 날짜)
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
  rawStatus: string; // 서버에서 내려온 원본 status
  date: string; // YYYY.MM.DD (상단에 표기용)
  reservationDateIso: string; // "2025-11-14" (승인용 기본 날짜)
  productBrand: string;
  productTitle: string;
  price: number;
  thumbnailUrl?: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  requestMessage: string;
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
    date: formatDateDot(data.reservationTime),
    reservationDateIso: data.reservationTime, // 승인용 기본 날짜
    productBrand: data.storeName,
    productTitle: data.productName,
    price: data.price,
    thumbnailUrl: undefined,
    customerName: data.customerName,
    customerPhone: data.customerPhoneNumber,
    customerId: data.customerEmail || String(data.customerId),
    requestMessage: data.content || "",
  };
}

/** ====== 컴포넌트 ====== */
export default function DetailMobileView() {
  const nav = useNavigate();
  const { reservationId } = useParams<{ reservationId: string }>();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false); // 상세 조회 로딩
  const [actionLoading, setActionLoading] = useState(false); // 승인/거절 로딩
  const [error, setError] = useState<string | null>(null);

  /** 승인용 입력 값 (날짜/시간) */
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

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

        // 승인용 입력 기본값 세팅
        const baseDate = ui.reservationDateIso?.slice(0, 10) || "";
        setStartDate((prev) => prev || baseDate);
        setEndDate((prev) => prev || baseDate);
        // 시간은 스펙 예시 값으로 기본 세팅 (원하면 변경 가능)
        setStartTime((prev) => prev || "13:30");
        setEndTime((prev) => prev || "15:00");
      } catch (e) {
        console.error("[Reservation/DetailMobileView] fetchDetail error:", e);
        setError("예약 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reservationId, accessorParam]);

  /** 가격 포맷 */
  const formatPrice = (n: number) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

  // 거절하기 버튼 클릭 핸들러
  const handleCancel = async () => {
    if (!detail) return;
    if (detail.status !== "예약중") return; // 이미 확정/취소된 건 처리 X

    // 간단 검증
    if (!startDate || !endDate || !startTime || !endTime) {
      window.alert("예약 시작/종료 날짜와 시간을 모두 입력해주세요.");
      return;
    }

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

      // 응답 기준으로 상태 갱신
      setDetail(mapApiToUi(data));

      window.alert("예약이 거절되었습니다.");
      // 상태가 DENY으로 바뀌면서 버튼은 자동으로 사라짐
    } catch (e) {
      console.error("[Reservation/DetailMobileView] approve error:", e);
      window.alert("예약 거절 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 승인하기 버튼 클릭 핸들러
  const handleApprove = async () => {
    if (!detail) return;
    if (detail.status !== "예약중") return; // 이미 확정/취소된 건 처리 X

    // 간단 검증
    if (!startDate || !endDate || !startTime || !endTime) {
      window.alert("예약 시작/종료 날짜와 시간을 모두 입력해주세요.");
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

      // 응답 기준으로 상태 갱신
      setDetail(mapApiToUi(data));

      window.alert("예약이 승인되었습니다.");
      // 상태가 '확정'으로 바뀌면서 버튼은 자동으로 사라짐
    } catch (e) {
      console.error("[Reservation/DetailMobileView] approve error:", e);
      window.alert("예약 승인 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* 390 × 844 프레임 */}
      <div className="mx-auto h-[844px] w-[390px] flex flex-col bg-[#F8F8F8] relative">
        {/* 헤더 영역 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader title="예약 상세" onBack={onBack} showMenu={false} />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-20 pb-10">
            {/* 로딩/에러 처리 */}
            {loading && (
              <div className="flex h-[200px] w-full items-center justify-center text-[14px] text-[#999999]">
                예약 상세 정보를 불러오는 중입니다...
              </div>
            )}

            {!loading && error && (
              <div className="flex h-[200px] w-full items-center justify-center whitespace-pre-line text-center text-[14px] text-[#EB5147]">
                {error}
              </div>
            )}

            {!loading && !error && detail && (
              <>
                {/* 상단 상태 + 날짜 */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    {detail.status}
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                    {detail.date}
                  </span>
                </div>

                {/* 상품정보 카드 */}
                <section className="mx-auto mb-4 w-full max-w-[350px]">
                  <div className="rounded-[12px] border border-[#F3F4F5] bg-white px-4 pt-4 pb-5">
                    {/* 타이틀 */}
                    <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      상품정보
                    </div>

                    <div className="flex">
                      {/* 썸네일 */}
                      <div className="mr-4 h-[80px] w-[80px] flex-shrink-0 overflow-hidden rounded-[4px] border border-[#F5F5F5] bg-[#F6F7FB]">
                        {detail.thumbnailUrl ? (
                          <img
                            src={detail.thumbnailUrl}
                            alt={detail.productTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full" />
                        )}
                      </div>

                      {/* 텍스트 영역 */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="text-[14px] leading-[21px] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                            {detail.productBrand}
                          </div>
                          <div className="mt-1 break-words text-[14px] leading-[21px] tracking-[-0.2px] text-[#1E2124]">
                            {detail.productTitle}
                          </div>
                        </div>
                        <div className="mt-2 text-right text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                          {formatPrice(detail.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 고객정보 카드 */}
                <section className="mx-auto mb-4 w-full max-w-[350px]">
                  <div className="rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4">
                    {/* 타이틀 */}
                    <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      고객정보
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* 이름 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          이름
                        </span>
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          {detail.customerName}
                        </span>
                      </div>

                      {/* 전화번호 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          전화번호
                        </span>
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          {detail.customerPhone}
                        </span>
                      </div>

                      {/* 고객 ID */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          고객 ID
                        </span>
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          {detail.customerId}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 예약 시간 설정 카드 */}
                <section className="mx-auto mb-4 w-full max-w-[350px]">
                  <div className="rounded-[12px] border border-[#F3F4F5] bg-white px-4 pt-4 pb-5">
                    <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      예약 시간 설정
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          시작 날짜
                        </span>
                        <input
                          type="date"
                          className="h-8 w-[190px] rounded-[8px] border border-[#E5E7EB] px-2 text-right text-[12px] leading-[18px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          종료 날짜
                        </span>
                        <input
                          type="date"
                          className="h-8 w-[190px] rounded-[8px] border border-[#E5E7EB] px-2 text-right text-[12px] leading-[18px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          시작 시간
                        </span>
                        <input
                          type="time"
                          className="h-8 w-[190px] rounded-[8px] border border-[#E5E7EB] px-2 text-right text-[12px] leading-[18px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          종료 시간
                        </span>
                        <input
                          type="time"
                          className="h-8 w-[190px] rounded-[8px] border border-[#E5E7EB] px-2 text-right text-[12px] leading-[18px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 요청사항 카드 */}
                <section className="mx-auto w-full max-w-[350px] mb-25">
                  <div className="rounded-[12px] border border-[#F3F4F5] bg-white px-4 pt-4 pb-5">
                    <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      요청사항
                    </div>

                    <div className="rounded-[8px] bg-[#F8F8F8] px-4 py-3">
                      <p className="whitespace-pre-line text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000]">
                        {detail.requestMessage}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>

        {/* 하단 버튼 영역 - 거절하기 / 승인하기
           예약 상태가 '예약중'일 때만 노출 (확정/취소면 버튼 숨김) */}
        {!loading && !error && detail && detail.status === "예약중" && (
          <div className="absolute bottom-[60px] left-1/2 z-20 w-[350px] -translate-x-1/2">
            <div className="flex w-full flex-row items-center gap-[12px] px-4 py-3">
              {/* 거절하기 버튼 */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className={`flex h-[48px] flex-1 flex-row items-center justify-center rounded-[12px] border border-[#E1E1E1] bg-white text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#999999] ${
                  actionLoading ? "opacity-60" : ""
                }`}
              >
                거절하기
              </button>

              {/* 승인하기 버튼 */}
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className={`flex h-[48px] flex-1 flex-row items-center justify-center rounded-[12px] bg-[#FF2233] text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-white ${
                  actionLoading ? "opacity-60" : ""
                }`}
              >
                승인하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
