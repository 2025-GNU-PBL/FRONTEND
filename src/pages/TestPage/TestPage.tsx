import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

type Review = {
  id: number;
  userNameMasked: string; // 예: "이**"
  rating: number; // 1~5
  createdAtText: string; // 예: "1주 전"
  images?: string[]; // 이미지 경로 배열, 없으면 포토 없는 리뷰
  scheduleAnswer: string; // 예: "만족해요"
  photoSimilarAnswer: string; // 예: "보통이에요"
  content: string;
};

const reviews: Review[] = [
  {
    id: 1,
    userNameMasked: "이**",
    rating: 5,
    createdAtText: "1주 전",
    images: ["/images/review-1.png", "/images/review-2.png"],
    scheduleAnswer: "만족해요",
    photoSimilarAnswer: "보통이에요",
    content:
      "이른 시간에 할 수 있어서 좋았고, 원하는 스타일을 반영해주셔서 좋았습니다! 빠른 시간 내에 마무리되어 좋았어요.... 더보기",
  },
  {
    id: 2,
    userNameMasked: "이**",
    rating: 5,
    createdAtText: "1주 전",
    images: [], // 이미지 없으면 그냥 [] 또는 undefined
    scheduleAnswer: "만족해요",
    photoSimilarAnswer: "보통이에요",
    content:
      "이른 시간에 할 수 있어서 좋았고, 원하는 스타일을 반영해주셔서 좋았습니다! 빠른 시간 내에 마무리되어 좋았어요.... 더보기",
  },
];

const TestPage: React.FC = () => {
  // 포토리뷰 필터 on/off
  const [photoOnly, setPhotoOnly] = useState(false);

  const filteredReviews = useMemo(() => {
    if (!photoOnly) return reviews;
    return reviews.filter((r) => r.images && r.images.length > 0);
  }, [photoOnly]);

  return (
    <div className="w-[390px] min-h-screen mx-auto bg-white relative">
      {/* 상단 헤더 제거 완료 */}

      {/* 내용 스크롤 영역 (하단 고정 푸터 높이만큼 패딩) */}
      <div className="pt-5 pb-[150px] overflow-y-auto">
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

        {/* 리뷰 리스트 */}
        {filteredReviews.map((review, idx) => (
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
              <p className="mt-3 w-[245px] text-[14px] leading-[21px] tracking-[-0.02em] text-[#1E2124]">
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
                    className="flex-1 h-[34px] border border-[#999999] rounded-[8px] flex items-center justify-center px-2"
                  >
                    <span className="text-[12px] leading-[18px] tracking-[-0.01em] text-[#999999]">
                      도움이 돼요
                    </span>
                  </button>
                  <button
                    type="button"
                    className="flex-1 h-[34px] border border-[#999999] rounded-[8px] flex items-center justify-center px-2"
                  >
                    <span className="text-[12px] leading-[18px] tracking-[-0.01em] text-[#999999]">
                      도움이 안 돼요
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* 리뷰들 사이 구분선 */}
            {idx !== filteredReviews.length - 1 && (
              <div className="w-full h-2 bg-[#F7F9FA]" />
            )}
          </React.Fragment>
        ))}

        {/* 마지막 뒤에도 회색 구분 영역 하나 넣고 싶다면 아래 활성화
        <div className="w-full h-2 bg-[#F7F9FA]" />
        */}
      </div>

      {/* 하단 구매하기 바 - 화면 하단 고정 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] bg-white border-t border-[#E8E8E8] px-5 py-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-14 h-14 rounded-[8px] bg-white flex items-center justify-center"
          >
            <Icon
              icon="solar:heart-linear"
              className="w-6 h-6 text-[#000000]"
            />
          </button>
          <button
            type="button"
            className="flex-1 h-14 rounded-[12px] bg-[#FF2233] flex items-center justify-center"
          >
            <span className="text-[16px] leading-[26px] font-semibold text-white tracking-[-0.02em]">
              구매하기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
