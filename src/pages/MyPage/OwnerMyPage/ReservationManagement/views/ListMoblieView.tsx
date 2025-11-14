import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
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
  status: string; // WAITING / APPROVE / CANCEL
  reservationTime: string; // "2025-11-07T12:00:00"
  title: string;
  content: string;
};

/** 화면에서 사용할 예약 타입 */
type Reservation = {
  id: string;
  partner: string;
  title: string;
  status: ReservationStatus;
  createdAt: string; // YYYY-MM-DD
};

export default function ListMoblieView() {
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

  /** 서버 status → UI status 매핑 */
  const mapStatus = (status: string): ReservationStatus => {
    switch (status) {
      case "APPROVE":
      case "APPROVED":
      case "CONFIRM":
      case "CONFIRMED":
        return "확정";
      case "CANCEL":
      case "CANCELED":
        return "취소";
      default:
        return "대기";
    }
  };

  /** 응답 DTO → 화면용 모델 변환 */
  const toReservation = (r: ReservationApiResponse): Reservation => {
    const dateOnly = (r.reservationTime || "").slice(0, 10) || "";
    return {
      id: String(r.id),
      partner: r.title || "예약 업체",
      title: r.content || "",
      status: mapStatus(r.status),
      createdAt: dateOnly,
    };
  };

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

  return (
    <div className="w-full bg-white">
      {/* 화면 프레임(390×844) */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
          <MyPageHeader title="예약 관리" onBack={onBack} showMenu={false} />
        </div>

        {/* 콘텐츠 스크롤 영역 */}
        <div className="absolute top-[65px] left-0 w-[390px] bottom-[34px] overflow-y-auto">
          {/* 상단: 예약 개수 / 상태별 / 정렬 */}
          <div className="px-5 pt-5 flex items-center justify-between gap-2">
            <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
              {loading
                ? "예약 내역 불러오는 중..."
                : `예약 내역 ${filtered.length}`}
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

          {/* 리스트 영역 */}
          <div className="mt-4 flex flex-col">
            {loading ? (
              <div className="w-full h-[489px] flex items-center justify-center text-[14px] text-[#999999]">
                예약 정보를 불러오는 중입니다...
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((r, index) => (
                <ReservationRow
                  key={r.id}
                  r={r}
                  withSoftBackground={index === 1}
                  onClick={() => onSelectReservation(r.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
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

/** 예약 상태 배지 */
function StatusBadge({ status }: { status: ReservationStatus }) {
  let bg = "";
  if (status === "대기") bg = "bg-[#FA9538]";
  if (status === "확정") bg = "bg-[#3DC061]";
  if (status === "취소") bg = "bg-[#EB5147]";

  return (
    <div
      className={[
        "min-w-[48px] h-[33px] px-3 flex items-center justify-center rounded-[20px]",
        bg,
      ].join(" ")}
    >
      <span className="text-white text-[14px] font-medium leading-[21px] tracking-[-0.2px]">
        {status}
      </span>
    </div>
  );
}

/** 예약 리스트 행 */
function ReservationRow({
  r,
  withSoftBackground,
  onClick,
}: {
  r: Reservation;
  withSoftBackground?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full px-5 text-left",
        withSoftBackground ? "bg-[#F6F7FB]" : "bg-white",
      ].join(" ")}
    >
      <div className="w-full max-w-[350px] mx-auto flex items-center justify-between gap-[40px] border-b border-[#F3F4F5] py-4">
        {/* 좌측 텍스트 */}
        <div className="flex flex-col gap-1 w-[207px]">
          <div className="text-[14px] leading-[21px] font-semibold tracking-[-0.2px] text-black">
            {r.partner}
          </div>
          <div className="text-[16px] leading-[26px] tracking-[-0.2px] text-black">
            {r.title}
          </div>
          <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
            예약일 {formatDate(r.createdAt)}
          </div>
        </div>

        {/* 상태 배지 */}
        <StatusBadge status={r.status} />
      </div>
    </button>
  );
}

/** 빈 상태 뷰 */
function EmptyState() {
  return (
    <div className="w-full h-[489px] flex flex-col items-center justify-center gap-6">
      <Icon
        icon="solar:document-linear"
        className="w-[72px] h-[72px] text-[#DADADA]"
      />
      <div className="flex flex-col items-center gap-1">
        <p className="text-[16px] leading-[24px] font-semibold tracking-[-0.2px] text-black">
          예약 내역이 없어요
        </p>
        <p className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
          마음에 드는 상품 상세에서
        </p>
        <p className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
          예약을 등록해 보세요
        </p>
      </div>
    </div>
  );
}

/** YYYY-MM-DD → YYYY.MM.DD 포맷 */
function formatDate(date: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
}
