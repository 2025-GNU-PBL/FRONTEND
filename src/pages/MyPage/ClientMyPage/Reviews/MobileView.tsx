import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../components/MyPageHeader";
import api from "../../../../lib/api/axios";

/** 서버 응답 DTO  */
type ReviewApiResponseItem = {
  id: number;
  customerId: number;
  customerName: string;
  productId: number;
  star: number;
  title: string; // brand
  comment: string;
  imageUrl?: string | null;
  category?: string; // 추후 벡엔드 수정 예정
  createdAt: string; // "2025-11-07T12:00:00"
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
  rating: number;
  createdAgo: string;
  content: string;
  thumbnail: string;
};

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const hasReviews = !loading && reviews.length > 0;

  /** API 응답 → UI 모델 매핑 */
  const mapToReview = (item: ReviewApiResponseItem): Review => ({
    id: String(item.id),
    brand: item.title || "상품명 미지정", // title을 브랜드처럼 노출
    category: "", // 서버에 없으니 공백으로 처리
    rating: item.star ?? 0, // star → rating
    createdAgo: "", // createdAt이 없으니 빈 문자열 (추후 백엔드 추가 시 교체)
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
        console.error("[Reviews/MobileView] fetchMyReviews error:", err);
        // TODO: 토스트로 "리뷰 목록을 불러오지 못했습니다." 노출
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
      // 서버 삭제 요청
      await api.delete(`/api/v1/reviews/${id}`);

      // 로컬 상태에서도 제거
      setReviews((prev) => prev.filter((r) => r.id !== id));

      // TODO: 토스트로 "리뷰가 삭제되었습니다." 노출
    } catch (err) {
      console.error("[Reviews/MobileView] delete error:", err);
      // TODO: 토스트로 "리뷰 삭제에 실패했습니다." 노출
    }
  }, []);

  return (
    <div className="w-full bg-white">
      {/* 화면 프레임(390×844) */}
      <div className="relative mx-auto w-[390px] h-[844px] bg-white flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-20 bg-white border-b border-[#F3F4F5]">
          <MyPageHeader title="리뷰 내역" onBack={onBack} showMenu={false} />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 w-full overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[14px] text-[#999999]">
              리뷰 내역을 불러오는 중입니다...
            </div>
          ) : hasReviews ? (
            <>
              {/* 상단: 리뷰 개수 */}
              <div className="px-5 pt-5">
                <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                  리뷰 내역 {reviews.length}
                </span>
              </div>

              {/* 리뷰 리스트 */}
              <div className="mt-3 flex flex-col">
                {reviews.map((r) => (
                  <ReviewRow key={r.id} review={r} onDelete={handleDelete} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* 하단 Home Indicator */}
        <div className="w-full h-[34px] flex items-end justify-center">
          <div className="w-[134px] h-[5px] mb-2 bg-black rounded-[100px]" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Row / Empty 컴포넌트 ---------- */

function ReviewRow({
  review,
  onDelete,
}: {
  review: Review;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="px-5">
      <div className="w-full py-4 flex flex-row items-start gap-3 border-b border-[#F3F4F5]">
        {/* 썸네일 (원형) */}
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

        {/* 텍스트 영역 */}
        <div className="flex-1 flex flex-col gap-1">
          {/* 상단: 브랜드 / 카테고리 / 작성일 */}
          <div className="flex items-center gap-1 text-[12px] leading-[18px] text-[#999999]">
            <span className="text-[14px] font-semibold text-[#111111] mr-1">
              {review.brand}
            </span>
            {review.category && <span>{review.category}</span>}
            {review.category && (
              <span className="w-[2px] h-[2px] rounded-full bg-[#D4D4D4]" />
            )}
            <span>{review.createdAgo}</span>
          </div>

          {/* 별점 */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                icon={
                  i < review.rating ? "solar:star-bold" : "solar:star-linear"
                }
                className={
                  i < review.rating
                    ? "w-4 h-4 text-[#FFC107]"
                    : "w-4 h-4 text-[#E5E7EB]"
                }
              />
            ))}
          </div>

          {/* 내용 한 줄 요약 */}
          <div className="text-[12px] leading-[18px] text-[#4B5563] line-clamp-2">
            {review.content}
          </div>
        </div>

        {/* 삭제 버튼 */}
        <button
          type="button"
          className="ml-2 mt-1 text-[12px] leading-[18px] text-[#4B6FFF]"
          onClick={() => onDelete(review.id)}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <Icon
        icon="solar:document-linear"
        className="w-[72px] h-[72px] text-[#D3D4D6]"
      />
      <div className="flex flex-col items-center gap-1">
        <p className="text-[16px] leading-[24px] font-semibold tracking-[-0.2px] text-black">
          작성한 리뷰 내역이 없어요
        </p>
        <p className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
          이용한 상품의 리뷰를
        </p>
        <p className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
          작성해주세요
        </p>
      </div>
    </div>
  );
}

/* ---------- 유틸 ---------- */

/** createdAt ISO → "n일 전" 등으로 변환 (값 없으면 빈 문자열) */
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
