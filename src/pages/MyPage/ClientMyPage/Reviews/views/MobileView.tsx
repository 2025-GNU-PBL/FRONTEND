import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";

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
  category?: string;
  createdAt: string;
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

  /** API 응답 → UI 모델 */
  const mapToReview = (item: ReviewApiResponseItem): Review => ({
    id: String(item.id),
    brand: item.title || "상품명 미지정",
    category: "",
    rating: item.star ?? 0,
    createdAgo: "",
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
        console.log(data);

        const list = (data?.content || []).map(mapToReview);
        setReviews(list);
      } catch (err) {
        console.error("[Reviews/MobileView] fetchMyReviews error:", err);
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
    } catch (err) {
      console.error("[Reviews/MobileView] delete error:", err);
    }
  }, []);

  return (
    <div className="w-full bg-white">
      <div className="relative mx-auto w-[390px] h-[844px] bg-white flex flex-col overflow-hidden">
        <div className="sticky top-0 z-20 bg-white border-b border-[#F3F4F5]">
          <MyPageHeader title="리뷰 내역" onBack={onBack} showMenu={false} />
        </div>

        <div className="flex-1 w-full overflow-y-auto">
          {loading ? (
            <div className=" mt-30 flex-1 flex items-center justify-center text-[14px] text-[#999999]">
              리뷰 내역을 불러오는 중입니다...
            </div>
          ) : hasReviews ? (
            <div className="mt-15">
              <div className="px-5 pt-5">
                <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                  리뷰 내역 {reviews.length}
                </span>
              </div>

              <div className="mt-3 flex flex-col">
                {reviews.map((r) => (
                  <ReviewRow key={r.id} review={r} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-65">
              <EmptyState />
            </div>
          )}
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

        <div className="flex-1 flex flex-col gap-1">
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

          <div className="text-[12px] leading-[18px] text-[#4B5563] line-clamp-2">
            {review.content}
          </div>
        </div>

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
    <div className="flex-1 flex flex-col items-center justify-center py-10">
      <img
        src="/images/document.png"
        className="w-[72px] h-[72px] text-[#D3D4D6] mb-4"
      />
      <div className="flex flex-col items-center">
        <p className="text-[18px] leading-[24px] font-semibold tracking-[-0.2px] text-black mb-2">
          작성한 리뷰 내역이 없어요
        </p>
        <p className="mb-1 text-[14px] leading-[18px] tracking-[-0.1px] text-[#999999]">
          이용한 상품의 리뷰를
        </p>
        <p className="text-[14px] leading-[18px] tracking-[-0.1px] text-[#999999]">
          작성해주세요
        </p>
      </div>
    </div>
  );
}
