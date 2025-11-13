// WebView.tsx
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../lib/api/axios";
import { BasicInfoContent } from "../sections/BasicInfoContent";
import { DetailContent } from "../sections/DetailContent";
import { ReviewContent } from "../sections/ReviewContent";

/* ========================= 타입 정의 ========================= */

type Category = "wedding" | "studio";

/** 공통 이미지 타입 */
type CommonImage = {
  id: number;
  url: string;
  s3Key: string;
  displayOrder: number;
};

/** 공통 옵션 타입 */
type CommonOption = {
  name: string;
  detail: string;
  price: number;
};

/** 웨딩홀 상세 타입 (모바일뷰와 동일) */
export type WeddingHallDetail = {
  id: number;
  name: string;
  price: number;
  address: string;
  detail: string;
  availableTimes: string;
  starCount: number;
  averageRating: number;
  capacity: number;
  minGuest: number;
  maxGuest: number;
  parkingCapacity: number;
  cateringType: string;
  reservationPolicy: string;
  region: string;
  ownerName: string;
  images: CommonImage[];
  options: CommonOption[];
  tags: string[];
};

/** 스튜디오 태그 타입 */
type StudioTag = {
  id: number;
  tagName: string;
};

/** 스튜디오 상세 타입 (모바일뷰와 동일) */
export type StudioDetail = {
  id: number;
  name: string;
  address: string;
  detail: string;
  price: number;
  availableTimes: string;
  region: string;
  images: CommonImage[];
  options: CommonOption[];
  tags: StudioTag[];
};

/** 공통 형태 */
export type NormalizedDetail =
  | (WeddingHallDetail & { _category: "wedding" })
  | (StudioDetail & { _category: "studio" });

/* ========================= 컴포넌트 ========================= */

