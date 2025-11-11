// WebView.jsx

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import api from "../../../lib/api/axios";
import { BasicInfoContent } from "../sections/BasicInfoContent"; // 추가
import { DetailContent } from "../sections/DetailContent"; // 추가
import { ReviewContent } from "../sections/ReviewContent"; // 추가
import type { WeddingHallDetail, StudioDetail, NormalizedDetail } from "../MobileView"; // 타입 임포트

type Category = "wedding" | "studio"; // MobileView와 동일

const WebView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<"basic" | "detail" | "review">("basic"); // 탭 상태
  const [category, setCategory] = useState<Category | null>(null);
  const [detailData, setDetailData] = useState<NormalizedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  /* ========================= 네비게이션 ========================= */
  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate("/");
  };

  const handleSearch = () => {
    navigate("/search");
  };

  const handleCart = () => {
    navigate("/cart");
  };

  /* ========================= 상품 상세 데이터 로딩 ========================= */

  useEffect(() => {
    if (!category || !id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        let url = "";
        if (category === "wedding") {
          url = `/api/v1/wedding-hall/${id}`;
        } else if (category === "studio") {
          url = `/api/v1/studio/${id}`;
        }

        const { data } = await api.get(url);

        if (category === "wedding") {
          const normalized: NormalizedDetail = {
            ...(data as WeddingHallDetail),
            _category: "wedding",
          };
          setDetailData(normalized);
        } else if (category === "studio") {
          const normalized: NormalizedDetail = {
            ...(data as StudioDetail),
            _category: "studio",
          };
          setDetailData(normalized);
        }
      } catch (error) {
        console.error(error);
        setErrorMsg("상세 정보를 불러오는 중 오류가 발생했습니다.");
        setDetailData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [category, id]);

  /* ========================= 장바구니 추가 ========================= */
  const addToCart = async () => {
    if (!detailData || !id) {
      alert("상품 정보를 불러올 수 없습니다.");
      return;
    }

    try {
      const quantity = 1; // 수량은 기본 1로 설정
      const optionIds = detailData.options?.map(option => option.id) || [];

      await api.post('/api/v1/cart/items', {
        productId: Number(id),
        quantity,
        optionIds,
      });
      alert("상품이 장바구니에 담겼습니다.");
      navigate("/cart"); // 장바구니 추가 후 장바구니 페이지로 이동
    } catch (error) {
      console.error("장바구니 추가 실패:", error);
      alert("장바구니 추가에 실패했습니다.");
    }
  };

  /* ========================= 렌더 ========================= */

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
              onClick={handleBack}
            >
              <span
                className="iconify"
                data-icon="mingcute:arrow-left-line"
                data-width="18"
                data-height="18"
              />
            </button>
            <div className="text-lg font-semibold tracking-tight">
              {detailData?.name || "상품 상세"} {/* 동적 상품명 */}
            </div>
          </div>

          {/* 중앙: 탭 */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("basic")}
              className={`pb-1 transition-all ${
                activeTab === "basic"
                  ? "border-b-2 border-[#1E2124] text-[#1E2124]"
                  : "text-[#999999] hover:text-[#1E2124]"
              }`}
            >
              기본정보
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("detail")}
              className={`pb-1 transition-all ${
                activeTab === "detail"
                  ? "border-b-2 border-[#1E2124] text-[#1E2124]"
                  : "text-[#999999] hover:text-[#1E2124]"
              }`}
            >
              상품상세
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("review")}
              className={`pb-1 transition-all ${
                activeTab === "review"
                  ? "border-b-2 border-[#1E2124] text-[#1E2124]"
                  : "text-[#999999] hover:text-[#1E2124]"
              }`}
            >
              평점후기
            </button>
          </nav>

          {/* 우측: 검색 / 홈 / 장바구니 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3F4F5]"
              onClick={handleHome}
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
              onClick={handleSearch}
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
              onClick={handleCart}
            >
              <span
                className="iconify"
                data-icon="solar:cart-large-2-linear"
                data-width="20"
                data-height="20"
              />
              {/* TODO: 장바구니 아이템 수량 동적으로 표시 */}
              {/* <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[#FF2233] text-[10px] leading-4 text-white rounded-full flex items-center justify-center">
                3
              </span> */}
            </button>
          </div>
        </div>
      </header>

      {/* 로딩 / 에러 상태 */}
      {loading && !errorMsg && (
        <div className="px-6 py-10 text-[14px] text-[#999999]">
          상세 정보를 불러오는 중입니다...
        </div>
      )}

      {errorMsg && (
        <div className="px-6 py-10 text-[14px] text-red-500">{errorMsg}</div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex gap-10">
        {/* 좌측: 이미지 영역 */}
        <section className="flex-1">
          {/* 메인 이미지 */}
          <div className="w-full aspect-[4/3] bg-[#D9D9D9] rounded-xl overflow-hidden mb-4">
            {detailData?.images?.[0]?.url ? (
              <img
                src={detailData.images[0].url}
                alt={detailData.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">이미지 없음</div>
            )} {/* 실제 이미지 적용 */}
          </div>

          {/* 썸네일 그리드 */}
          <div className="grid grid-cols-6 gap-2">
            {detailData?.images?.slice(0, 6).map((image, i) => (
              <div
                key={image.id || i}
                className="w-full aspect-square bg-white border border-[#F0F0F0] rounded-md overflow-hidden"
              >
                <img
                  src={image.url}
                  alt={`${detailData.name} 썸네일 ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
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
                {detailData?.ownerName || "상점명"}
              </div>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#F5F5F5]"
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
            {detailData?.name || "상품명"}
          </h1>

          {/* 뱃지 */}
          <div className="flex items-center gap-2">
            {detailData?.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded bg-[#EFEBFF] text-[11px] font-semibold text-[#803BFF]"
              >
                {typeof tag === 'string' ? tag : tag.tagName}
              </span>
            ))}
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
                {detailData?.price?.toLocaleString() || "0"}원
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
            {/* 기본 정보는 BasicInfoContent에서 렌더링되므로 여기서는 제거하거나 간소화 */}
            {/* 예시로 몇 가지만 남겨둠 */}
            {detailData && activeTab === "basic" && (
              <BasicInfoContent data={detailData} category={detailData._category} onOpenCoupon={() => {}} />
            )}
            {detailData && activeTab === "detail" && (
              <DetailContent data={detailData} category={detailData._category} />
            )}
            {detailData && activeTab === "review" && (
              <ReviewContent targetId={detailData.id} category={detailData._category} />
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="flex-1 h-12 border border-black/20 rounded-xl flex items-center justify-center text-[15px] font-semibold text-black/80"
              onClick={addToCart} // 장바구니 추가 함수 연결
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
        {/* WebView에서는 BasicInfoContent, DetailContent, ReviewContent가 메인 섹션에 포함되어 있으므로, 하단 탭 컨텐츠는 제거 */}
      </section>
    </div>
  );
};

export default WebView;
