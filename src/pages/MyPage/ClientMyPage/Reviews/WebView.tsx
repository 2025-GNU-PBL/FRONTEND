import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../lib/api/axios";

/** 서버 응답 DTO (백엔드 스펙 기준) */
type ReviewApiResponseItem = {
  id: number;
  customerId: number;
  customerName: string;
  productId: number;
  star: number;
  title: string; // 상품/업체명
  comment: string;
  imageUrl?: string | null;
  category?: string; // (선택) 추후 백엔드에서 내려줄 수 있음
  createdAt?: string; // "2025-11-07T12:00:00"
};

type ReviewApiResponse = {
  content: ReviewApiResponseItem[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

/** 화면에서 사용할 리뷰 타입 */
type Review = {
  id: string;
  brand: string;
  category: string;
  rating: number; // 0~5
  createdAgo: string; // "n일 전"
  content: string;
  thumbnail: string;
};

export default function WebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const hasReviews = !loading && reviews.length > 0;

  /** API 응답 → UI 모델 매핑 */
  const mapToReview = (item: ReviewApiResponseItem): Review => ({
    id: String(item.id),
    brand: item.title || "상품명 미지정",
    category: item.category || "", // 아직 없으면 빈 값
    rating: typeof item.star === "number" ? item.star : 0,
    createdAgo: formatAgo(item.createdAt),
    content: item.comment || "",
    thumbnail: item.imageUrl || "",
  });

  /** 내 리뷰 목록 조회 */
  useEffect(() => {
    const fetchMyReviews = async () => {
      try {
        setLoading(true);

        const { data } = await api.get<ReviewApiResponse>(
          "/api/v1/reviews/me",
          {
            params: {
              pageNumber: 1,
              pageSize: 50,
            },
          }
        );

        const list = (data?.content || []).map(mapToReview);
        setReviews(list);
      } catch (err) {
        console.error("[Reviews/WebView] fetchMyReviews error:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReviews();
  }, []);

  /** 리뷰 삭제 */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/v1/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      // TODO: 토스트로 "리뷰가 삭제되었습니다." 노출
    } catch (err) {
      console.error("[Reviews/WebView] delete error:", err);
      // TODO: 토스트로 "리뷰 삭제에 실패했습니다." 노출
    }
  }, []);

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
              리뷰 내역
            </h1>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-[#999999]">
            <span>마이페이지</span>
            <span className="w-[1px] h-3 bg-[#E5E6EB]" />
            <span>리뷰 관리</span>
          </div>
        </div>
      </header>

      {/* 콘텐츠 영역 */}
      <main className="max-w-[1200px] mx-auto px-6 pt-6 pb-10">
        {/* 상단 정보 */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-semibold text-black">
              작성한 리뷰
            </span>
            <span className="text-[13px] text-[#999999]">
              {loading ? "불러오는 중..." : `총 ${reviews.length}개`}
            </span>
          </div>

          {hasReviews && (
            <div className="flex items-center gap-3 text-[12px] text-[#9CA3AF]">
              <span>※ 리뷰 삭제 시 복구가 어려울 수 있어요.</span>
            </div>
          )}
        </div>

        {/* 리스트 or 빈 화면 */}
        {loading ? (
          <section className="mt-8 bg-white rounded-2xl shadow-sm border border-[#E5E6EB] flex flex-col items-center justify-center py-16 gap-3 text-[14px] text-[#9CA3AF]">
            리뷰 내역을 불러오는 중입니다...
          </section>
        ) : hasReviews ? (
          <section className="bg-white rounded-2xl shadow-sm border border-[#E5E6EB]">
            {/* 헤더 라인 */}
            <div className="grid grid-cols-[2.2fr_3fr_1.2fr_0.8fr] gap-3 px-6 py-3 border-b border-[#F3F4F5] text-[13px] text-[#9CA3AF]">
              <div>상품 / 업체명</div>
              <div>별점 및 리뷰 내용</div>
              <div>작성 경과</div>
              <div className="text-center">관리</div>
            </div>

            {/* 데이터 라인 */}
            <div>
              {reviews.map((r, index) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  withSoftBackground={index === 1}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

/** 리뷰 row */
function ReviewRow({
  review,
  withSoftBackground,
  onDelete,
}: {
  review: Review;
  withSoftBackground?: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={[
        "grid grid-cols-[2.2fr_3fr_1.2fr_0.8fr] gap-3 px-6 py-4 border-t border-[#F3F4F5] items-center",
        withSoftBackground ? "bg-[#F6F7FB]" : "bg-white",
      ].join(" ")}
    >
      {/* 상품 / 업체 */}
      <div className="flex items-center gap-3">
        <div className="w-[48px] h-[48px] rounded-full overflow-hidden bg-[#F3F4F5] flex items-center justify-center flex-shrink-0">
          {review.thumbnail ? (
            <img
              src={review.thumbnail}
              alt={review.brand}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon icon="solar:user-linear" className="w-6 h-6 text-[#D1D5DB]" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#111827]">
            {review.brand}
          </span>
          {review.category && (
            <span className="text-[12px] text-[#9CA3AF]">
              {review.category}
            </span>
          )}
        </div>
      </div>

      {/* 별점 + 리뷰 내용 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon
              key={i}
              icon={i < review.rating ? "solar:star-bold" : "solar:star-linear"}
              className={
                i < review.rating
                  ? "w-4 h-4 text-[#FFC107]"
                  : "w-4 h-4 text-[#E5E7EB]"
              }
            />
          ))}
          {review.createdAgo && (
            <span className="ml-1 text-[12px] text-[#9CA3AF]">
              {review.createdAgo}
            </span>
          )}
        </div>
        <p className="text-[13px] leading-[19px] text-[#4B5563] line-clamp-2">
          {review.content}
        </p>
      </div>

      {/* 작성 경과 (같은 createdAgo 재사용) */}
      <div className="text-[13px] text-[#6B7280]">
        {review.createdAgo || "-"}
      </div>

      {/* 삭제 */}
      <div className="flex justify-center">
        <button
          type="button"
          className="text-[13px] text-[#4B6FFF] hover:underline"
          onClick={() => onDelete(review.id)}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

/** 웹 빈 상태 */
function EmptyState() {
  return (
    <section className="mt-8 bg-white rounded-2xl shadow-sm border border-[#E5E6EB] flex flex-col items-center justify-center py-16 gap-5">
      <Icon
        icon="solar:document-linear"
        className="w-[80px] h-[80px] text-[#D3D4D6]"
      />
      <div className="flex flex-col items-center gap-1">
        <p className="text-[18px] font-semibold text-black">
          작성한 리뷰 내역이 없어요
        </p>
        <p className="text-[13px] text-[#9CA3AF]">
          이용한 상품의 리뷰를 작성해주세요
        </p>
      </div>
    </section>
  );
}

/** createdAt ISO → "n일 전" 등으로 변환 */
function formatAgo(iso?: string): string {
  if (!iso) return "";
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월 전`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}년 전`;
}
