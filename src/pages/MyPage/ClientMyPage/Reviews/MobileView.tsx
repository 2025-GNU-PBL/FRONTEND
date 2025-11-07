import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../components/MyPageHeader";

type Review = {
  id: string;
  brand: string;
  category: string;
  rating: number; // 0~5
  createdAgo: string; // "5일 전" 등
  content: string;
  thumbnail: string; // 이미지 URL (데모용)
};

// 데모 데이터
const SEED: Review[] = [
  {
    id: "r1",
    brand: "루이즈브랭",
    category: "드레스",
    rating: 5,
    createdAgo: "5일 전",
    content:
      "하객들이 극찬한 최신급 식사 퀄리티 덕분에 모두가 만족했던 웨딩이었어요.",
    thumbnail:
      "https://images.pexels.com/photos/3738085/pexels-photo-3738085.jpeg?auto=compress&w=200",
  },
  {
    id: "r2",
    brand: "루이즈브랭",
    category: "드레스",
    rating: 5,
    createdAgo: "5일 전",
    content:
      "드레스 핏이 너무 예쁘고 상담해주시는 분도 친절해서 준비 과정이 편했어요.",
    thumbnail:
      "https://images.pexels.com/photos/3738085/pexels-photo-3738085.jpeg?auto=compress&w=200",
  },
  {
    id: "r3",
    brand: "루이즈브랭",
    category: "드레스",
    rating: 4,
    createdAgo: "5일 전",
    content: "전체적으로 만족스러웠고, 다음에 또 이용하고 싶어요.",
    thumbnail:
      "https://images.pexels.com/photos/3738085/pexels-photo-3738085.jpeg?auto=compress&w=200",
  },
  {
    id: "r4",
    brand: "루이즈브랭",
    category: "드레스",
    rating: 5,
    createdAgo: "5일 전",
    content: "사진보다 실물이 더 예뻐요. 추천합니다!",
    thumbnail:
      "https://images.pexels.com/photos/3738085/pexels-photo-3738085.jpeg?auto=compress&w=200",
  },
];

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  // 🔹 리뷰 목록 상태로 관리 (삭제 반영 위해)
  const [reviews, setReviews] = useState<Review[]>(SEED);

  const hasReviews = reviews.length > 0;

  // 🔹 삭제 핸들러
  const handleDelete = useCallback((id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div className="w-full bg-white">
      {/* 화면 프레임(390×844) */}
      <div className="relative mx-auto w-[390px] h-[844px] bg-white flex flex-col overflow-hidden">
        {/* 상단 헤더 (기존 컴포넌트 사용) */}
        <div className="sticky top-0 z-20 bg-white border-b border-[#F3F4F5]">
          <MyPageHeader title="리뷰 내역" onBack={onBack} showMenu={false} />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 w-full overflow-y-auto">
          {hasReviews ? (
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
            <span>{review.category}</span>
            <span className="w-[2px] h-[2px] rounded-full bg-[#D4D4D4]" />
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
