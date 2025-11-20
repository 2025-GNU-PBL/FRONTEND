// sections/BasicInfoContent.tsx
import { Icon } from "@iconify/react";
import type { Category, NormalizedDetail } from "../../../type/product";

/* ========================= Props ========================= */

type BasicInfoContentProps = {
  data: NormalizedDetail;
  category: Category;
  onOpenCoupon?: () => void;
  onGoReviewTab?: () => void; // 평점후기 탭 이동용 콜백
};

/* ========================= 컴포넌트 ========================= */

export const BasicInfoContent = ({
  data,
  category,
  onOpenCoupon,
  onGoReviewTab,
}: BasicInfoContentProps) => {
  const handleOpenCouponClick = () => {
    if (onOpenCoupon) onOpenCoupon();
  };

  const handleReviewAllClick = () => {
    if (onGoReviewTab) onGoReviewTab();
  };

  // 메인 이미지 (첫 번째 이미지 사용)
  const mainImageUrl =
    data.images && data.images.length > 0 ? data.images[0].url : "";

  // 가격 표시 (예: 11000000 -> "11,000,000원")
  const priceText =
    typeof data.price === "number"
      ? `${data.price.toLocaleString("ko-KR")}원`
      : "";

  // ✅ 태그 정리
  // 주신 예시: tags: ["SMALL"]
  // 혹시 다른 카테고리가 객체 배열(tagName 등)일 수도 있으니 둘 다 처리
  const rawTags = (data.tags ?? []) as any[];
  const tagLabels: string[] = rawTags
    .map((t) =>
      typeof t === "string"
        ? t
        : typeof t?.tagName === "string"
        ? t.tagName
        : typeof t?.name === "string"
        ? t.name
        : ""
    )
    .filter((t) => t && t.trim().length > 0);

  const primaryTag = tagLabels[0];
  const secondaryTag = tagLabels[1];

  // ✅ 평점 / 리뷰 수
  // 예시 데이터:
  // "starCount": 4.9,
  // "averageRating": 5
  // => 4.9점, 리뷰 5개로 해석
  const averageRating = (data as any).averageRating;
  const starCount = (data as any).starCount;

  const hasRating = typeof averageRating === "number";
  const ratingValue = hasRating ? averageRating.toFixed(1) : null;
  const reviewCount =
    typeof starCount === "number" ? (starCount as number) : null;

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
        {hasRating && ratingValue && (
          <div className="mt-1 flex items-center gap-1">
            <img src="/images/star2.png" alt="평점" className="h-3 w-3" />
            <span className="text-[12px] text-[#999999]">{ratingValue}</span>
            {typeof reviewCount === "number" && (
              <span className="text-[12px] text-[#999999]">
                리뷰 {reviewCount}개
              </span>
            )}
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

      {/* 리뷰 요약 */}
      <div className="px-5 pt-4 pb-6">
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#1E2124]">리뷰</h2>
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-semibold text-[#999999]">
                  {typeof reviewCount === "number" ? `${reviewCount}개` : "0개"}
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

          <div className="mt-3 space-y-2 text-[12px] text-[#666666]">
            <div className="p-3 bg-[#F7F9FA] rounded-[8px]">
              실제 이용 고객들의 후기가 여기에 노출됩니다.
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
