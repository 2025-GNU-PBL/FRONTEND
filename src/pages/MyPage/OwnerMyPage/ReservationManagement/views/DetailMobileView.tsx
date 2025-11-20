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
  rawStatus: string; // 서버에서 내려온 원본 status
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

        setDetail(mapApiToUi(data));
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

  /** 공통: 상태 변경 PATCH 호출 */
  const patchReservationStatus = async (status: "APPROVE" | "DENY") => {
    if (!detail) return;

    const config = {
      params: {
        accessor: accessorParam ?? {},
      },
    };

    const { data } = await api.patch<ReservationDetailApiResponse>(
      "/api/v1/reservation", // swagger에 나온 엔드포인트
      {
        id: detail.id,
        status, // "APPROVE" 또는 "DENY"
      },
      config
    );

    // 응답 기준으로 상태 및 상세정보 갱신
    setDetail(mapApiToUi(data));
  };

  // 거절하기 버튼 클릭 핸들러
  const handleCancel = async () => {
    if (!detail) return;
    if (detail.status !== "예약중") return; // 이미 확정/취소된 건 처리 X

    const ok = window.confirm("해당 예약을 취소(거절)하시겠습니까?");
    if (!ok) return;

    try {
      setActionLoading(true);
      await patchReservationStatus("DENY");
      window.alert("예약이 취소(거절)되었습니다.");
    } catch (e) {
      console.error("[Reservation/DetailMobileView] cancel error:", e);
      window.alert("예약 취소 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 승인하기 버튼 클릭 핸들러
  const handleApprove = async () => {
    if (!detail) return;
    if (detail.status !== "예약중") return; // 이미 확정/취소된 건 처리 X

    const ok = window.confirm("해당 예약을 승인하시겠습니까?");
    if (!ok) return;

    try {
      setActionLoading(true);
      await patchReservationStatus("APPROVE");
      window.alert("예약이 승인되었습니다.");
      // 승인 후에도 상세 페이지에 남아 있게 두고,
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

                {/* 요청사항 카드 */}
                <section className="mx-auto w-full max-w-[350px]">
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
          <div className="absolute bottom-[96px] left-1/2 z-20 w-[350px] -translate-x-1/2">
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
