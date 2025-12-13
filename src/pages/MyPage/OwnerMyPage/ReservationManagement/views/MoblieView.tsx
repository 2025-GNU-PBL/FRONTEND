import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";

/** UI에 쓰는 상태값 */
type ReservationStatus = "대기" | "확정" | "취소";
type StatusFilter = "전체" | ReservationStatus;

/** 서버 응답 DTO */
type ReservationApiResponse = {
  id: number;
  ownerId: number;
  customerId: number;
  productId: number;
  status: string; // WAITING / APPROVE / DENY
  reservationTime: string; // "2025-11-07T12:00:00"
  title: string;
  content: string;
  createdAt: string;
};

/** 화면에서 사용할 예약 타입 */
type Reservation = {
  id: string;
  partner: string;
  title: string;
  status: ReservationStatus;
  createdAt: string; // YYYY-MM-DD
};

/** YYYY-MM-DD → YYYY.MM.DD 포맷 */
function formatDate(date: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
}

/** 서버 status → UI status 매핑 */
const mapStatus = (status: string): ReservationStatus => {
  switch (status) {
    case "APPROVE":
      return "확정";
    case "DENY":
      return "취소";
    default:
      return "대기";
  }
};

/** 응답 DTO → 화면용 모델 변환 */
const toReservation = (r: ReservationApiResponse): Reservation => {
  const dateOnly = (r.createdAt || "").slice(0, 10) || "";
  return {
    id: String(r.id),
    partner: r.title || "예약 업체",
    title: r.content || "",
    status: mapStatus(r.status),
    createdAt: dateOnly,
  };
};

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [sort, setSort] = useState<"최신순" | "오래된순">("최신순");

  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const statusRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  /** 예약 목록 조회 */
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<ReservationApiResponse[]>(
          "/api/v1/reservation"
        );
        setReservations((data || []).map(toReservation));
      } catch (err) {
        console.error("[Reservation/MobileView] fetchReservations error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  /** 정렬 & 필터링된 리스트 */
  const filtered = useMemo(() => {
    let base = reservations.slice();

    if (statusFilter !== "전체") {
      base = base.filter((r) => r.status === statusFilter);
    }

    base.sort((a, b) => {
      const da = +new Date(a.createdAt);
      const db = +new Date(b.createdAt);
      return sort === "최신순" ? db - da : da - db;
    });

    return base;
  }, [reservations, statusFilter, sort]);

  /** 바깥 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    if (!statusOpen && !sortOpen) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;

      if (statusRef.current && !statusRef.current.contains(target)) {
        setStatusOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(target)) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [statusOpen, sortOpen]);

  /** 예약 한 건 선택 시 상세 페이지로 이동 */
  const onSelectReservation = (reservationId: string) => {
    nav(`/my-page/owner/reservations/${reservationId}`);
  };

  const isEmpty = !loading && filtered.length === 0;

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <MyPageHeader title="예약 관리" onBack={onBack} showMenu={false} />

      {/* 콘텐츠 스크롤 영역 */}
      {/* ✅ 빈 상태일 때 헤더 아래 영역 전체를 flex로 잡아서 중앙 정렬 */}
      <div className={`flex-1 overflow-y-auto ${isEmpty ? "flex" : ""}`}>
        {/* ✅ 내부 컨테이너: 빈 상태면 가운데 정렬 */}
        <div
          className={`w-full ${
            isEmpty ? "flex items-center justify-center" : ""
          }`}
        >
          {/* 로딩 */}
          {loading && (
            <div className="w-full flex items-center justify-center py-10 text-[14px] text-[#999999]">
              예약 정보를 불러오는 중입니다...
            </div>
          )}

          {/* 리스트/헤더 영역: 빈 상태가 아닐 때만 */}
          {!loading && !isEmpty && (
            <>
              {/* 상단: 예약 개수 / 상태별 / 정렬 */}
              <div className="px-5 pt-5 flex items-center justify-between gap-2 mt-15">
                <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                  {`예약 내역 ${filtered.length}`}
                </span>

                <div className="flex items-center gap-3">
                  {/* 상태별 드롭다운 */}
                  <div className="relative" ref={statusRef}>
                    <button
                      type="button"
                      onClick={() => setStatusOpen((p) => !p)}
                      className="flex items-center gap-1"
                    >
                      <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                        상태별
                        {statusFilter !== "전체" && ` · ${statusFilter}`}
                      </span>
                      <Icon
                        icon="solar:alt-arrow-down-linear"
                        className="w-4 h-4 text-[#999999]"
                      />
                    </button>
                    {statusOpen && (
                      <div className="absolute right-0 mt-2 w-28 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30">
                        {/* 전체 */}
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("전체");
                            setStatusOpen(false);
                          }}
                          className={[
                            "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
                            statusFilter === "전체"
                              ? "bg-gray-100 font-semibold"
                              : "hover:bg-gray-50",
                          ].join(" ")}
                        >
                          전체
                        </button>
                        {/* 대기 */}
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("대기");
                            setStatusOpen(false);
                          }}
                          className={[
                            "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
                            statusFilter === "대기"
                              ? "bg-gray-100 font-semibold"
                              : "hover:bg-gray-50",
                          ].join(" ")}
                        >
                          대기
                        </button>
                        {/* 확정 */}
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("확정");
                            setStatusOpen(false);
                          }}
                          className={[
                            "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
                            statusFilter === "확정"
                              ? "bg-gray-100 font-semibold"
                              : "hover:bg-gray-50",
                          ].join(" ")}
                        >
                          확정
                        </button>
                        {/* 취소 */}
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("취소");
                            setStatusOpen(false);
                          }}
                          className={[
                            "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
                            statusFilter === "취소"
                              ? "bg-gray-100 font-semibold"
                              : "hover:bg-gray-50",
                          ].join(" ")}
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 정렬 드롭다운 */}
                  <div className="relative" ref={sortRef}>
                    <button
                      type="button"
                      onClick={() => setSortOpen((p) => !p)}
                      className="flex items-center gap-1"
                    >
                      <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                        {sort}
                      </span>
                      <Icon
                        icon="solar:alt-arrow-down-linear"
                        className="w-4 h-4 text-[#999999]"
                      />
                    </button>
                    {sortOpen && (
                      <div className="absolute right-0 mt-2 w-28 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30">
                        {/* 최신순 */}
                        <button
                          type="button"
                          onClick={() => {
                            setSort("최신순");
                            setSortOpen(false);
                          }}
                          className={[
                            "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
                            sort === "최신순"
                              ? "bg-gray-100 font-semibold"
                              : "hover:bg-gray-50",
                          ].join(" ")}
                        >
                          최신순
                        </button>
                        {/* 오래된순 */}
                        <button
                          type="button"
                          onClick={() => {
                            setSort("오래된순");
                            setSortOpen(false);
                          }}
                          className={[
                            "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
                            sort === "오래된순"
                              ? "bg-gray-100 font-semibold"
                              : "hover:bg-gray-50",
                          ].join(" ")}
                        >
                          오래된순
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 리스트 영역 */}
              <div className="mt-4 flex flex-col px-5 pb-6">
                {filtered.map((r) => {
                  let bg = "";
                  if (r.status === "대기") bg = "bg-[#FA9538]";
                  if (r.status === "확정") bg = "bg-[#3DC061]";
                  if (r.status === "취소") bg = "bg-[#EB5147]";

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelectReservation(r.id)}
                      className="w-full text-left"
                    >
                      <div className="w-full bg-white border-b border-[#F3F4F5] py-4">
                        <div className="w-full flex items-center justify-between gap-4">
                          {/* 좌측 텍스트 */}
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <div className="text-[14px] leading-[21px] font-semibold tracking-[-0.2px] text-black truncate">
                              {r.partner}
                            </div>
                            <div className="text-[16px] leading-[26px] tracking-[-0.2px] text-black break-words">
                              {r.title}
                            </div>
                            <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                              예약일 {formatDate(r.createdAt)}
                            </div>
                          </div>

                          {/* 상태 배지 */}
                          <div
                            className={[
                              "min-w-[48px] h-[33px] px-3 flex items-center justify-center rounded-[20px]",
                              bg,
                            ].join(" ")}
                          >
                            <span className="text-white text-[14px] font-medium leading-[21px] tracking-[-0.2px]">
                              {r.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* 빈 상태: 헤더 아래 영역 기준 정중앙 */}
          {!loading && isEmpty && (
            <div className="flex flex-col items-center justify-center px-5 mb-10">
              <img
                src="/images/document.png"
                className="w-[72px] h-[72px] text-[#D3D4D6] mb-4"
                alt="empty"
              />
              <div className="flex flex-col items-center text-center">
                <p className="text-[18px] leading-[24px] font-semibold tracking-[-0.2px] text-black mb-2">
                  1개월 내 예약 내역이 없어요
                </p>
                <p className="mb-1 text-[14px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                  마음에 드는 상품 상세에서
                </p>
                <p className="text-[14px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                  예약을 등록해 보세요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
