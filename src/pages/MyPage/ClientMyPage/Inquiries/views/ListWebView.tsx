// src/pages/MyPage/ClientMyPage/Reservation/WebView.tsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../../lib/api/axios";

/** UI에서 사용하는 상태값 */
type ReservationStatus = "대기" | "확정" | "취소";
type StatusFilter = "전체" | ReservationStatus;

/** 서버 Reservation API 응답 DTO */
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

/* ---------- 컴포넌트 밖 유틸 함수들 ---------- */

/** 서버 status -> 화면 status 매핑 */
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

/** Reservation DTO -> 화면용 예약 뷰 모델 변환 */
const toReservation = (r: ReservationApiResponse): Reservation => {
  const createdAt = (r.createdAt || "").slice(0, 10) || "";
  return {
    id: String(r.id),
    partner: r.title || "예약 업체",
    title: r.content || "",
    status: mapStatus(r.status),
    createdAt,
  };
};

/** YYYY-MM-DD → YYYY.MM.DD 포맷 (모바일 뷰와 동일) */
function formatDate(date: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
}

export default function WebView() {
  const nav = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [sort, setSort] = useState<"최신순" | "오래된순">("최신순");

  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const statusRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

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
        console.error("[Reservation/WebView] fetchReservations error:", err);
        // TODO: 토스트로 에러 노출
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  /** 정렬 & 필터링 적용 리스트 */
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

  /** 예약 한 건 선택 시 상세 페이지로 이동 (모바일 로직과 동일한 경로 사용) */
  const onSelectReservation = (reservationId: string) => {
    nav(`/my-page/client/inquiries/${reservationId}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 콘텐츠 영역 */}
      <main className="max-w-[1200px] mx-auto px-6 pt-25 pb-10">
        {/* 필터/정렬 바 */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-semibold text-black">
              예약 내역
            </span>
            <span className="text-[13px] text-[#999999]">
              {loading ? "예약 내역 불러오는 중..." : `총 ${filtered.length}건`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* 상태별 드롭다운 */}
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                onClick={() => setStatusOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-[999px] border border-[#E5E6EB] bg-white text-[14px] text-[#111827] hover:bg-[#F9FAFB] transition"
              >
                <Icon
                  icon="solar:checklist-minimalistic-linear"
                  className="w-4 h-4 text-[#999999]"
                />
                <span>
                  상태별
                  {statusFilter !== "전체" && ` · ${statusFilter}`}
                </span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="w-4 h-4 text-[#999999]"
                />
              </button>
              {statusOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30">
                  <DropdownItem
                    active={statusFilter === "전체"}
                    onClick={() => {
                      setStatusFilter("전체");
                      setStatusOpen(false);
                    }}
                  >
                    전체
                  </DropdownItem>
                  <DropdownItem
                    active={statusFilter === "대기"}
                    onClick={() => {
                      setStatusFilter("대기");
                      setStatusOpen(false);
                    }}
                  >
                    대기
                  </DropdownItem>
                  <DropdownItem
                    active={statusFilter === "확정"}
                    onClick={() => {
                      setStatusFilter("확정");
                      setStatusOpen(false);
                    }}
                  >
                    확정
                  </DropdownItem>
                  <DropdownItem
                    active={statusFilter === "취소"}
                    onClick={() => {
                      setStatusFilter("취소");
                      setStatusOpen(false);
                    }}
                  >
                    취소
                  </DropdownItem>
                </div>
              )}
            </div>

            {/* 정렬 드롭다운 */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-[999px] border border-[#E5E6EB] bg-white text-[14px] text-[#111827] hover:bg-[#F9FAFB] transition"
              >
                <Icon
                  icon="solar:sort-outline"
                  className="w-4 h-4 text-[#999999]"
                />
                <span>{sort}</span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="w-4 h-4 text-[#999999]"
                />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30">
                  <DropdownItem
                    active={sort === "최신순"}
                    onClick={() => {
                      setSort("최신순");
                      setSortOpen(false);
                    }}
                  >
                    최신순
                  </DropdownItem>
                  <DropdownItem
                    active={sort === "오래된순"}
                    onClick={() => {
                      setSort("오래된순");
                      setSortOpen(false);
                    }}
                  >
                    오래된순
                  </DropdownItem>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 리스트 or 빈 화면 */}
        {loading ? (
          <section className="mt-4 bg-white rounded-2xl shadow-sm border border-[#E5E6EB] flex items-center justify-center py-16 text-[14px] text-[#6B7280]">
            예약 내역을 불러오는 중입니다...
          </section>
        ) : filtered.length === 0 ? (
          <WebEmptyState />
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-[#E5E6EB]">
            {/* 헤더 행 */}
            <div className="grid grid-cols-[1.5fr_3fr_1.2fr_1.2fr] gap-3 px-6 py-3 border-b border-[#F3F4F5] text-[13px] text-[#9CA3AF]">
              <div>업체명</div>
              <div>예약 내용</div>
              <div>예약일</div>
              <div className="text-center">상태</div>
            </div>

            {/* 리스트 행들 */}
            <div>
              {filtered.map((r) => (
                <WebReservationRow
                  key={r.id}
                  r={r}
                  onClick={() => onSelectReservation(r.id)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/** 공통 드롭다운 아이템 */
function DropdownItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
        active ? "bg-gray-100 font-semibold" : "hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** 예약 상태 배지*/
function StatusBadge({ status }: { status: ReservationStatus }) {
  let bg = "";
  if (status === "대기") bg = "bg-[#FA9538]";
  if (status === "확정") bg = "bg-[#3DC061]";
  if (status === "취소") bg = "bg-[#EB5147]";

  return (
    <div
      className={[
        "inline-flex min-w-[56px] h-[30px] px-3 items-center justify-center rounded-[999px]",
        bg,
      ].join(" ")}
    >
      <span className="text-white text-[13px] font-medium leading-[18px] tracking-[-0.2px]">
        {status}
      </span>
    </div>
  );
}

/** 웹용 예약 리스트 행 */
function WebReservationRow({
  r,
  onClick,
}: {
  r: Reservation;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <div className="grid grid-cols-[1.5fr_3fr_1.2fr_1.2fr] gap-3 px-6 py-4 border-t border-[#F3F4F5] items-center bg-white hover:bg-[#F9FAFB] transition">
        <div className="text-[14px] font-semibold text-[#111827]">
          {r.partner}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[15px] text-[#111827]">{r.title}</div>
        </div>
        <div className="text-[13px] text-[#6B7280]">
          {formatDate(r.createdAt)}
        </div>
        <div className="flex justify-center">
          <StatusBadge status={r.status} />
        </div>
      </div>
    </button>
  );
}

/** 웹 빈 상태 뷰 */
function WebEmptyState() {
  return (
    <section className="mt-8 bg-white rounded-2xl shadow-sm border border-[#E5E6EB] flex flex-col items-center justify-center py-16 gap-5">
      <Icon
        icon="solar:document-linear"
        className="w-[80px] h-[80px] text-[#E5E6EB]"
      />
      <div className="flex flex-col items-center gap-1">
        <p className="text-[18px] font-semibold text-black">
          1개월 내 예약 내역이 없어요
        </p>
        <p className="text-[13px] text-[#9CA3AF]">
          마음에 드는 상품 상세에서 예약을 등록해 보세요
        </p>
      </div>
    </section>
  );
}
