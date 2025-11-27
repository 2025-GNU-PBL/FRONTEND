import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import api from "../../../../../lib/api/axios";

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
  category?: string;
  createdAt?: string;
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

/** 화면에서 사용할 리뷰 타입 (createdAgo는 UI에 사용되지 않음) */
type Review = {
  id: string;
  brand: string;
  category: string;
  rating: number;
  createdAgo: string;
  content: string;
  thumbnail: string;
};

export default function WebView() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  // 삭제 확인 모달용
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const hasReviews = !loading && reviews.length > 0;

  /** API 응답 → UI 모델 */
  const mapToReview = (item: ReviewApiResponseItem): Review => ({
    id: String(item.id),
    brand: item.title || "상품명 미지정",
    category: item.category || "",
    rating: typeof item.star === "number" ? item.star : 0,
    createdAgo: "", // UI에서 사용 안함
    content: item.comment || "",
    thumbnail: item.imageUrl || "",
  });

  /** 리뷰 목록 불러오기 */
  useEffect(() => {
    const fetchMyReviews = async () => {
      try {
        setLoading(true);

        const { data } = await api.get<ReviewApiResponse>(
          "/api/v1/reviews/me",
          {
            params: { pageNumber: 1, pageSize: 50 },
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

  /** 실제 삭제 */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/v1/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("[Reviews/WebView] delete error:", err);
    }
  }, []);

  /** 모달 확인 버튼 */
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    await handleDelete(deleteTargetId);
    setDeleteTargetId(null);
  }, [deleteTargetId, handleDelete]);

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB] mt-15">
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
        </div>

        {/* 리스트 */}
        {loading ? (
          <section className="mt-8 bg-white rounded-2xl shadow-sm border border-[#E5E6EB] flex flex-col items-center justify-center py-16 gap-3 text-[14px] text-[#9CA3AF]">
            리뷰 내역을 불러오는 중입니다...
          </section>
        ) : hasReviews ? (
          <section className="bg-white rounded-2xl shadow-sm border border-[#E5E6EB]">
            {/* 헤더 라인 (작성 경과 제거됨) */}
            <div className="grid grid-cols-[2.2fr_3fr_0.8fr] gap-3 px-6 py-3 border-b border-[#F3F4F5] text-[13px] text-[#9CA3AF]">
              <div>상품 / 업체명</div>
              <div>별점 및 리뷰 내용</div>
              <div className="text-center">관리</div>
            </div>

            {/* 데이터 */}
            <div>
              {reviews.map((r, index) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  withSoftBackground={index % 2 === 1}
                  onClickDelete={setDeleteTargetId}
                />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* 삭제 모달 */}
      {deleteTargetId && (
        <DeleteConfirmModal
          title="리뷰를 삭제하시겠어요?"
          description="삭제한 리뷰는 다시 되돌릴 수 없어요."
          cancelText="취소"
          confirmText="삭제하기"
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

/** Row 컴포넌트 – 작성 경과 UI 완전 제거 */
function ReviewRow({
  review,
  withSoftBackground,
  onClickDelete,
}: {
  review: Review;
  withSoftBackground?: boolean;
  onClickDelete: (id: string) => void;
}) {
  return (
    <div
      className={[
        "grid grid-cols-[2.2fr_3fr_0.8fr] gap-3 px-6 py-4 border-t border-[#F3F4F5] items-center",
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
        </div>

        <p className="text-[13px] leading-[19px] text-[#4B5563] line-clamp-2">
          {review.content}
        </p>
      </div>

      {/* 삭제 버튼 */}
      <div className="flex justify-center">
        <button
          type="button"
          className="text-[13px] text-[#4B6FFF] hover:underline"
          onClick={() => onClickDelete(review.id)}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

/** 빈 상태 */
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

/** 삭제 모달 — 모바일과 동일 */
type DeleteConfirmModalProps = {
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

function DeleteConfirmModal({
  title,
  description,
  cancelText = "취소",
  confirmText = "삭제하기",
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-[335px] bg-white rounded-[14px] shadow-[4px_4px_10px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-start px-5 pt-6 pb-0 gap-2.5">
          <p className="text-[16px] font-bold text-[#1E2124]">{title}</p>
          <p className="text-[14px] text-[#9D9D9D]">{description}</p>
        </div>

        <div className="mt-4 flex flex-row items-center px-5 pb-6 pt-2 gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-[10px] bg-[#F3F4F5] flex items-center justify-center"
          >
            <span className="text-[14px] text-[#999999]">{cancelText}</span>
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-[10px] bg-[#FF2233] flex items-center justify-center"
          >
            <span className="text-[14px] text-white">{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
