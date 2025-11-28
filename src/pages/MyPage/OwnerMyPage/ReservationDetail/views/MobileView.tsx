import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";
import { toast } from "react-toastify";

/** ====== 서버 응답 DTO  ====== */
type ReservationDetailApiResponse = {
  id: number;
  ownerId: number;
  customerId: number;
  productId: number;
  status: string;
  reservationTime: string;
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
  rawStatus: string;
  date: string;
  reservationDateIso: string;
  productBrand: string;
  productTitle: string;
  price: number;
  thumbnail?: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  requestMessage: string;
};

/** 승인용 Request Body 타입 */
type ReservationApproveRequest = {
  status: "APPROVE";
  reservationStartDate: string;
  reservationEndDate: string;
  reservationStartTime: string;
  reservationEndTime: string;
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

/** API → UI 매핑 */
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

/** ====== 컴포넌트 ====== */
export default function MobileView() {
  const nav = useNavigate();
  const { reservationId } = useParams<{ reservationId: string }>();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // 승인/거절 모달 타입
  const [confirmType, setConfirmType] = useState<"cancel" | "approve" | null>(
    null
  );

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
            params: { accessor: accessorParam ?? {} },
          }
        );

        const ui = mapApiToUi(data);
        setDetail(ui);

        const baseDate = ui.reservationDateIso?.slice(0, 10) || "";
        setStartDate((p) => p || baseDate);
        setEndDate((p) => p || baseDate);
        setStartTime((p) => p || "13:30");
        setEndTime((p) => p || "15:00");
      } catch (e) {
        console.error("[Reservation/DetailMobileView] fetchDetail error:", e);
        setError("예약 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reservationId, accessorParam]);

  const formatPrice = (n: number) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

  /** ====== 거절 모달 오픈 ====== */
  const openCancelModal = () => {
    if (!detail || detail.status !== "예약중") return;
    setConfirmType("cancel");
  };

  /** ====== 승인 모달 오픈 ====== */
  const openApproveModal = () => {
    if (!detail || detail.status !== "예약중") return;

    if (!startDate || !endDate || !startTime || !endTime) {
      toast.warning("예약 시작/종료 날짜와 시간을 모두 입력해주세요.");
      return;
    }

    setConfirmType("approve");
  };

  /** ====== 모달에서 최종 확인 눌렀을 때 실제 API 호출 ====== */
  const handleConfirmAction = async () => {
    if (!detail || detail.status !== "예약중" || !confirmType) return;

    // 한 번 더 방어적으로 체크
    if (
      confirmType === "approve" &&
      (!startDate || !endDate || !startTime || !endTime)
    ) {
      toast.warning("예약 시작/종료 날짜와 시간을 모두 입력해주세요.");
      return;
    }

    try {
      setActionLoading(true);

      if (confirmType === "cancel") {
        // === 거절 API ===
        const body: ReservationRejectRequest = { status: "DENY" };
        const { data } = await api.patch<ReservationDetailApiResponse>(
          `/api/v1/reservation/${detail.id}/reject`,
          body
        );

        setDetail((prev) => {
          const mapped = mapApiToUi(data);
          return prev ? { ...prev, ...mapped } : mapped;
        });

        toast.success("예약이 거절되었습니다.");
      } else if (confirmType === "approve") {
        // === 승인 API ===
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

        setDetail((prev) => {
          const mapped = mapApiToUi(data);
          return prev ? { ...prev, ...mapped } : mapped;
        });

        toast.success("예약이 승인되었습니다.");
      }

      setConfirmType(null);
    } catch (e) {
      console.error("[Reservation/DetailMobileView] action error:", e);

      if (confirmType === "cancel") {
        toast.error("예약 거절 중 오류가 발생했습니다.");
      } else if (confirmType === "approve") {
        toast.error("예약 승인 중 오류가 발생했습니다.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!actionLoading) {
      setConfirmType(null);
    }
  };

  const confirmTitle =
    confirmType === "cancel"
      ? "예약을 거절하시겠어요?"
      : confirmType === "approve"
      ? "예약을 승인하시겠어요?"
      : "";

  const confirmDescription =
    confirmType === "cancel"
      ? "한 번 거절한 예약은 다시 복구할 수 없어요."
      : confirmType === "approve"
      ? "승인 후에는 예약 일정에 맞춰 진행해주세요."
      : "";

  const confirmButtonLabel =
    confirmType === "cancel" ? "거절" : confirmType === "approve" ? "승인" : "";

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8F8F8]">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-white">
        <MyPageHeader title="예약 상세" onBack={onBack} showMenu={false} />
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-5 pt-20 pb-10">
          {loading && (
            <div className="flex h-[200px] items-center justify-center text-[14px] text-[#999999]">
              예약 상세 정보를 불러오는 중입니다...
            </div>
          )}

          {!loading && error && (
            <div className="flex h-[200px] items-center justify-center whitespace-pre-line text-center text-[14px] text-[#EB5147]">
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* 상태 + 날짜 */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                  {detail.status}
                </span>
                <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                  {detail.date}
                </span>
              </div>

              {/* 상품 정보 카드 */}
              <section className="mb-4 w-full">
                <div className="rounded-[12px] border border-[#F3F4F5] bg-white px-4 pt-4 pb-5">
                  <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    상품정보
                  </div>

                  <div className="flex">
                    <div className="mr-4 h-[80px] w-[80px] flex-shrink-0 overflow-hidden rounded-[4px] border border-[#F5F5F5] bg-[#F6F7FB]">
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

              {/* 고객 정보 카드 */}
              <section className="mb-4 w-full">
                <div className="rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4">
                  <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    고객정보
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        이름
                      </span>
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        {detail.customerName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        전화번호
                      </span>
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        {detail.customerPhone}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        고객 이메일
                      </span>
                      <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                        {detail.customerId}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 예약 시간 설정 카드 */}
              {detail.status === "예약중" && (
                <section className="mb-4 w-full">
                  <div className="rounded-[12px] border border-[#F3F4F5] bg-white px-4 pt-4 pb-5">
                    <div className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      예약 시간 설정
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          시작 날짜
                        </span>
                        <input
                          type="date"
                          className="h-8 flex-1 rounded-[8px] border border-[#E5E7EB] px-2 text-right text-[12px] leading-[18px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          종료 날짜
                        </span>
                        <input
                          type="date"
                          className="h-8 flex-1 rounded-[8px] border border-[#E5E7EB] px-2 text-right text-[12px] leading-[18px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          시작 시간
                        </span>
                        <input
                          type="time"
                          className="h-8 flex-1 rounded-[8px] border border-[#E5E7EB] px-2 text-right text-[12px] leading-[18px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          종료 시간
                        </span>
                        <input
                          type="time"
                          className="h-8 flex-1 rounded-[8px] border border-[#E5E7EB] px-2 text-right text-[12px] leading-[18px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF2233]"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 요청사항 카드 */}
              <section className="w-full mb-25">
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

      {/* 하단 버튼 영역 */}
      {!loading && !error && detail && detail.status === "예약중" && (
        <div className="w-full border-t border-[#F3F4F5] bg-white">
          <div className="flex w-full flex-row items-center gap-[12px] px-5 py-3">
            <button
              type="button"
              onClick={openCancelModal}
              disabled={actionLoading}
              className={`flex h-[48px] flex-1 flex-row items-center justify-center rounded-[12px] border border-[#E1E1E1] bg-white text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#999999] ${
                actionLoading ? "opacity-60" : ""
              }`}
            >
              거절하기
            </button>

            <button
              type="button"
              onClick={openApproveModal}
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

      {/* 승인/거절 확인 모달 */}
      {confirmType && (
        <ConfirmModal
          title={confirmTitle}
          description={confirmDescription}
          onCancel={handleCloseModal}
          onConfirm={handleConfirmAction}
          isLoading={actionLoading}
          confirmLabel={confirmButtonLabel}
        />
      )}
    </div>
  );
}

/** ====== 확인 모달 (쿠폰 삭제 모달 그대로 활용) ====== */

interface ConfirmModalProps {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmLabel: string;
}

function ConfirmModal({
  title,
  description,
  onCancel,
  onConfirm,
  isLoading = false,
  confirmLabel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="relative w-[335px] bg-white rounded-[14px] shadow-[4px_4px_10px_rgba(0,0,0,0.06)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-start gap-2 px-5 pt-6 pb-0">
          <div className="flex flex-row items-start gap-[14px] w-full">
            <p className="text-[16px] font-bold leading-[24px] tracking-[-0.2px] text-[#1E2124]">
              {title}
            </p>
          </div>
          <p className="w-full text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#9D9D9D]">
            {description}
          </p>
        </div>

        <div className="mt-4 flex flex-row items-center justify-between gap-2 px-5 pb-6 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex h-11 w-[142px] flex-row items-center justify-center rounded-[10px] bg-[#F3F4F5] disabled:opacity-70"
          >
            <span className="text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#999999]">
              취소
            </span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex h-11 w-[143px] flex-row items-center justify-center rounded-[10px] bg-[#FF2233] disabled:bg-[#FF2233]/60"
          >
            <span className="text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-white">
              {isLoading ? "처리 중..." : confirmLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
