// WebView.tsx (형님이 쓰는 경로 기준으로 사용)
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { AxiosError } from "axios";
import api from "../../../lib/api/axios";
import { BasicInfoContent } from "../sections/BasicInfoContent";
import { DetailContent } from "../sections/DetailContent";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import type {
  Category,
  NormalizedDetail,
  WeddingHallDetail,
  StudioDetail,
  DressDetail,
  MakeupDetail,
  Coupon,
  MyCoupon,
} from "../../../type/product";
import ReviewContent from "../sections/ReviewContent";
import { toast } from "react-toastify";
import { fetchCartCount } from "../../../store/cartSlice";

/* 날짜 포맷: 2025-11-19 -> 25.11.19 */
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

/** 공유 타이틀 계산 (any 사용 X) */
const getShareTitle = (data: NormalizedDetail | null): string => {
  if (!data) return "웨딩 상품 상세";

  if ("name" in data && typeof data.name === "string" && data.name) {
    return data.name;
  }

  if (
    "title" in data &&
    typeof (data as { title?: string }).title === "string"
  ) {
    return (data as { title?: string }).title ?? "웨딩 상품 상세";
  }

  return "웨딩 상품 상세";
};

/* ========================= 컴포넌트 ========================= */

const WebView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isAuth = useAppSelector((s) => s.user.isAuth);
  const dispatch = useAppDispatch();

  // OWNER일 때만 bzName 안전하게 꺼내기 (MobileView와 동일)
  const ownerBzName = useAppSelector((s) => {
    const data = s.user.userData;
    const role = s.user.role;

    if (role === "OWNER" && data && "bzName" in data) {
      return data.bzName;
    }
    return undefined;
  });

  const [activeTab, setActiveTab] = useState<"basic" | "detail" | "review">(
    "basic"
  );
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [showCouponToast, setShowCouponToast] = useState(false);

  const [category, setCategory] = useState<Category | null>(null);
  const [detailData, setDetailData] = useState<NormalizedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myCouponIds, setMyCouponIds] = useState<Set<number>>(
    () => new Set<number>()
  );
  const [downloadedCouponIds, setDownloadedCouponIds] = useState<number[]>([]);

  const [showReservationModal, setShowReservationModal] = useState(false);

  /* ========================= 장바구니 / 예약 액션 ========================= */

  const addToCartCore = async (): Promise<boolean> => {
    if (!detailData || !id) {
      toast.error("상품 정보를 불러올 수 없습니다.");
      return false;
    }

    try {
      const quantity = 1;
      await api.post("/api/v1/cart", {
        productId: Number(id),
        quantity,
      });

      // ✅ 서버에 장바구니 담기 성공 후, 전역 cartCount 다시 가져오기
      dispatch(fetchCartCount());

      return true;
    } catch (error) {
      console.error("장바구니 추가 실패:", error);
      toast.error("장바구니 추가에 실패했습니다.");
      return false;
    }
  };

  const addToCart = async () => {
    const ok = await addToCartCore();
    if (!ok) return;
    toast.success("상품이 장바구니에 담겼습니다.");
  };

  const handleProductReservation = async () => {
    const ok = await addToCartCore();
    if (!ok) return;
    setShowReservationModal(true);
  };

  const handleEditProduct = () => {
    if (!category || !id) {
      toast.error("상품 정보를 불러올 수 없습니다.");
      return;
    }
    navigate(`/my-page/owner/product/edit/${category}/${id}`);
  };

  /* ========================= 공유 / 채팅 ========================= */

  const handleShare = async () => {
    const url = window.location.href;
    const title = getShareTitle(detailData);

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        console.error("웹 공유 실패 또는 취소:", err);
      }
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        alert("링크가 클립보드에 복사되었어요.");
      } catch (err) {
        console.error("클립보드 복사 실패:", err);
        alert(
          "공유 기능 사용이 어려워요. 브라우저 주소창에서 직접 복사해주세요."
        );
      }
    } else {
      alert(
        "브라우저에서 공유 기능을 지원하지 않아요. 주소창에서 직접 복사해주세요."
      );
    }
  };

  const handleChat = async () => {
    if (!id) {
      toast.error("상품 정보를 불러올 수 없습니다.");
      return;
    }

    try {
      const { data } = await api.post("/api/chat/rooms/open-from-product", {
        productId: Number(id),
      });

      console.log("채팅방 생성/조회 결과:", data);
      toast.success("판매자와의 채팅방이 열렸어요.");
      navigate(`/chat/${data}`);
    } catch (error) {
      console.error("채팅방 열기 실패:", error);

      const axiosError = error as AxiosError | undefined;
      const status = axiosError?.response?.status;

      if (status === 401) {
        toast.error("로그인이 필요한 서비스입니다.");
      } else {
        toast.error(
          "채팅방을 여는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요."
        );
      }
    }
  };

  /* ========================= 쿠폰 ========================= */

  const handleOpenCoupon = () => {
    setIsCouponOpen(true);
  };

  const handleCloseCoupon = () => {
    setIsCouponOpen(false);
  };

  const handleCouponDownload = async (couponId: number) => {
    if (downloadedCouponIds.includes(couponId) || myCouponIds.has(couponId)) {
      return;
    }
    if (showCouponToast) return;

    try {
      const { data } = await api.post(
        `/api/v1/customer/coupon/${couponId}/download`
      );

      console.log("쿠폰 다운로드 응답:", data);

      setDownloadedCouponIds((prev) =>
        prev.includes(couponId) ? prev : [...prev, couponId]
      );

      setMyCouponIds((prev) => {
        const next = new Set(prev);
        next.add(couponId);
        return next;
      });

      setShowCouponToast(true);
      setTimeout(() => {
        setShowCouponToast(false);
      }, 2000);
    } catch (error) {
      console.error("쿠폰 다운로드 실패:", error);
      toast.error("쿠폰 다운로드에 실패했습니다.");
    }
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

  /* ========================= 쿠폰 데이터 호출 ========================= */

  useEffect(() => {
    if (!id) return;

    const fetchCoupons = async () => {
      try {
        const { data } = await api.get<Coupon[]>(
          `/api/v1/owner/coupon/product/${id}`
        );
        setCoupons(data ?? []);
      } catch (error) {
        console.error("쿠폰 정보를 불러오는 중 오류가 발생했습니다.:", error);
        setCoupons([]);
      }
    };

    fetchCoupons();
  }, [id]);

  useEffect(() => {
    if (!isAuth) return;

    const fetchMyCoupons = async () => {
      try {
        const { data } = await api.get<MyCoupon[]>(
          "/api/v1/customer/coupon/my"
        );

        const ids = new Set<number>(data.map((c) => c.couponId));
        setMyCouponIds(ids);
        setDownloadedCouponIds(Array.from(ids));
      } catch (error) {
        console.error("내 쿠폰 목록 조회 실패:", error);
      }
    };

    fetchMyCoupons();
  }, [isAuth]);

  /* ========================= 파생 값 ========================= */

  const displayPrice =
    detailData && typeof detailData.price === "number"
      ? `${detailData.price.toLocaleString("ko-KR")}원`
      : undefined;

  const displayCategoryLabel =
    detailData?._category === "wedding"
      ? "웨딩홀"
      : detailData?._category === "studio"
      ? "스튜디오"
      : detailData?._category === "dress"
      ? "드레스"
      : detailData?._category === "makeup"
      ? "메이크업"
      : "";

  const displayBrand =
    detailData && "ownerName" in detailData
      ? detailData.bzName
      : detailData?.region ?? "브랜드 정보";

  const displayRegion = detailData?.region;
  const displayAvailableTimes = detailData?.availableTimes;

  const displayRating =
    detailData && "averageRating" in detailData
      ? Number(detailData.starCount || 0).toFixed(1)
      : undefined;

  const displayReviewCount =
    detailData && "starCount" in detailData
      ? detailData.averageRating
      : undefined;

  /* ========================= 오너 여부 판별 ========================= */

  const isOwnerOfProduct =
    !!detailData && !!ownerBzName && detailData.bzName === ownerBzName;

  /* ========================= 탭 이동 ========================= */

  const handleGoDetailTab = () => {
    setActiveTab("detail");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  const handleGoReviewTab = () => {
    setActiveTab("review");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  /* ========================= JSX ========================= */

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] text-[#111827]">
      <main className="max-w-6xl mx-auto px-8 pt-20 pb-10">
        {loading && !errorMsg && (
          <div className="w-full py-10 text-sm text-[#9CA3AF]">
            상세 정보를 불러오는 중입니다...
          </div>
        )}

        {errorMsg && (
          <div className="w-full py-10 text-sm text-red-500">{errorMsg}</div>
        )}

        {!loading && !errorMsg && detailData && (
          <>
            {/* 상단 헤더 영역 */}
            <section className="mb-4 flex justify-between">
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
              {/* 좌측: 탭 컨텐츠 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
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

                <div className="px-5 py-6">
                  {activeTab === "basic" && (
                    <BasicInfoContent
                      data={detailData}
                      onOpenCoupon={handleOpenCoupon}
                      onGoDetailTab={handleGoDetailTab}
                      onGoReviewTab={handleGoReviewTab}
                    />
                  )}

                  {activeTab === "detail" && (
                    <DetailContent data={detailData} />
                  )}

                  {activeTab === "review" && (
                    <ReviewContent targetId={detailData.id} />
                  )}
                </div>
              </div>

              {/* 우측: 예약 카드 */}
              <aside className="sticky top-10 space-y-3">
                <div className="bg-white rounded-2xl shadow-md border border-[#E5E7EB] px-6 py-6 space-y-5">
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

                      {/* 쿠폰 받기 버튼 */}
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

                  <div className="space-y-2">
                    {isOwnerOfProduct ? (
                      <button
                        type="button"
                        className="w-full h-12 rounded-xl bg-[#FF2233] text-white flex items-center justify-center gap-2 text-[14px] font-semibold hover:brightness-95 transition-all"
                        onClick={handleEditProduct}
                      >
                        <Icon icon="solar:pen-bold" className="w-5 h-5" />
                        <span>수정하기</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="w-full h-12 rounded-xl border border-[#D1D5DB] flex items-center justify-center gap-2 text-[14px] font-semibold text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                          onClick={addToCart}
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
                          onClick={handleProductReservation}
                        >
                          <Icon
                            icon="solar:calendar-bold-duotone"
                            className="w-5 h-5"
                          />
                          <span>상품 예약하기</span>
                        </button>
                      </>
                    )}
                  </div>

                  {!isOwnerOfProduct && (
                    <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                      예약 요청 후 담당 MD가 일정 및 세부 내용을 확인한 뒤
                      알림으로 확정 여부를 안내드려요.
                    </p>
                  )}

                  {!isOwnerOfProduct && (
                    <div className="pt-4 mt-2 border-t border-[#E5E7EB] flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleChat}
                        className="flex-1 h-11 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] flex items-center justify-center gap-2 text-[13px] font-medium text-[#111827] transition-colors"
                      >
                        <Icon
                          icon="fluent:chat-16-regular"
                          className="w-4 h-4"
                        />
                        <span>판매자와 채팅하기</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="h-11 px-4 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] flex items-center justify-center gap-2 text-[13px] text-[#4B5563] transition-colors"
                      >
                        <Icon icon="solar:share-linear" className="w-4 h-4" />
                        <span>공유</span>
                      </button>
                    </div>
                  )}
                </div>
              </aside>
            </section>
          </>
        )}
      </main>

      {/* 쿠폰 모달 & 딤드 */}
      {isCouponOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.55)] backdrop-blur-[2px]"
            onClick={handleCloseCoupon}
          />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div
              className="w-full md:max-w-[520px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl md:mx-0 mx-0 pb-4 md:pb-6 overflow-hidden transform transition-all duration-200 ease-out"
              onClick={(e) => e.stopPropagation()}
            >
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

              <div className="px-6 pt-3 pb-4 max-h-[60vh] md:max-h-[420px] overflow-y-auto">
                {coupons.map((coupon, index) => {
                  const isFirst = index === 0;
                  const isLast = index === coupons.length - 1;

                  const wrapperMargin = [
                    isFirst ? "mt-4" : "mt-3",
                    isLast ? "mb-2" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const isDownloaded =
                    downloadedCouponIds.includes(coupon.id) ||
                    myCouponIds.has(coupon.id);

                  const isRate = coupon.discountType === "RATE";
                  const discountText = isRate
                    ? `${coupon.discountValue}% 할인`
                    : `${coupon.discountValue.toLocaleString()}원 할인`;

                  const line1 =
                    coupon.minPurchaseAmount > 0
                      ? `${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매 시${
                          coupon.maxDiscountAmount > 0
                            ? ` 최대 ${coupon.maxDiscountAmount.toLocaleString()}원 할인`
                            : ""
                        }`
                      : coupon.couponDetail;

                  const line2 =
                    coupon.startDate && coupon.expirationDate
                      ? `사용기간 : ${formatDate(
                          coupon.startDate
                        )} ~ ${formatDate(coupon.expirationDate)}`
                      : "";

                  return (
                    <div
                      key={coupon.id}
                      className={`flex items-stretch ${wrapperMargin}`}
                    >
                      <div className="flex-1 border border-r-0 border-[#E5E7EB] rounded-2xl rounded-r-none p-4 flex flex-col gap-2">
                        <div className="text-[13px] text-[#111827] font-medium">
                          {coupon.couponName}
                        </div>
                        <div className="text-[20px] font-bold text-[#111827] leading-[1.3]">
                          {discountText}
                        </div>
                        <div className="flex flex-col gap-[2px] text-[11px] text-[#9CA3AF]">
                          {line1 && <span>{line1}</span>}
                          {line2 && <span>{line2}</span>}
                        </div>
                      </div>
                      <div className="w-[80px] bg-[#F9FAFB] border border-l-0 border-[#E5E7EB] rounded-2xl rounded-l-none flex items-center justify-center">
                        <button
                          type="button"
                          className="w-10 h-10 rounded-full bg:white border border-[#E5E7EB] flex items-center justify-center shadow-sm"
                          onClick={
                            isDownloaded
                              ? undefined
                              : () => handleCouponDownload(coupon.id)
                          }
                          disabled={isDownloaded}
                        >
                          <Icon
                            icon={
                              isDownloaded
                                ? "material-symbols:check-rounded"
                                : "streamline:arrow-down-2"
                            }
                            className="w-4 h-4 text-[#111827]"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {coupons.length === 0 && (
                  <div className="w-full py-6 text-center text-[12px] text-[#9CA3AF]">
                    사용 가능한 쿠폰이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-8 w-[92%] max-w-[420px] bg-[#111827] text-white rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-xl z-[60] transition-all duration-200 ease-out ${
          showCouponToast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
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

      {showReservationModal && (
        <>
          <div
            className="fixed inset-0 z:[70] bg-[rgba(0,0,0,0.6)]"
            onClick={() => setShowReservationModal(false)}
          />
          <div className="fixed inset-0 z:[80] flex items-center justify-center px-4">
            <div className="w-full max-w-[420px] rounded-[24px] bg-white pt-8 pb-8 px-6 shadow-2xl">
              <div className="flex flex-col items-center">
                <p className="text-[15px] text-[#FF2233] font-medium mb-2 text-center">
                  예약 요청을 보냈어요
                </p>
                <p className="text-[20px] font-semibold leading-[1.4] tracking-[-0.2px] text-[#1E2124] text-center mb-6">
                  판매자가 승인하면
                  <br />
                  예약이 확정돼요
                </p>
                <img
                  className="w-[204px] h-[204px] mb-6"
                  src="/images/reservation.png"
                  alt="예약 완료"
                />
              </div>

              <div className="mt-2">
                <button
                  type="button"
                  className="w-full h-[56px] rounded-[12px] bg-[#FF2233] flex items-center justify-center hover:brightness-95 transition-all"
                  onClick={() => {
                    setShowReservationModal(false);
                    navigate("/cart");
                  }}
                >
                  <span className="text-[16px] font-semibold text-white tracking-[-0.2px]">
                    장바구니 보러가기
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WebView;
