// WebView.jsx

const WebView = () => {
  return (
    <div className="w-full min-h-screen bg-[#F7F9FA] text-[#1E2124] mt-15">
      {/* 상단 고정 헤더 */}
      <header className="w-full bg-white border-b border-[#E0E5EB]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* 좌측: 로고/뒤로가기 */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E0E5EB] hover:bg-[#F7F9FA] transition"
            >
              <span
                className="iconify"
                data-icon="mingcute:arrow-left-line"
                data-width="18"
                data-height="18"
              />
            </button>
            <div className="text-lg font-semibold tracking-tight">
              웨딩 스튜디오 마켓
            </div>
          </div>

          {/* 중앙: 탭 */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button className="pb-1 border-b-2 border-[#1E2124] text-[#1E2124]">
              기본정보
            </button>
            <button className="pb-1 text-[#999999] hover:text-[#1E2124]">
              상품상세
            </button>
            <button className="pb-1 text-[#999999] hover:text-[#1E2124]">
              평점후기
            </button>
          </nav>

          {/* 우측: 검색 / 홈 / 장바구니 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3F4F5]"
            >
              <span
                className="iconify"
                data-icon="ic:round-home"
                data-width="20"
                data-height="20"
              />
            </button>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3F4F5]"
            >
              <span
                className="iconify"
                data-icon="tabler:search"
                data-width="20"
                data-height="20"
              />
            </button>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3F4F5] relative"
            >
              <span
                className="iconify"
                data-icon="solar:cart-large-2-linear"
                data-width="20"
                data-height="20"
              />
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[#FF2233] text-[10px] leading-4 text-white rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex gap-10">
        {/* 좌측: 이미지 영역 */}
        <section className="flex-1">
          {/* 메인 이미지 */}
          <div className="w-full aspect-[4/3] bg-[#D9D9D9] rounded-xl overflow-hidden mb-4">
            {/* 실제 이미지 적용 시 <img src="..." /> 교체 */}
          </div>

          {/* 썸네일 그리드 */}
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full aspect-square bg-white border border-[#F0F0F0] rounded-md overflow-hidden"
              >
                {/* <img src="..." className="w-full h-full object-cover" /> */}
              </div>
            ))}
          </div>

          {/* 하단 배너 자리 */}
          <div className="mt-6 w-full h-28 bg-[#D9D9D9] rounded-lg flex items-center justify-center">
            <span className="text-base font-semibold">Banner</span>
          </div>
        </section>

        {/* 우측: 상품 정보 */}
        <section className="w-[360px] bg-white rounded-2xl shadow-sm px-6 py-6 flex flex-col gap-4">
          {/* 브랜드 & 찜 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="text-xs text-[#999999] font-semibold">
                루이즈블랑
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#F5F5F5]"
              >
                <span
                  className="iconify text-[#999999]"
                  data-icon="mingcute:down-line"
                  data-width="14"
                  data-height="14"
                  style={{ transform: "rotate(-90deg)" }}
                />
                <span className="text-[#999999]">브랜드 정보</span>
              </button>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#E5E5E5] text-xs"
            >
              <span
                className="iconify text-[#FF2233]"
                data-icon="solar:heart-linear"
                data-width="16"
                data-height="16"
              />
              <span className="text-[#1E2124] text-xs">452</span>
            </button>
          </div>

          {/* 상품명 */}
          <h1 className="text-xl font-semibold text-[#000000] leading-snug">
            [촬영] 드레스 3벌 + 본식 드레스 1벌 패키지
          </h1>

          {/* 뱃지 */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-[#EFEBFF] text-[11px] font-semibold text-[#803BFF]">
              BEST
            </span>
            <span className="px-2 py-1 rounded bg-[#F5F5F5] text-[11px] font-semibold text-[#999999]">
              재방문 1위
            </span>
          </div>

          {/* 평점 */}
          <div className="flex items-center gap-1 text-xs text-[#999999]">
            <div className="w-4 h-4 rounded-sm bg-[#FFD900]" />
            <span className="text-[#1E2124] font-semibold">4.9</span>
            <span>|</span>
            <span>리뷰 155개</span>
            <button
              type="button"
              className="ml-2 text-[11px] text-[#666666] underline-offset-2 hover:underline"
            >
              리뷰 전체보기
            </button>
          </div>

          {/* 가격 & 쿠폰 */}
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="text-[24px] font-semibold text-[#000000] leading-none">
                1,500,000원
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-2 rounded-md bg-[#1E2124] text-white text-xs flex items-center gap-1"
            >
              <span>쿠폰 받기</span>
              <span
                className="iconify"
                data-icon="tabler:chevron-right"
                data-width="14"
                data-height="14"
              />
            </button>
          </div>

          {/* 기본 정보 리스트 */}
          <div className="mt-2 pt-3 border-t border-[#F3F4F5] flex flex-col gap-2 text-[13px]">
            <div className="flex gap-6">
              <div className="w-20 text-[#999999]">상품 구성</div>
              <div className="flex-1 text-[#1E2124]">
                촬영 드레스 3벌 + 본식 드레스 1벌
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-20 text-[#999999]">상담 소요시간</div>
              <div className="flex-1 text-[#1E2124]">50분</div>
            </div>
            <div className="flex gap-6">
              <div className="w-20 text-[#999999]">가봉 소요시</div>
              <div className="flex-1 text-[#1E2124]">90분</div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="flex-1 h-12 border border-black/20 rounded-xl flex items-center justify-center text-[15px] font-semibold text-black/80"
            >
              장바구니
            </button>
            <button
              type="button"
              className="flex-1 h-12 rounded-xl bg-[#FF2233] text-white text-[15px] font-semibold flex items-center justify-center"
            >
              상품예약
            </button>
          </div>
        </section>
      </main>

      {/* 하단 탭 컨텐츠 영역 (예시용) */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="mt-10 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-6 border-b border-[#F3F4F5] pb-3 mb-4 text-sm font-medium">
            <button className="pb-2 border-b-2 border-[#1E2124] text-[#1E2124]">
              상품 기본 정보
            </button>
            <button className="pb-2 text-[#999999] hover:text-[#1E2124]">
              상품 상세 사진
            </button>
            <button className="pb-2 text-[#999999] hover:text-[#1E2124]">
              리뷰 (1,454)
            </button>
          </div>
          <div className="text-sm text-[#555555] leading-relaxed space-y-2">
            <p>
              루이즈블랑 스페셜 패키지는 촬영 드레스 3벌과 본식 드레스 1벌이
              포함된 구성으로, 웨딩 촬영부터 본식까지 동일한 무드로 연출할 수
              있도록 큐레이션된 상품입니다.
            </p>
            <p>
              전문 스타일리스트와 1:1 상담 후 체형과 콘셉트에 맞는 드레스를
              추천해드리며, 가봉 및 핏 조정 시간을 충분히 제공합니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WebView;
