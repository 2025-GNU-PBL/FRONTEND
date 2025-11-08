// src/pages/MyPage/ClientMyPage/Reservation/WebView.tsx
import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../lib/api/axios";

/** UI에서 사용하는 상태값 */
type InquiryStatus = "대기" | "확정" | "취소";
type StatusFilter = "전체" | InquiryStatus;

/** 서버 Reservation API 응답 DTO (Swagger 기준) */
type ReservationApiResponse = {
  id: number;
  ownerId: number;
  customerId: number;
  productId: number;
  status: string; // WAITING / APPROVE / CANCEL ...
  reservationTime: string; // "2025-11-07T12:00:00"
  title: string;
  content: string;
};

/** 화면에서 사용할 문의(=예약) 타입 */
type Inquiry = {
  id: string;
  partner: string;
  title: string;
  status: InquiryStatus;
  createdAt: string; // YYYY-MM-DD
};

export default function WebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [sort, setSort] = useState<"최신순" | "오래된순">("최신순");

  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const statusRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);

  /** 서버 status -> 화면 status 매핑 */
  const mapStatus = (status: string): InquiryStatus => {
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
        return "대기"; // WAITING 등 기본값
    }
  };

  /** Reservation DTO -> Inquiry 뷰 모델 변환 */
  const toInquiry = (r: ReservationApiResponse): Inquiry => {
    const createdAt = (r.reservationTime || "").slice(0, 10) || "";
    return {
      id: String(r.id),
      // 업체명 정보가 별도 필드에 없다면 title/기본값 사용
      partner: r.title || "예약 업체",
      // 문의/예약 내용
      title: r.content || "",
      status: mapStatus(r.status),
      createdAt,
    };
  };

  /** 예약(문의) 목록 조회 */
  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<ReservationApiResponse[]>(
          "/api/v1/reservation"
        );
        setInquiries((data || []).map(toInquiry));
      } catch (err) {
        console.error("[Inquiry/WebView] fetchInquiries error:", err);
        // TODO: 토스트로 에러 노출
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  /** 정렬 & 필터링 적용 리스트 */
  const filtered = useMemo(() => {
    let base = inquiries.slice();

    if (statusFilter !== "전체") {
      base = base.filter((q) => q.status === statusFilter);
    }

    base.sort((a, b) => {
      const da = +new Date(a.createdAt);
      const db = +new Date(b.createdAt);
      return sort === "최신순" ? db - da : da - db;
    });

    return base;
  }, [inquiries, statusFilter, sort]);

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

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 상단 고정 헤더 */}
      <header className="w-full bg-white border-b border-[#E5E6EB] sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3F4F5] transition"
            >
              <Icon
                icon="solar:alt-arrow-left-linear"
                className="w-6 h-6 text-black"
              />
            </button>
            <h1 className="text-[22px] font-semibold tracking-[-0.3px] text-black">
              문의 내역
            </h1>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-[#999999]">
            <span>고객 센터</span>
            <span className="w-[1px] h-3 bg-[#E5E6EB]" />
            <span>1:1 문의하기</span>
          </div>
        </div>
      </header>

      {/* 콘텐츠 영역 */}
      <main className="max-w-[1200px] mx-auto px-6 pt-6 pb-10">
        {/* 필터/정렬 바 */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-semibold text-black">
              전체 문의
            </span>
            <span className="text-[13px] text-[#999999]">
              {loading ? "불러오는 중..." : `총 ${filtered.length}건`}
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
            문의 내역을 불러오는 중입니다...
          </section>
        ) : filtered.length === 0 ? (
          <WebEmptyState />
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-[#E5E6EB]">
            <div className="grid grid-cols-[1.5fr_3fr_1.2fr_1.2fr] gap-3 px-6 py-3 border-b border-[#F3F4F5] text-[13px] text-[#9CA3AF]">
              <div>업체명</div>
              <div>문의 내용</div>
              <div>작성일</div>
              <div className="text-center">상태</div>
            </div>

            <div>
              {filtered.map((q, index) => (
                <WebInquiryRow
                  key={q.id}
                  q={q}
                  withSoftBackground={index === 1}
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

/** 문의 상태 */
function StatusBadge({ status }: { status: InquiryStatus }) {
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

/** 웹용 문의 리스트 행 */
function WebInquiryRow({
  q,
  withSoftBackground,
}: {
  q: Inquiry;
  withSoftBackground?: boolean;
}) {
  return (
    <div
      className={[
        "grid grid-cols-[1.5fr_3fr_1.2fr_1.2fr] gap-3 px-6 py-4 border-t border-[#F3F4F5] items-center",
        withSoftBackground ? "bg-[#F6F7FB]" : "bg-white",
      ].join(" ")}
    >
      <div className="text-[14px] font-semibold text-[#111827]">
        {q.partner}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-[15px] text-[#111827]">{q.title}</div>
      </div>
      <div className="text-[13px] text-[#6B7280]">
        {formatDate(q.createdAt)}
      </div>
      <div className="flex justify-center">
        <StatusBadge status={q.status} />
      </div>
    </div>
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
          1개월 내 문의 내역이 없어요
        </p>
        <p className="text-[13px] text-[#9CA3AF]">
          1:1 문의하기에서 궁금한 점을 남겨주세요
        </p>
      </div>
    </section>
  );
}

/** YYYY-MM-DD → YYYY.MM.DD 포맷 */
function formatDate(date: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
}
