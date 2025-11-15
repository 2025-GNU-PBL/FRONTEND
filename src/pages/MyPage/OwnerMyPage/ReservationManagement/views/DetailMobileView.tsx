// src/pages/Customer/Reservation/DetailMobileView.tsx
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
export default function DetailMobileView() {
  const nav = useNavigate();
  const { reservationId } = useParams<{ reservationId: string }>();
  const onBack = useCallback(() => nav(-1), [nav]);

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
          // 썸네일 필드는 swagger에 없어서 일단 비워 둠
          thumbnailUrl: undefined,
          customerName: data.customerName,
          customerPhone: data.customerPhoneNumber,
          // 고객 ID 자리에 무엇을 보여줄지 애매해서 이메일 사용 (필요하면 customerId.toString() 으로 교체)
          customerId: data.customerEmail || String(data.customerId),
          requestMessage: data.content || "",
        };

        setDetail(ui);
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

  // 버튼 클릭 핸들러 (필요 시 실제 API 연동)
  const handleCancel = () => {
    // TODO: 예약 취소 API 연동
    console.log("취소하기 클릭");
  };

  const handleApprove = () => {
    // TODO: 예약 승인 API 연동
    console.log("승인하기 클릭");
  };

  return (
    <div className="w-full bg-white">
      {/* 390 × 844 프레임 */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F8F8F8] flex flex-col relative">
        {/* 헤더 영역 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader title="예약 상세" onBack={onBack} showMenu={false} />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-10 pb-10">
            {/* 로딩/에러 처리 */}
            {loading && (
              <div className="w-full h-[200px] flex items-center justify-center text-[14px] text-[#999999]">
                예약 상세 정보를 불러오는 중입니다...
              </div>
            )}

            {!loading && error && (
              <div className="w-full h-[200px] flex items-center justify-center text-[14px] text-[#EB5147] text-center whitespace-pre-line">
                {error}
              </div>
            )}

            {!loading && !error && detail && (
              <>
                {/* 상단 상태 + 날짜 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    {detail.status}
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                    {detail.date}
                  </span>
                </div>

                {/* 상품정보 카드 */}
                <section className="w-full max-w-[350px] mx-auto mb-4">
                  <div className="bg-white border border-[#F3F4F5] rounded-[12px] px-4 pt-4 pb-5">
                    {/* 타이틀 */}
                    <div className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124] mb-4">
                      상품정보
                    </div>

                    <div className="flex">
                      {/* 썸네일 */}
                      <div className="w-[80px] h-[80px] rounded-[4px] border border-[#F5F5F5] overflow-hidden bg-[#F6F7FB] mr-4 flex-shrink-0">
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

                      {/* 텍스트 영역 */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="text-[14px] leading-[21px] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                            {detail.productBrand}
                          </div>
                          <div className="mt-1 text-[14px] leading-[21px] tracking-[-0.2px] text-[#1E2124] break-words">
                            {detail.productTitle}
                          </div>
                        </div>
                        <div className="mt-2 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124] text-right">
                          {formatPrice(detail.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 고객정보 카드 */}
                <section className="w-full max-w-[350px] mx-auto mb-4">
                  <div className="bg-white border border-[#F3F4F5] rounded-[12px] px-4 py-4">
                    {/* 타이틀 */}
                    <div className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124] mb-4">
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
                <section className="w-full max-w-[350px] mx-auto">
                  <div className="bg-white border border-[#F3F4F5] rounded-[12px] px-4 pt-4 pb-5">
                    <div className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124] mb-4">
                      요청사항
                    </div>

                    <div className="bg-[#F8F8F8] rounded-[8px] px-4 py-3">
                      <p className="text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000] whitespace-pre-line">
                        {detail.requestMessage}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>

        {/* 하단 버튼 영역 - 취소하기 / 승인하기 */}
        {!loading && !error && detail && (
          <div className="absolute bottom-[34px] left-1/2 -translate-x-1/2 w-[335px] h-[78px] px-[20px] pt-[10px] pb-[24px] flex flex-row items-center gap-[10px] z-20 rounded-b-[10px]">
            {/* 취소하기 버튼 */}
            <button
              type="button"
              onClick={handleCancel}
              className="w-[142px] h-[44px] flex flex-row items-center justify-center rounded-[10px] bg-white text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#999999]"
            >
              취소하기
            </button>

            {/* 승인하기 버튼 */}
            <button
              type="button"
              onClick={handleApprove}
              className="w-[143px] h-[44px] flex flex-row items-center justify-center rounded-[10px] bg-[#FF2233] text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-white"
            >
              승인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
