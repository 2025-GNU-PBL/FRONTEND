// ../sections/ReviewContent.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";
import api from "../../../lib/api/axios";

type Review = {
  id: number;
  userNameMasked: string; // 예: "이**"
  rating: number; // 1~5
  createdAtText: string; // 예: "1주 전" (API에 없어서 더미값)
  images?: string[]; // 이미지 경로 배열, 없으면 포토 없는 리뷰
  scheduleAnswer: string; // 예: "만족해요" (더미)
  photoSimilarAnswer: string; // 예: "보통이에요" (더미)
  content: string;
};

type ReviewApiItem = {
  id: number;
  customerId: number;
  customerName: string;
  productId: number;
  star: number;
  title: string;
  comment: string;
  imageUrl: string | null;
  satisfaction: "SATISFIED" | "NEUTRAL" | "UNSATISFIED";
};

type ReviewApiResponse = {
  content: ReviewApiItem[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

type ReviewContentProps = {
  targetId: number;
};

const PAGE_SIZE = 10;

const ReviewContent: React.FC<ReviewContentProps> = ({ targetId }) => {
  // 실제 리뷰 리스트
  const [reviews, setReviews] = useState<Review[]>([]);
  // 포토리뷰 필터 on/off
  const [photoOnly, setPhotoOnly] = useState(false);
  // 페이지네이션 & 로딩 상태
  const [pageNumber, setPageNumber] = useState(1); // 다음에 불러올 pageNumber
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "리뷰가 도움이 되었나요?" 선택 상태 (리뷰별)
  const [helpfulStates, setHelpfulStates] = useState<
    Record<number, "YES" | "NO" | undefined>
  >({});
  // 무한 스크롤용 sentinel
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // 실제 동시 호출을 막기 위한 ref
  const isFetchingRef = useRef(false);

  // API 응답을 화면용 Review 타입으로 매핑
  const mapApiItemToReview = (item: ReviewApiItem): Review => {
    // 이름 마스킹: 첫 글자 + "**"
    const name = item.customerName || "";
    const firstChar = name.length > 0 ? name[0] : "고객";
    const userNameMasked = `${firstChar}**`;

    // createdAt 정보가 없어서 더미값 사용
    const createdAtText = "1주 전";

    // 이미지: imageUrl 하나만 내려오므로 배열로 감싸서 사용
    const images =
      item.imageUrl && item.imageUrl.trim().length > 0 ? [item.imageUrl] : [];

    // 스키마에 없는 값들은 기존 더미값 유지
    const scheduleAnswer = "만족해요";
    const photoSimilarAnswer = "보통이에요";

    const content = item.comment?.trim().length
      ? item.comment
      : item.title || "";

    return {
      id: item.id,
      userNameMasked,
      rating: item.star,
      createdAtText,
      images,
      scheduleAnswer,
      photoSimilarAnswer,
      content,
    };
  };

  // 초기 로딩: productId(targetId) 바뀔 때마다 첫 페이지부터 다시 로드
  useEffect(() => {
    let isMounted = true;

    // product 변경 시 fetch 상태 초기화
    isFetchingRef.current = false;

    const fetchFirstPage = async () => {
      setLoading(true);
      setError(null);
      setReviews([]);
      setHasMore(true);
      setPageNumber(1);

      try {
        const { data } = await api.get<ReviewApiResponse>(
          `/api/v1/products/${targetId}/reviews`,
          {
            params: {
              pageNumber: 1,
              pageSize: PAGE_SIZE,
            },
          }
        );
        console.log("first page data:", data);

        if (!isMounted) return;

        const mapped = data.content.map(mapApiItemToReview);

        // 첫 페이지도 혹시 모를 중복 방지
        const uniqueFirst = mapped.filter(
          (review, index, self) =>
            index === self.findIndex((r) => r.id === review.id)
        );

        setReviews(uniqueFirst);

        const total = data.page?.totalElements ?? uniqueFirst.length;
        setHasMore(uniqueFirst.length < total && uniqueFirst.length > 0);

        // 다음에 불러올 페이지 번호
        setPageNumber(2);
      } catch (e) {
        if (!isMounted) return;
        setError("리뷰를 불러오는 중 오류가 발생했어요.");
        setHasMore(false);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchFirstPage();

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  // 추가 페이지 로딩 (무한 스크롤용)
  const loadMore = useCallback(async () => {
    // ref 기준으로 동시 호출 방지
    if (isFetchingRef.current || !hasMore) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<ReviewApiResponse>(
        `/api/v1/products/${targetId}/reviews`,
        {
          params: {
            pageNumber,
            pageSize: PAGE_SIZE,
          },
        }
      );
      console.log("loadMore page:", pageNumber, data);

      const mapped = data.content.map(mapApiItemToReview);

      setReviews((prev) => {
        const merged = [...prev, ...mapped];

        // id 기준으로 중복 제거
        const unique = merged.filter(
          (review, index, self) =>
            index === self.findIndex((r) => r.id === review.id)
        );

        const total = data.page?.totalElements ?? unique.length;

        // 더 이상 가져올 게 없으면 hasMore false
        if (mapped.length === 0 || unique.length >= total) {
          setHasMore(false);
        }

        return unique;
      });

      setPageNumber((prev) => prev + 1);
    } catch (e) {
      setError("리뷰를 불러오는 중 오류가 발생했어요.");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [targetId, pageNumber, hasMore]);

  // IntersectionObserver로 무한 스크롤 구현
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          loadMore();
        }
      },
      {
        threshold: 1.0,
      }
    );

    observer.observe(loaderRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  // 포토리뷰 필터 적용된 리스트
  const filteredReviews = useMemo(() => {
    if (!photoOnly) return reviews;
    return reviews.filter((r) => r.images && r.images.length > 0);
  }, [photoOnly, reviews]);

  // "리뷰가 도움이 되었나요?" 버튼 클릭 핸들러
  const handleHelpfulClick = (reviewId: number, value: "YES" | "NO") => {
    setHelpfulStates((prev) => ({
      ...prev,
      [reviewId]: value,
    }));
  };

  return (
    <div className="w-full bg-white relative">
      {/* 내용 영역 - 상단/하단 패딩만 주고, 스크롤은 부모(main)에서 처리 */}
      <div className="pt-5 pb-6">
        {/* 필터 영역 */}
        <section className="w-full flex items-center justify-between px-5 pb-5">
          {/* 포토리뷰 토글 버튼 */}
          <button
            type="button"
            onClick={() => setPhotoOnly((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-md"
          >
            <Icon
              icon="mingcute:checkbox-fill"
              className={`w-6 h-6 ${
                photoOnly ? "text-[#FF2233]" : "text-[#D0D0D0]"
              }`}
            />
            <span
              className={`text-[14px] leading-[21px] tracking-[-0.02em] ${
                photoOnly ? "text-[#FF2233]" : "text-[#949BA0]"
              }`}
            >
              포토리뷰
            </span>
          </button>

          <button type="button" className="flex items-center gap-1 rounded-md">
            <span className="text-[14px] leading-[21px] text-[#000000] tracking-[-0.02em]">
              별점 높은 순
            </span>
            <Icon
              icon="solar:alt-arrow-down-linear"
              className="w-4 h-4 text-[#999999]"
            />
          </button>
        </section>

        {/* 에러 메시지 */}
        {error && (
          <div className="px-5 pb-3 text-[12px] leading-[18px] text-[#FF2233]">
            {error}
          </div>
        )}

        {/* 리뷰 리스트 */}
        {filteredReviews.length === 0 && !loading && !error && (
          <div className="px-5 py-6 text-[14px] leading-[21px] text-[#999999]">
            아직 등록된 리뷰가 없어요.
          </div>
        )}

        {filteredReviews.map((review, idx) => {
          const helpful = helpfulStates[review.id];

          const yesSelected = helpful === "YES";
          const noSelected = helpful === "NO";

          return (
            <React.Fragment key={review.id}>
              <section className="px-5 pb-5">
                {/* 이름 + 별점 + 작성 시점 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[14px] leading-[21px] text-[#000000] tracking-[-0.02em]">
                        {review.userNameMasked}
                      </span>
                      <div className="flex items-center">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Icon
                            key={i}
                            icon="mdi:star"
                            className="w-5 h-5 text-[#FFD900]"
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[12px] leading-[18px] text-[#999999] tracking-[-0.01em]">
                      {review.createdAtText}
                    </span>
                  </div>
                </div>

                {/* 이미지 영역 (이미지가 있는 리뷰만) */}
                {review.images && review.images.length > 0 && (
                  <div className="mt-4 flex gap-1">
                    {review.images.slice(0, 2).map((src, i) => (
                      <div
                        key={i}
                        className="w-[110px] h-[110px] rounded-lg border border-[#F5F5F5] bg-center bg-cover"
                        style={{ backgroundImage: `url(${src})` }}
                      />
                    ))}
                  </div>
                )}

                {/* 체크리스트 박스 */}
                <div className="mt-4 w-full rounded-[4px] bg-[#F9F9FC] p-2.5">
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] leading-[18px] text-[#999999] tracking-[-0.01em]">
                        일정이 잘 지켜졌나요?
                      </span>
                      <span className="text-[12px] leading-[18px] text-[#999999] tracking-[-0.01em]">
                        사진과 비슷했나요?
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] leading-[18px] text-[#666666] tracking-[-0.01em]">
                        {review.scheduleAnswer}
                      </span>
                      <span className="text-[12px] leading-[18px] text-[#666666] tracking-[-0.01em]">
                        {review.photoSimilarAnswer}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 리뷰 본문 */}
                <p className="mt-3 w-full max-w-[245px] text-[14px] leading-[21px] tracking-[-0.02em] text-[#1E2124]">
                  {review.content}
                </p>

                {/* 도움이 되었나요 영역 */}
                <div className="mt-5 w-full flex flex-col items-center gap-2">
                  <span className="w-full text-center text-[12px] leading-[18px] tracking-[-0.01em] text-[#999999]">
                    리뷰가 도움이 되었나요?
                  </span>
                  <div className="w-full flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleHelpfulClick(review.id, "YES")}
                      className={`flex-1 h-[34px] border rounded-[8px] flex items-center justify-center px-2 ${
                        yesSelected ? "border-[#FF2233]" : "border-[#999999]"
                      }`}
                    >
                      <span
                        className={`text-[12px] leading-[18px] tracking-[-0.01em] ${
                          yesSelected ? "text-[#FF2233]" : "text-[#999999]"
                        }`}
                      >
                        도움이 돼요
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHelpfulClick(review.id, "NO")}
                      className={`flex-1 h-[34px] border rounded-[8px] flex items-center justify-center px-2 ${
                        noSelected ? "border-[#FF2233]" : "border-[#999999]"
                      }`}
                    >
                      <span
                        className={`text-[12px] leading-[18px] tracking-[-0.01em] ${
                          noSelected ? "text-[#FF2233]" : "text-[#999999]"
                        }`}
                      >
                        도움이 안 돼요
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 리뷰들 사이 구분선 */}
              {idx !== filteredReviews.length - 1 && (
                <div className="w-full h-2 bg-[#F7F9FA] mb-5" />
              )}
            </React.Fragment>
          );
        })}

        {/* 무한 스크롤 로더 영역 */}
        <div
          ref={loaderRef}
          className="w-full h-6 flex items-center justify-center"
        >
          {loading && (
            <span className="text-[12px] leading-[18px] text-[#999999]">
              리뷰를 불러오는 중입니다...
            </span>
          )}
          {!hasMore && !loading && reviews.length > 0 && (
            <span className="text-[12px] leading-[18px] text-[#C0C4C7]">
              더 이상 불러올 리뷰가 없어요.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewContent;
