import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

type Review = {
  id: string;
  brand: string;
  category: string;
  rating: number; // 0~5
  createdAgo: string; // "5일 전" 등
  content: string;
  thumbnail: string; // 이미지 URL (데모용)
};

// 데모 데이터 (MobileView와 동일한 구조)
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

export default function WebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [reviews, setReviews] = useState<Review[]>(SEED);
  const hasReviews = reviews.length > 0;

  const handleDelete = useCallback((id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 상단 고정 헤더 (마이페이지 내부 헤더 스타일) */}
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
              총 {reviews.length}개
            </span>
          </div>

          {hasReviews && (
            <div className="flex items-center gap-3 text-[12px] text-[#9CA3AF]">
              <span>※ 리뷰 삭제 시 복구가 어려울 수 있어요.</span>
            </div>
          )}
        </div>

        {/* 리스트 or 빈 화면 */}
        {hasReviews ? (
          <section className="bg-white rounded-2xl shadow-sm border border-[#E5E6EB]">
            {/* 헤더 라인 */}
            <div className="grid grid-cols-[2.2fr_3fr_1.2fr_0.8fr] gap-3 px-6 py-3 border-b border-[#F3F4F5] text-[13px] text-[#9CA3AF]">
              <div>상품 / 업체명</div>
              <div>별점 및 리뷰 내용</div>
              <div>작성일</div>
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

/** 리뷰 **/
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
          <span className="text-[12px] text-[#9CA3AF]">{review.category}</span>
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
          <span className="ml-1 text-[12px] text-[#9CA3AF]">
            {review.createdAgo}
          </span>
        </div>
        <p className="text-[13px] leading-[19px] text-[#4B5563] line-clamp-2">
          {review.content}
        </p>
      </div>

      {/* 작성일 */}
      <div className="text-[13px] text-[#6B7280]">{review.createdAgo}</div>

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

/** 웹 빈 상태 뷰 */
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
