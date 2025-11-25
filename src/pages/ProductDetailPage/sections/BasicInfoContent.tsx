import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import type { NormalizedDetail } from "../../../type/product";

/* ========================= Types ========================= */

type BasicInfoContentProps = {
  data: NormalizedDetail;
  onOpenCoupon?: () => void;
  onGoReviewTab?: () => void; // 평점후기 탭 이동용 콜백
  onGoDetailTab?: () => void; // 상품상세 탭 이동용 콜백
};

type ReviewItem = {
  id: number;
  customerId: number;
  customerName: string;
  productId: number;
  star: number;
  title: string;
  comment: string;
  imageUrl?: string | null;
  satisfaction: "SATISFIED" | "NEUTRAL" | "DISSATISFIED" | string;
};

type ReviewResponse = {
  content: ReviewItem[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

/**
 * NormalizedDetail 에 실제로 들어오는 필드를 확장해서 사용하기 위한 타입
 * (id, averageRating, starCount, tags)
 */
type DetailWithMeta = NormalizedDetail & {
  id?: number | string;
  averageRating?: number;
  starCount?: number;
  tags?: Array<
    | string
    | {
        tagName?: string | null;
        name?: string | null;
      }
  >;
};

/* ========================= 태그 한글 매핑 ========================= */

const TAG_LABEL_MAP: Record<string, string> = {
  // 홀타입
  GENERAL: "일반",
  CONVENTION: "컨벤션",
  HOTEL: "호텔",
  HOUSE: "하우스",
  RESTAURANT: "레스토랑",
  HANOK: "한옥",
  CHURCH: "교회/성당",

  // 홀컨셉
  SMALL: "스몰",
  CHAPEL: "채플",
  OUTDOOR_GARDEN: "야외/가든",
  TRADITIONAL_WEDDING: "전통혼례",

  // 스타일
  PORTRAIT_FOCUSED: "인물중심",
  VARIED_BACKGROUND: "배경다양",
  PORTRAIT_AND_BACKGROUND: "인물+배경",

  // 촬영 가능
  GARDEN: "가든",
  NIGHT: "야간",
  ROAD: "로드",
  UNDERWATER: "수중",
  PET_FRIENDLY: "반려동물",

  // 행사
  SHOOTING_AND_CEREMONY: "촬영+본식",
  CEREMONY: "본식",
  SHOOTING: "촬영",

  // 주력소재
  SILK: "실크",
  LACE: "레이스",
  BEADS: "비즈",

  // 제작형태
  DOMESTIC: "국내",
  IMPORTED: "수입",
  DOMESTIC_AND_IMPORTED: "국내+수입",

  // 담당자
  DIRECTOR_OR_CEO: "원장/대표/이사",
  DEPUTY_DIRECTOR: "부원장",
  MANAGER: "실장",
  TEAM_LEADER_OR_DESIGNER: "팀장/디자이너",

  // 메이크업 스타일
  FRUITY_TONE: "과즙/색조",
  CLEAN_AND_BRIGHT: "깨끗/화사",
  CONTOUR_AND_SHADOW: "윤곽/음영",
};

/**
 * 백엔드에서 넘어오는 태그 값을 한글로 변환
 * - 영문 코드(GENERAL, CONVENTION, ...) 은 한글 매핑
 * - 이미 한글로 들어오면 그대로 노출
 */
const mapTagLabel = (value: string): string => {
  if (!value) return "";
  const key = value.toUpperCase(); // 영문 코드 기준 매핑
  return TAG_LABEL_MAP[key] ?? value; // 매핑 없으면 원본 그대로 사용
};

/* ========================= 컴포넌트 ========================= */

export const BasicInfoContent = ({
  data,
  onOpenCoupon,
  onGoReviewTab,
  onGoDetailTab,
}: BasicInfoContentProps) => {
  const handleOpenCouponClick = () => {
    if (onOpenCoupon) onOpenCoupon();
  };

  const handleReviewAllClick = () => {
    if (onGoReviewTab) onGoReviewTab();
  };

  const handleDetailAllClick = () => {
    if (onGoDetailTab) onGoDetailTab();
  };

  // ✅ data를 확장 타입으로 캐스팅 (any 사용 X)
  const detail = data as DetailWithMeta;

  // ✅ productId (리뷰 API 호출용)
  const productId = detail.id;

  // 메인 이미지 (첫 번째 이미지 사용)
  const mainImageUrl =
    data.images && data.images.length > 0 ? data.images[0].url : "";

  // 가격 표시 (예: 11000000 -> "11,000,000원")
  const priceText =
    typeof data.price === "number"
      ? `${data.price.toLocaleString("ko-KR")}원`
      : "";

  // ✅ 태그 정리 + 한글 매핑
  const rawTags = detail.tags ?? [];
  const tagLabels: string[] = rawTags
    .map((t) => {
      let raw = "";
      if (typeof t === "string") raw = t;
      else if (t && typeof t.tagName === "string") raw = t.tagName ?? "";
      else if (t && typeof t.name === "string") raw = t.name ?? "";

      raw = raw.trim();
      if (!raw) return "";

      // 영문 코드 → 한글 매핑
      return mapTagLabel(raw);
    })
    .filter((t) => t && t.trim().length > 0);

  const primaryTag = tagLabels[0];
  const secondaryTag = tagLabels[1];

  // ✅ 평점 / 리뷰 수 (상단 요약 영역)
  const averageRating = detail.averageRating;
  const starCount = detail.starCount;
  const hasRating = typeof starCount === "number";

  // ✅ 하단 리뷰 영역용 상태
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewTotalCount, setReviewTotalCount] = useState<number>(0);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  /* ========================= 리뷰 불러오기 ========================= */

  useEffect(() => {
    if (!productId) return;

    const controller = new AbortController();

    const fetchReviews = async () => {
      try {
        setIsReviewLoading(true);
        setReviewError(null);

        // 필요하면 여기 fetch 대신 프로젝트 api.get으로 변경해서 사용
        const res = await fetch(`/api/v1/products/${productId}/reviews`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to load reviews: ${res.status}`);
        }

        const json: ReviewResponse = await res.json();

        const list = Array.isArray(json.content) ? json.content : [];
        setReviews(list);
        setReviewTotalCount(
          typeof json.page?.totalElements === "number"
            ? json.page.totalElements
            : list.length
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        setReviewError("리뷰 정보를 불러오지 못했어요.");
      } finally {
        setIsReviewLoading(false);
      }
    };

    fetchReviews();

    return () => {
      controller.abort();
    };
  }, [productId]);

  return (
    <>
      {/* 메인 이미지 */}
      <div className="w-full h-[390px] bg-[#D9D9D9]">
        {mainImageUrl && (
          <img
            src={mainImageUrl}
            alt={data.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 상단 상품 요약 */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between">
          {/* 상단 작은 타이틀: 업체/상품명 */}
          <div className="flex items-center gap-1">
            <span className="text-[13px] text-[#999999] font-semibold">
              {data.bzName || "(임시) [브랜드명]"}
            </span>
            <Icon
              icon="mingcute:down-line"
              className="w-3.5 h-3.5 text-[#999999] -rotate-90"
            />
          </div>

          {/* 찜 영역 (현재 더미, 추후 API 연동 가능) */}
          <button type="button" className="flex items-center gap-1 px-2 py-1">
            <Icon
              icon="solar:heart-linear"
              className="w-4 h-4 text-[#000000]"
            />
            <span className="text-[11px] text-[#000000]">452</span>
          </button>
        </div>

        {/* 메인 타이틀 */}
        <h1 className="mt-1 text-[16px] font-semibold text-[#000000] leading-[1.6]">
          {data.name}
        </h1>

        {/* 평점 / 리뷰 */}
        {hasRating && (
          <div className="mt-1 flex items-center gap-1">
            <img src="/images/star4.png" alt="평점" className="h-3 w-3" />
            <span className="text-[12px] text-[#999999]">
              {typeof starCount === "number" ? starCount.toFixed(1) : starCount}
            </span>
            <span className="text-[12px] text-[#999999] ml-1">
              리뷰{" "}
              {reviewTotalCount ||
                (typeof averageRating === "number" ? averageRating : 0)}
              개
            </span>
          </div>
        )}

        {/* 가격 + 쿠폰 버튼 */}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-[24px] font-semibold text-[#000000] leading-[1.6]">
            {priceText || "가격 정보가 준비 중입니다."}
          </div>
          <button
            type="button"
            className="px-3 py-2 bg-[#1E2124] rounded-[4px] text-[13px] text-white"
            onClick={handleOpenCouponClick}
          >
            쿠폰 받기
          </button>
        </div>

        {/* 태그 / 뱃지 */}
        <div className="mt-1 flex items-center gap-2">
          {primaryTag && (
            <span className="px-2 py-[2px] bg-[#EFEBFF] rounded-[4px] text-[12px] font-semibold text-[#803BFF]">
              {primaryTag}
            </span>
          )}
          {secondaryTag && (
            <span className="px-2 py-[2px] bg-[#F5F5F5] rounded-[4px] text-[12px] font-semibold text-[#999999]">
              {secondaryTag}
            </span>
          )}

          {/* 태그가 하나도 없으면 기존 더미 유지 */}
          {!primaryTag && !secondaryTag && (
            <>
              <span className="px-2 py-[2px] bg-[#EFEBFF] rounded-[4px] text-[12px] font-semibold text-[#803BFF]">
                BEST
              </span>
              <span className="px-2 py-[2px] bg-[#F5F5F5] rounded-[4px] text-[12px] font-semibold text-[#999999]">
                재방문 1위
              </span>
            </>
          )}
        </div>
      </div>

      {/* 구분선 & 기본 정보 */}
      <div className="mt-6 w-full h-[8px] bg-[#F7F9FA]" />

      <div className="px-5 pt-4">
        <section className="mt-3">
          <h2 className="text-[16px] font-semibold text-[#1E2124] mb-3">
            상품 기본 정보
          </h2>

          {/* ✅ data.detail 그대로 노출 (줄바꿈 유지) */}
          <div className="text-[14px] text-[#1E2124] whitespace-pre-line">
            {data.detail && data.detail.trim().length > 0
              ? data.detail
              : "상품 기본 정보가 준비 중입니다."}
          </div>
        </section>
      </div>

      {/* 구분선 */}
      <div className="mt-4 w-full h-[1px] bg-[#F3F4F5]" />

      {/* 상품 상세 사진 썸네일: images 기반 썸네일 */}
      <div className="px-5 pt-4">
        <section className="mt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#1E2124]">
              상품 상세 사진
            </h2>
            <button
              type="button"
              className="flex items-center gap-1 text-[14px] text-[#666666]"
              onClick={handleDetailAllClick}
            >
              <span>전체보기</span>
              <Icon
                icon="mingcute:down-line"
                className="w-3.5 h-3.5 text-[#666666] -rotate-90"
              />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {data.images && data.images.length > 0
              ? data.images.slice(0, 6).map((img, index) => (
                  <div
                    key={`${img.id ?? img.url}-${index}`}
                    className="w-full aspect-square bg-white border border-[#F5F5F5] rounded-[4px] overflow-hidden"
                  >
                    <img
                      src={img.url}
                      alt={data.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full aspect-square bg-white border border-[#F5F5F5] rounded-[4px]"
                  />
                ))}
          </div>
        </section>
      </div>

      {/* 배너 */}
      <div className="mt-6 w-full h-[106px] bg-[#D9D9D9] flex items-center justify-center">
        <span className="text-[16px] font-semibold text-[#000000]">Banner</span>
      </div>

      {/* ========================= 리뷰 섹션 (가로 스크롤 카드) ========================= */}
      <div className="px-5 pt-4 pb-6">
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#1E2124]">리뷰</h2>
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-semibold text-[#999999]">
                  {reviewTotalCount}개
                </span>
                <Icon
                  icon="mingcute:down-line"
                  className="w-3.5 h-3.5 text-[#999999] -rotate-90"
                />
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-[14px] text-[#666666]"
              onClick={handleReviewAllClick}
            >
              <span>전체보기</span>
              <Icon
                icon="mingcute:down-line"
                className="w-3.5 h-3.5 text-[#666666] -rotate-90"
              />
            </button>
          </div>

          {/* 내용 영역 */}
          <div className="mt-3">
            {/* 로딩 */}
            {isReviewLoading && (
              <div className="p-3 bg-[#F7F9FA] rounded-[8px] text-[12px] text-[#999999]">
                리뷰를 불러오는 중입니다...
              </div>
            )}

            {/* 에러 */}
            {!isReviewLoading && reviewError && (
              <div className="p-3 bg-[#F7F9FA] rounded-[8px] text-[12px] text-[#FF4D4F]">
                {reviewError}
              </div>
            )}

            {/* 데이터 없음 */}
            {!isReviewLoading && !reviewError && reviews.length === 0 && (
              <div className="p-3 bg-[#F7F9FA] rounded-[8px] text-[12px] text-[#666666]">
                아직 등록된 리뷰가 없습니다.
              </div>
            )}

            {/* ✅ 리뷰 리스트: 가로 스크롤 카드 (디자인: F6F7FB, radius 8) */}
            {!isReviewLoading && !reviewError && reviews.length > 0 && (
              <div className="-mx-5 px-5">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="min-w-[237px] max-w-[237px] bg-[#F6F7FB] rounded-[8px] p-3 flex-shrink-0"
                    >
                      {/* 상단: 별점 + 작성자 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <Icon
                            icon="mdi:star"
                            className="w-4 h-4 text-[#FFC93A]"
                          />
                          <span className="text-[12px] font-semibold text-[#1E2124]">
                            {review.star?.toFixed
                              ? review.star.toFixed(1)
                              : review.star}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#999999] max-w-[120px] truncate text-right">
                          {review.customerName || "익명"}
                        </span>
                      </div>

                      {/* 타이틀 */}
                      {review.title && (
                        <p className="text-[12px] font-semibold text-[#1E2124] mb-1 truncate">
                          {review.title}
                        </p>
                      )}

                      {/* 코멘트 */}
                      {review.comment && (
                        <p className="text-[12px] text-[#666666] leading-[1.5] max-h-[54px] overflow-hidden">
                          {review.comment}
                        </p>
                      )}

                      {/* 이미지가 있는 경우 썸네일 */}
                      {review.imageUrl && (
                        <div className="mt-2 w-full h-[72px] rounded-[4px] overflow-hidden bg_white">
                          <img
                            src={review.imageUrl}
                            alt="리뷰 이미지"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};
