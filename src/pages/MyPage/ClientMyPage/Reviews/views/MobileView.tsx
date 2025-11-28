import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";
import { toast } from "react-toastify";

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

  // 삭제 확인 모달용 타겟 id
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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

  /** 실제 삭제 로직 */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/v1/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("리뷰가 삭제되었습니다.");
    } catch (err) {
      console.error("[Reviews/MobileView] delete error:", err);
      toast.error(
        "리뷰 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      );
    }
  }, []);

  /** 모달에서 '삭제하기' 눌렀을 때 */
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    await handleDelete(deleteTargetId);
    setDeleteTargetId(null);
  }, [deleteTargetId, handleDelete]);

  /** 삭제 버튼 눌렀을 때 모달 오픈 */
  const openDeleteModal = useCallback((id: string) => {
    setDeleteTargetId(id);
  }, []);

  /** 모달에서 '취소' 눌렀을 때 */
  const closeDeleteModal = useCallback(() => {
    setDeleteTargetId(null);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#F3F4F5]">
        <MyPageHeader title="리뷰 내역" onBack={onBack} showMenu={false} />
      </div>

      {/* 내용 영역 */}
      <div className="flex-1 w-full overflow-y-auto">
        {loading ? (
          <div className="mt-30 flex-1 flex items-center justify-center text-[14px] text-[#999999]">
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
                <ReviewRow
                  key={r.id}
                  review={r}
                  onClickDelete={openDeleteModal}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-65">
            <EmptyState />
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTargetId && (
        <DeleteConfirmModal
          title="리뷰를 삭제하시겠어요?"
          description="삭제한 리뷰는 다시 되돌릴 수 없어요."
          cancelText="취소"
          confirmText="삭제하기"
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

/* ---------- Row / Empty 컴포넌트 ---------- */

function ReviewRow({
  review,
  onClickDelete,
}: {
  review: Review;
  onClickDelete: (id: string) => void;
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
          onClick={() => onClickDelete(review.id)}
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

/* ---------- 삭제 확인 모달 컴포넌트 ---------- */

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
        {/* 상단 텍스트 영역 */}
        <div className="flex flex-col items-start px-5 pt-6 pb-0 gap-2.5">
          <div className="flex flex-row items-start gap-3 w-full">
            <p className="flex items-center text-[16px] leading-[24px] font-bold tracking-[-0.2px] text-[#1E2124]">
              {title}
            </p>
          </div>
          <p className="flex items-center w-full text-[14px] leading-[21px] font-medium tracking-[-0.2px] text-[#9D9D9D]">
            {description}
          </p>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-4 flex flex-row items-center px-5 pb-6 pt-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-[10px] bg-[#F3F4F5] flex items-center justify-center"
          >
            <span className="text-[14px] leading-[21px] font-medium tracking-[-0.2px] text-[#999999]">
              {cancelText}
            </span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-11 rounded-[10px] bg-[#FF2233] flex items-center justify-center"
          >
            <span className="text-[14px] leading-[21px] font-medium tracking-[-0.2px] text-white">
              {confirmText}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
