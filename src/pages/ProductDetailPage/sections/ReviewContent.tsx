// sections/ReviewContent.tsx
import type { Category } from "../../../type/product";

/* ========================= Props ========================= */

type ReviewContentProps = {
  targetId: number;
  category: Category;
};

/* ========================= 컴포넌트 ========================= */

export const ReviewContent = ({ targetId, category }: ReviewContentProps) => {
  // 추후 실제 리뷰 API 연동 시
  // category, targetId를 사용해서 엔드포인트 분기하면 됨.

  return (
    <>
      {/* 평점 상단 영역 */}
      <div className="w-full px-5 pt-5 pb-4 bg-[#F7F9FA]">
        <h2 className="text-[16px] font-semibold text-[#111111] mb-2">
          실사용자 평점
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[30px] font-semibold text-[#000000]">
              4.9
            </span>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <img
                  key={i}
                  src="/images/star2.png"
                  alt="별점"
                  className="w-3.5 h-3.5"
                />
              ))}
            </div>
            <span className="mt-1 text-[11px] text-[#888888]">
              1,454개의 리뷰
            </span>
          </div>
          <div className="flex-1 space-y-1 text-[10px] text-[#666666]">
            <div className="flex items-center gap-2">
              <span>5점</span>
              <div className="flex-1 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                <div className="h-full w-[90%] bg-[#FFCC00]" />
              </div>
              <span>1,200</span>
            </div>
            <div className="flex items-center gap-2">
              <span>4점</span>
              <div className="flex-1 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                <div className="h-full w-[7%] bg-[#FFCC00]" />
              </div>
              <span>180</span>
            </div>
            <div className="flex items-center gap-2">
              <span>3점 이하</span>
              <div className="flex-1 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                <div className="h-full w-[3%] bg-[#FFCC00]" />
              </div>
              <span>74</span>
            </div>
          </div>
        </div>
      </div>

      {/* 리뷰 정렬/필터 영역 */}
      <div className="px-5 pt-3 flex items-center justify-between text-[10px] text-[#777777]">
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded-full bg-[#111111] text-white">
            최신순
          </button>
          <button className="px-2 py-1 rounded-full bg-[#F3F3F3]">
            평점 높은순
          </button>
          <button className="px-2 py-1 rounded-full bg-[#F3F3F3]">
            포토 리뷰
          </button>
        </div>
        <button className="text-[#999999]">리뷰 작성하기</button>
      </div>

      {/* 리뷰 리스트 */}
      <div className="px-5 pt-3 pb-8 space-y-3 text-[11px] text-[#444444]">
        <div className="border border-[#F0F0F0] rounded-[8px] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">dk*****</span>
            <span className="text-[9px] text-[#A0A0A0]">2025.09.12</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <img
                key={i}
                src="/images/star2.png"
                alt="별점"
                className="w-3 h-3"
              />
            ))}
          </div>
          <p className="leading-[1.6]">
            드레스 퀄리티 좋고 상담이 세심해서 만족했습니다. 촬영 결과물도 기대
            이상이에요.
          </p>
        </div>

        <div className="border border-[#F0F0F0] rounded-[8px] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">so*****</span>
            <span className="text-[9px] text-[#A0A0A0]">2025.08.30</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <img
                key={i}
                src="/images/star2.png"
                alt="별점"
                className="w-3 h-3"
              />
            ))}
          </div>
          <p className="leading-[1.6]">
            피팅룸이 프라이빗해서 편했어요. 여러 벌 입어보면서 천천히 결정할 수
            있었습니다.
          </p>
        </div>

        <button
          type="button"
          className="w-full mt-1 h-[40px] border border-[#E0E0E0] rounded-[8px] text-[11px] text-[#666666]"
        >
          리뷰 더 보기
        </button>
      </div>
    </>
  );
};