const WebView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<"basic" | "detail" | "review">(
    "basic"
  );
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [showCouponToast, setShowCouponToast] = useState(false);

  const [category, setCategory] = useState<Category | null>(null);
  const [detailData, setDetailData] = useState<NormalizedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  /* ========================= 네비게이션 ========================= */

  const handleGoCart = () => {
    navigate("/cart");
  };

  const handleGoReservation = () => {
    if (!detailData) return;
    // 추후 예약 페이지 경로 연결
    // navigate(`/reservation/${detailData._category}/${detailData.id}`);
  };

  /* ========================= 쿠폰 ========================= */

  const handleOpenCoupon = () => {
    setIsCouponOpen(true);
  };

  const handleCloseCoupon = () => {
    setIsCouponOpen(false);
  };

  const handleCouponDownload = () => {
    if (showCouponToast) return;
    setShowCouponToast(true);
    setTimeout(() => {
      setShowCouponToast(false);
    }, 3000);
  };

  /* ========================= 카테고리 판별 ========================= */

  useEffect(() => {
    const [, first] = location.pathname.split("/");
    if (first === "wedding") {
      setCategory("wedding");
    } else if (first === "studio") {
      setCategory("studio");
    } else {
      setCategory(null);
      setErrorMsg("유효하지 않은 카테고리 경로입니다.");
      setLoading(false);
    }
  }, [location.pathname]);

  /* ========================= 상세 데이터 호출 ========================= */

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

  /* ========================= 파생 값 ========================= */

  const displayPrice =
    detailData && typeof detailData.price === "number"
      ? `${detailData.price.toLocaleString("ko-KR")}원`
      : undefined;

  const displayCategoryLabel =
    detailData?._category === "wedding" ? "웨딩홀" : "스튜디오";

  const displayBrand =
    detailData && "ownerName" in detailData
      ? detailData.ownerName
      : detailData?.region ?? "브랜드 정보";

  const displayRegion = detailData?.region;
  const displayAvailableTimes = detailData?.availableTimes;

  const displayRating =
    detailData && "averageRating" in detailData
      ? Number(detailData.averageRating || 0).toFixed(1)
      : undefined;

  const displayReviewCount =
    detailData && "starCount" in detailData ? detailData.starCount : undefined;

  /* ========================= JSX ========================= */

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] text-[#111827]">
      <main className="max-w-6xl mx-auto px-8 pt-20 pb-10">
        {/* 로딩/에러 */}
        {loading && !errorMsg && (
          <div className="w-full py-10 text-sm text-[#9CA3AF]">
            상세 정보를 불러오는 중입니다...
          </div>
        )}

        {errorMsg && (
          <div className="w-full py-10 text-sm text-red-500">{errorMsg}</div>
        )}

        {/* 실제 컨텐츠 */}
        {!loading && !errorMsg && detailData && (
          <>
            {/* 상단 헤더 영역 */}
            <section className="mb-4 flex justify-between">
              {/* 카테고리 / 위치 */}
              <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-medium text-[#4B5563]">
                  <Icon
                    icon="solar:buildings-3-linear"
                    className="w-3.5 h-3.5"
                  />
                  {displayCategoryLabel}
                </span>
                {displayRegion && (
                  <span className="inline-flex items-center gap-1">
                    <Icon
                      icon="solar:map-point-outline"
                      className="w-3.5 h-3.5"
                    />
                    {displayRegion}
                  </span>
                )}
              </div>

              {(displayRating || displayReviewCount !== undefined) && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-[#E5E7EB]">
                  <Icon
                    icon="solar:star-bold"
                    className="w-4 h-4 text-[#FBBF24]"
                  />
                  {displayRating && (
                    <span className="text-sm font-semibold text-[#111827]">
                      {displayRating}
                    </span>
                  )}
                  {displayReviewCount !== undefined && (
                    <span className="text-xs text-[#6B7280]">
                      리뷰 {displayReviewCount}개
                    </span>
                  )}
                </div>
              )}
            </section>

            {/* 메인 2컬럼 레이아웃 */}
            <section className="grid grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-10 items-start">
              {/* 좌측: 이미지 + 탭 컨텐츠 */}
              {/* 탭 + 컨텐츠 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
                {/* 탭 버튼 */}
                <div className="flex items-center gap-8 px-5 pt-4 border-b border-[#E5E7EB] text-sm font-medium">
                  <button
                    type="button"
                    className={`pb-3 border-b-2 transition-colors ${
                      activeTab === "basic"
                        ? "border-[#111827] text-[#111827]"
                        : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
                    }`}
                    onClick={() => setActiveTab("basic")}
                  >
                    기본 정보
                  </button>
                  <button
                    type="button"
                    className={`pb-3 border-b-2 transition-colors ${
                      activeTab === "detail"
                        ? "border-[#111827] text-[#111827]"
                        : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
                    }`}
                    onClick={() => setActiveTab("detail")}
                  >
                    상세 설명 · 사진
                  </button>
                  <button
                    type="button"
                    className={`pb-3 border-b-2 transition-colors ${
                      activeTab === "review"
                        ? "border-[#111827] text-[#111827]"
                        : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
                    }`}
                    onClick={() => setActiveTab("review")}
                  >
                    리뷰
                  </button>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="px-5 py-6">
                  {activeTab === "basic" && (
                    <BasicInfoContent
                      data={detailData}
                      category={detailData._category}
                      onOpenCoupon={handleOpenCoupon}
                    />
                  )}

                  {activeTab === "detail" && (
                    <DetailContent
                      data={detailData}
                      category={detailData._category}
                    />
                  )}

                  {activeTab === "review" && (
                    <ReviewContent
                      targetId={detailData.id}
                      category={detailData._category}
                    />
                  )}
                </div>
              </div>

              {/* 우측: 예약 카드 (sticky) */}
              <aside className="sticky top-10">
                <div className="bg-white rounded-2xl shadow-md border border-[#E5E7EB] px-6 py-6 space-y-5">
                  {/* 브랜드 / 타이틀 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#6B7280]">
                          {displayBrand}
                        </span>
                        <span className="px-2 py-[3px] rounded-full bg-[#F3F4FF] text-[10px] font-semibold text-[#6366F1]">
                          OFFICIAL
                        </span>
                      </div>

                      <button
                        type="button"
                        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280]"
                        onClick={handleOpenCoupon}
                      >
                        <Icon
                          icon="solar:ticket-sale-linear"
                          className="w-3.5 h-3.5"
                        />
                        <span>쿠폰 받기</span>
                      </button>
                    </div>

                    {displayPrice && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-[22px] font-semibold text-[#111827]">
                          {displayPrice}
                        </span>
                        <span className="text-xs text-[#9CA3AF]">
                          (부가세 포함)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 요약 정보 (주소 + 이용 가능 시간: 여기서만 보여줌) */}
                  <div className="rounded-xl bg-[#F9FAFB] px-4 py-3 space-y-2 text-[13px]">
                    <div className="flex items-start gap-3">
                      <Icon
                        icon="solar:map-point-outline"
                        className="w-4 h-4 mt-[2px] text-[#6B7280]"
                      />
                      <div className="flex-1">
                        <div className="text-[#6B7280]">주소</div>
                        <div className="text-[#111827]">
                          {detailData.address}
                        </div>
                      </div>
                    </div>
                    {displayAvailableTimes && (
                      <div className="flex items-start gap-3">
                        <Icon
                          icon="solar:clock-circle-linear"
                          className="w-4 h-4 mt-[2px] text-[#6B7280]"
                        />
                        <div className="flex-1">
                          <div className="text-[#6B7280]">이용 가능 시간</div>
                          <div className="text-[#111827]">
                            {displayAvailableTimes}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 버튼 영역 */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full h-12 rounded-xl border border-[#D1D5DB] flex items-center justify-center gap-2 text-[14px] font-semibold text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                      onClick={handleGoCart}
                    >
                      <Icon
                        icon="solar:cart-large-minimalistic-linear"
                        className="w-5 h-5"
                      />
                      <span>장바구니 담기</span>
                    </button>
                    <button
                      type="button"
                      className="w-full h-12 rounded-xl bg-[#FF2233] text-white flex items-center justify-center gap-2 text-[14px] font-semibold hover:brightness-95 transition-all"
                      onClick={handleGoReservation}
                    >
                      <Icon
                        icon="solar:calendar-bold-duotone"
                        className="w-5 h-5"
                      />
                      <span>상품 예약하기</span>
                    </button>
                  </div>

                  {/* 안내 문구 */}
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    예약 요청 후 담당 MD가 일정 및 세부 내용을 확인한 뒤
                    알림으로 확정 여부를 안내드려요.
                  </p>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>

      {/* 쿠폰 모달 & 딤드: isCouponOpen일 때만 렌더 */}
      {isCouponOpen && (
        <>
          {/* 딤드 */}
          <div
            className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.55)] backdrop-blur-[2px] transition-opacity duration-200"
            onClick={handleCloseCoupon}
          />

          {/* 모달 */}
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div
              className="w-full md:max-w-[520px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl
                         md:mx-0 mx-0 pb-4 md:pb-6 overflow-hidden
                         transform transition-all duration-200 ease-out"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E5E7EB]">
                <div className="space-y-1">
                  <p className="text-[15px] font-semibold text-[#111827]">
                    사용 가능한 쿠폰
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    다운받은 쿠폰은 마이페이지 &gt; 쿠폰함에서 확인할 수 있어요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCoupon}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] transition-colors"
                >
                  <Icon
                    icon="meteor-icons:xmark"
                    className="w-4 h-4 text-[#111827]"
                  />
                </button>
              </div>

              {/* 쿠폰 리스트 */}
              <div className="px-6 pt-3 pb-4 max-h-[60vh] md:max-h-[420px] overflow-y-auto">
                {/* 쿠폰 1 */}
                <div className="flex items-stretch mt-4">
                  <div className="flex-1 border border-r-0 border-[#E5E7EB] rounded-l-2xl p-4 flex flex-col gap-2">
                    <div className="text-[13px] text-[#111827] font-medium">
                      [상반기 WEDDING] 구매금액 1만원 할인
                    </div>
                    <div className="text-[20px] font-bold text-[#111827] leading-[1.3]">
                      6% 할인
                    </div>
                    <div className="flex flex-col gap-[2px] text-[11px] text-[#9CA3AF]">
                      <span>10만원 이상 구매 시 최대 1만원 할인</span>
                      <span>사용기간 : 25.09.29 ~ 25.10.31</span>
                    </div>
                  </div>
                  <div className="w-[80px] bg-[#F9FAFB] border border-l-0 border-[#E5E7EB] rounded-r-2xl flex items-center justify-center">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm"
                      onClick={handleCouponDownload}
                    >
                      <Icon
                        icon="streamline:arrow-down-2"
                        className="w-4 h-4 text-[#111827]"
                      />
                    </button>
                  </div>
                </div>

                {/* 쿠폰 2 */}
                <div className="flex items-stretch mt-3">
                  <div className="flex-1 border border-r-0 border-[#E5E7EB] rounded-l-2xl p-4 flex flex-col gap-2">
                    <div className="text-[13px] text-[#111827] font-medium">
                      [상반기 WEDDING] 구매금액 1만원 할인
                    </div>
                    <div className="text-[20px] font-bold text-[#111827] leading-[1.3]">
                      6% 할인
                    </div>
                    <div className="flex flex-col gap-[2px] text-[11px] text-[#9CA3AF]">
                      <span>10만원 이상 구매 시 최대 1만원 할인</span>
                      <span>사용기간 : 25.09.29 ~ 25.10.31</span>
                    </div>
                  </div>
                  <div className="w-[80px] bg-[#F9FAFB] border border-l-0 border-[#E5E7EB] rounded-r-2xl flex items-center justify-center">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm"
                      onClick={handleCouponDownload}
                    >
                      <Icon
                        icon="streamline:arrow-down-2"
                        className="w-4 h-4 text-[#111827]"
                      />
                    </button>
                  </div>
                </div>

                {/* 쿠폰 3 */}
                <div className="flex items-stretch mt-3 mb-2">
                  <div className="flex-1 border border-r-0 border-[#E5E7EB] rounded-l-2xl p-4 flex flex-col gap-2">
                    <div className="text-[13px] text-[#111827] font-medium">
                      [상반기 WEDDING] 추가 할인 쿠폰
                    </div>
                    <div className="text-[20px] font-bold text-[#111827] leading-[1.3]">
                      5% 할인
                    </div>
                    <div className="flex flex-col gap-[2px] text-[11px] text-[#9CA3AF]">
                      <span>5만원 이상 구매 시</span>
                      <span>사용기간 : 25.09.29 ~ 25.10.31</span>
                    </div>
                  </div>
                  <div className="w-[80px] bg-[#F9FAFB] border border-l-0 border-[#E5E7EB] rounded-r-2xl flex items-center justify-center">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm"
                      onClick={handleCouponDownload}
                    >
                      <Icon
                        icon="streamline:arrow-down-2"
                        className="w-4 h-4 text-[#111827]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 쿠폰 다운로드 토스트 */}
      <div
        className={`
          fixed left-1/2 -translate-x-1/2 bottom-8
          w-[92%] max-w-[420px]
          bg-[#111827] text-white
          rounded-xl px-5 py-3.5
          flex items-center gap-3
          shadow-xl z-[60]
          transition-all duration-200 ease-out
          ${
            showCouponToast
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none"
          }
        `}
      >
        <Icon
          icon="solar:check-circle-bold"
          className="w-5 h-5 text-[#A7F3D0]"
        />
        <p className="flex-1 text-[13px] font-medium leading-[150%]">
          쿠폰 다운로드가 완료되었어요.
          <br />
          마이페이지 &gt; 쿠폰함에서 확인할 수 있어요.
        </p>
      </div>
    </div>
  );
};

export default WebView;
