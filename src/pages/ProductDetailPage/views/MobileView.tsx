// MobileView.tsx
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import api from "../../../lib/api/axios";
import { BasicInfoContent } from "../sections/BasicInfoContent";
import { DetailContent } from "../sections/DetailContent";
import { ReviewContent } from "../sections/ReviewContent";
import { useAppSelector } from "../../../store/hooks";
import type {
  Category,
  NormalizedDetail,
  WeddingHallDetail,
  StudioDetail,
  DressDetail,
  MakeupDetail,
} from "../../../type/product";

/* ========================= 컴포넌트 ========================= */

const MobileView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isAuth = useAppSelector((s) => s.user.isAuth);

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

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoSearch = () => {
    navigate("/search");
  };

  const handleGoCart = () => {
    navigate("/cart");
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
    } else if (first === "dress") {
      setCategory("dress");
    } else if (first === "makeup") {
      setCategory("makeup");
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
        } else if (category === "dress") {
          url = `/api/v1/dress/${id}`;
        } else if (category === "makeup") {
          url = `/api/v1/makeup/${id}`;
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
        } else if (category === "dress") {
          const normalized: NormalizedDetail = {
            ...(data as DressDetail),
            _category: "dress",
          };
          setDetailData(normalized);
        } else if (category === "makeup") {
          const normalized: NormalizedDetail = {
            ...(data as MakeupDetail),
            _category: "makeup",
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

  /* ========================= 렌더 ========================= */

  return (
    <div className="w-full min-h-screen bg-white text-[#1E2124]">
      {/* 전체를 모바일 폭에 맞춰 꽉 채움 (상위에서 md:hidden 처리) */}
      <div className="relative w-full min-h-screen">
        {/* 상단 네비게이션 */}
        <header className="w-full h-[60px] px-4 flex items-center justify-between gap-4">
          {/* 뒤로가기 */}
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center"
            onClick={handleGoBack}
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="w-7 h-7 text-[#1E2124]"
            />
          </button>

          {/* 홈 / 검색 / 카트 */}
          <div className="flex items-center justify-center gap-3">
            {/* 홈 */}
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center"
              onClick={handleGoHome}
            >
              <Icon
                icon="solar:home-2-linear"
                className="w-6 h-6 text-[#1E2124]"
              />
            </button>

            {/* 검색 */}
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center"
              onClick={handleGoSearch}
            >
              <Icon
                icon="iconamoon:search-light"
                className="w-6 h-6 text-[#1E2124]"
              />
            </button>

            {/* 카트 (로그인 시) */}
            {isAuth && (
              <button
                type="button"
                className="relative w-6 h-6 flex items-center justify-center"
                onClick={handleGoCart}
              >
                <Icon
                  icon="solar:cart-large-minimalistic-linear"
                  className="w-6 h-6 text-[#1E2124]"
                />
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-[3px] bg-[#FF2233] text-[9px] text-white rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            )}
          </div>
        </header>

        {/* 탭 바 */}
        <div className="w-full h-12 flex bg-white border-b border-[#E0E5EB]">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex-1 flex items-center justify-center text-[15px] font-medium transition-all ${
              activeTab === "basic"
                ? "border-b-2 border-[#1E2124] text-[#1E2124]"
                : "text-[#999999]"
            }`}
          >
            기본정보
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("detail")}
            className={`flex-1 flex items-center justify-center text-[15px] font-medium transition-all ${
              activeTab === "detail"
                ? "border-b-2 border-[#1E2124] text-[#1E2124]"
                : "text-[#999999]"
            }`}
          >
            상품상세
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`flex-1 flex items-center justify-center text-[15px] font-medium transition-all ${
              activeTab === "review"
                ? "border-b-2 border-[#1E2124] text-[#1E2124]"
                : "text-[#999999]"
            }`}
          >
            평점후기
          </button>
        </div>

        {/* 로딩 / 에러 */}
        {loading && !errorMsg && (
          <div className="px-4 py-10 text-[14px] text-[#999999]">
            상세 정보를 불러오는 중입니다...
          </div>
        )}

        {errorMsg && (
          <div className="px-4 py-10 text-[14px] text-red-500">{errorMsg}</div>
        )}

        {/* 메인 컨텐츠 */}
        <main className="pb-[140px]">
          {!loading && !errorMsg && detailData && (
            <>
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
            </>
          )}
        </main>

        {/* 하단 고정 버튼 */}
        <div className="fixed left-0 bottom-0 w-full bg-white px-4 pt-3 pb-5 z-30">
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 min-h-[52px] border border-black/20 rounded-[12px] flex items-center justify-center text-[16px] font-semibold text-black/80"
              onClick={handleGoCart}
            >
              장바구니
            </button>
            <button
              type="button"
              className="flex-1 min-h-[52px] rounded-[12px] bg-[#FF2233] text-white text-[16px] font-semibold flex items-center justify-center"
            >
              상품예약
            </button>
          </div>
        </div>

        {/* 쿠폰 바텀시트 딤드 */}
        <div
          className={`fixed inset-0 z-40 bg-[rgba(0,0,0,0.6)] transition-opacity duration-300 ${
            isCouponOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={handleCloseCoupon}
        />

        {/* 쿠폰 바텀시트 */}
        <div
          className={`
            fixed left-0 bottom-0
            w-full
            bg-white rounded-t-[20px]
            shadow-[0_-4px_20px_rgba(0,0,0,0.18)]
            z-50
            transition-transform duration-300 ease-out
            ${isCouponOpen ? "translate-y-0" : "translate-y-full"}
          `}
        >
          <div className="w-full flex items-center justify-between px-5 my-6">
            <span className="text-[18px] font-semibold text-[#1E2124]">
              사용 가능한 쿠폰
            </span>
            <button
              type="button"
              onClick={handleCloseCoupon}
              className="w-6 h-6 flex items-center justify-center"
            >
              <Icon
                icon="meteor-icons:xmark"
                className="w-6 h-6 text-[#1E2124]"
              />
            </button>
          </div>

          <div className="px-5 pb-6 max-h-[60vh] overflow-y-auto">
            {/* 쿠폰 1 */}
            <div className="w-full flex items-stretch mt-5">
              <div className="flex-1 border border-r-0 border-[#F2F2F2] rounded-l-[16px] p-4 flex flex-col gap-2">
                <div className="text-[14px] text-[#000000]">
                  [상반기 WEDDING] 구매금액 1만원 할인
                </div>
                <div className="text-[20px] font-bold text-[#000000] leading-[1.4]">
                  6% 할인
                </div>
                <div className="flex flex-col gap-[2px] text-[12px] text-[#999999]">
                  <span>10만원 이상 구매 시 최대 1만원 할인</span>
                  <span>사용기간 : 25.09.29 ~ 25.10.31</span>
                </div>
              </div>
              <div className="w-[72px] bg-[#F6F7FB] border border-l-0 border-[#F2F2F2] rounded-r-[16px] flex items-center justify-center">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
                  onClick={handleCouponDownload}
                >
                  <Icon
                    icon="streamline:arrow-down-2"
                    className="w-4 h-4 text-[#000000]"
                  />
                </button>
              </div>
            </div>

            {/* 쿠폰 2 */}
            <div className="w-full flex items-stretch mt-4">
              <div className="flex-1 border border-r-0 border-[#F2F2F2] rounded-l-[16px] p-4 flex flex-col gap-2">
                <div className="text-[14px] text-[#000000]">
                  [상반기 WEDDING] 구매금액 1만원 할인
                </div>
                <div className="text-[20px] font-bold text-[#000000] leading-[1.4]">
                  6% 할인
                </div>
                <div className="flex flex-col gap-[2px] text-[12px] text-[#999999]">
                  <span>10만원 이상 구매 시 최대 1만원 할인</span>
                  <span>사용기간 : 25.09.29 ~ 25.10.31</span>
                </div>
              </div>
              <div className="w-[72px] bg-[#F6F7FB] border border-l-0 border-[#F2F2F2] rounded-r-[16px] flex items-center justify-center">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
                  onClick={handleCouponDownload}
                >
                  <Icon
                    icon="streamline:arrow-down-2"
                    className="w-4 h-4 text-[#000000]"
                  />
                </button>
              </div>
            </div>

            {/* 쿠폰 3 */}
            <div className="w-full flex items-stretch mt-4 mb-2">
              <div className="flex-1 border border-r-0 border-[#F2F2F2] rounded-l-[16px] p-4 flex flex-col gap-2">
                <div className="text-[14px] text-[#000000]">
                  [상반기 WEDDING] 추가 할인 쿠폰
                </div>
                <div className="text-[20px] font-bold text-[#000000] leading-[1.4]">
                  5% 할인
                </div>
                <div className="flex flex-col gap-[2px] text-[12px] text-[#999999]">
                  <span>5만원 이상 구매 시</span>
                  <span>사용기간 : 25.09.29 ~ 25.10.31</span>
                </div>
              </div>
              <div className="w-[72px] bg-[#F6F7FB] border border-l-0 border-[#F2F2F2] rounded-r-[16px] flex items-center justify-center">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
                  onClick={handleCouponDownload}
                >
                  <Icon
                    icon="streamline:arrow-down-2"
                    className="w-4 h-4 text-[#000000]"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 쿠폰 다운로드 완료 토스트 */}
        <div
          className={`
            fixed left-1/2 -translate-x-1/2
            bottom-[72px]
            w-[92%]
            max-w-[480px]
            bg-[#4D4D4D]
            rounded-[8px]
            px-5 py-3
            flex items-center
            gap-[18px]
            z-[60]
            pointer-events-none
            transition-all duration-300 ease-out
            ${
              showCouponToast
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }
          `}
        >
          <Icon
            icon="solar:check-circle-bold"
            className="w-6 h-6 text-white shrink-0"
          />
          <p className="flex-1 text-[14px] font-semibold leading-[150%] tracking-[-0.2px] text-white">
            다운로드가 완료 되었어요.
            <br />
            마이페이지 쿠폰함에서 확인 가능해요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
