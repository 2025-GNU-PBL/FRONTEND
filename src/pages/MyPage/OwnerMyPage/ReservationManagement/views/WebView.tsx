import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../../lib/api/axios";

/** UI에서 사용하는 상태값 */
type InquiryStatus = "대기" | "확정" | "취소";
type StatusFilter = "전체" | InquiryStatus;

/** 서버 Reservation API 응답 DTO  */
type ReservationApiResponse = {
  id: number;
  ownerId: number;
  customerId: number;
  productId: number;
  status: string; // WAITING / APPROVE / DENY ...
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

/** 서버 status -> 화면 status 매핑 (컴포넌트 밖으로 분리) */
const mapStatus = (status: string): InquiryStatus => {
  switch (status) {
    case "APPROVE":
      return "확정";
    case "DENY":
      return "취소";
    default:
      return "대기"; // WAITING 등 기본값
  }
};

/** Reservation DTO -> Inquiry 뷰 모델 변환 (컴포넌트 밖으로 분리) */
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

/** YYYY-MM-DD → YYYY.MM.DD 포맷 (컴포넌트 밖으로 분리) */
const formatDate = (date: string) => {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
};

export default function WebView() {
  const nav = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [sort, setSort] = useState<"최신순" | "오래된순">("최신순");

  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const statusRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);

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

  /** 한 건 선택 시 예약 상세 페이지로 이동 */
  const onSelectInquiry = (reservationId: string) => {
    nav(`/my-page/owner/reservations/${reservationId}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB] mt-15">
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
                  {/* DropdownItem 인라인 - 전체 */}
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

        {/* 리스트 or 빈 화면 */}
        {loading ? (
          <section className="mt-4 bg-white rounded-2xl shadow-sm border border-[#E5E6EB] flex items-center justify-center py-16 text-[14px] text-[#6B7280]">
            문의 내역을 불러오는 중입니다...
          </section>
        ) : filtered.length === 0 ? (
          // WebEmptyState 인라인
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
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-[#E5E6EB]">
            {/* 헤더 행 */}
            <div className="grid grid-cols-[1.5fr_3fr_1.2fr_1.2fr] gap-3 px-6 py-3 border-b border-[#F3F4F5] text-[13px] text-[#9CA3AF]">
              <div>업체명</div>
              <div>문의 내용</div>
              <div>작성일</div>
              <div className="text-center">상태</div>
            </div>

            {/* 리스트 행들 */}
            <div>
              {filtered.map((q, index) => {
                const withSoftBackground = index === 1;

                // StatusBadge 인라인
                let statusBg = "";
                if (q.status === "대기") statusBg = "bg-[#FA9538]";
                if (q.status === "확정") statusBg = "bg-[#3DC061]";
                if (q.status === "취소") statusBg = "bg-[#EB5147]";

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelectInquiry(q.id)}
                    className="w-full text-left hover:bg-[#F9FAFB] transition"
                  >
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
                        <div className="text-[15px] text-[#111827]">
                          {q.title}
                        </div>
                      </div>
                      <div className="text-[13px] text-[#6B7280]">
                        {formatDate(q.createdAt)}
                      </div>
                      <div className="flex justify-center">
                        <div
                          className={[
                            "inline-flex min-w-[56px] h-[30px] px-3 items-center justify-center rounded-[999px]",
                            statusBg,
                          ].join(" ")}
                        >
                          <span className="text-white text-[13px] font-medium leading-[18px] tracking-[-0.2px]">
                            {q.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
