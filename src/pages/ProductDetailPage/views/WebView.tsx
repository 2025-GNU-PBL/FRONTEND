// WebView.tsx
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  Coupon,
  MyCoupon,
} from "../../../type/product";

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

/* ========================= 컴포넌트 ========================= */

const WebView = () => {
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

  // 상품별 쿠폰 리스트 (오너가 설정한 쿠폰)
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  // 이미 내가 가진 쿠폰 id 목록 (couponId 기준)
  const [myCouponIds, setMyCouponIds] = useState<Set<number>>(
    () => new Set<number>()
  );
  // 현재 세션에서 다운로드한 쿠폰 id 목록 (UI 즉시 반영용)
  const [downloadedCouponIds, setDownloadedCouponIds] = useState<number[]>([]);

  // 상품예약 완료 모달
  const [showReservationModal, setShowReservationModal] = useState(false);

  /* ========================= 네비게이션 ========================= */

  const handleGoCart = () => {
    navigate("/cart");
  };

  /* ========= 장바구니 공용 로직 (알럿 X) ========= */
  const addToCartCore = async (): Promise<boolean> => {
    if (!detailData || !id) {
      alert("상품 정보를 불러올 수 없습니다.");
      return false;
    }

    try {
      const quantity = 1;
      await api.post("/api/v1/cart", {
        productId: Number(id),
        quantity,
      });

      return true;
    } catch (error) {
      console.error("장바구니 추가 실패:", error);
      alert("장바구니 추가에 실패했습니다.");
      return false;
    }
  };

  /* ========= 상품 예약 버튼용 (모달 O, 알럿 X) ========= */
  const handleProductReservation = async () => {
    const ok = await addToCartCore();
    if (!ok) return;

    // 예약 완료 모달 오픈
    setShowReservationModal(true);
  };

  /* ========================= 쿠폰 ========================= */

  const handleOpenCoupon = () => {
    setIsCouponOpen(true);
  };

  const handleCloseCoupon = () => {
    setIsCouponOpen(false);
  };

  // 쿠폰 다운로드
  const handleCouponDownload = async (couponId: number) => {
    // 이미 다운로드된 쿠폰이면 무시
    if (downloadedCouponIds.includes(couponId) || myCouponIds.has(couponId)) {
      return;
    }
    // 토스트 떠 있는 동안 중복 클릭 방지
    if (showCouponToast) return;

    try {
      const { data } = await api.post(
        `/api/v1/customer/coupon/${couponId}/download`
      );

      console.log("쿠폰 다운로드 응답:", data);

      // 세션용 다운로드 목록에 반영
      setDownloadedCouponIds((prev) =>
        prev.includes(couponId) ? prev : [...prev, couponId]
      );

      // 내 쿠폰 Set에도 반영
      setMyCouponIds((prev) => {
        const next = new Set(prev);
        next.add(couponId);
        return next;
      });

      // 토스트 표시
      setShowCouponToast(true);
      setTimeout(() => {
        setShowCouponToast(false);
      }, 3000);
    } catch (error) {
      console.error("쿠폰 다운로드 실패:", error);
      alert("쿠폰 다운로드에 실패했습니다.");
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

  // 1) 상품별 쿠폰 (오너 설정 쿠폰 목록)
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

  // 2) 내 쿠폰 목록 (이미 다운로드한 쿠폰들)
  useEffect(() => {
    if (!isAuth) return;

    const fetchMyCoupons = async () => {
      try {
        const { data } = await api.get<MyCoupon[]>(
          "/api/v1/customer/coupon/my"
        );

        // 서버에서 내려준 쿠폰 id들을 Set으로 관리
        const ids = new Set<number>(data.map((c) => c.couponId));
        setMyCouponIds(ids);

        // UI 제어용 배열에도 동기화
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
                      onClick={handleProductReservation}
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
                {coupons.map((coupon, index) => {
                  const isFirst = index === 0;
                  const isLast = index === coupons.length - 1;

                  const wrapperMargin = [
                    isFirst ? "mt-4" : "mt-3",
                    isLast ? "mb-2" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  // 모바일과 동일: 서버 + 세션 상태 모두 고려해서 다운로드 여부 체크
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
                      <div className="flex-1 border border-r-0 border-[#E5E7EB] rounded-l-2xl p-4 flex flex-col gap-2">
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
                      <div className="w-[80px] bg-[#F9FAFB] border border-l-0 border-[#E5E7EB] rounded-r-2xl flex items-center justify-center">
                        <button
                          type="button"
                          className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm"
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
                                ? "material-symbols:check-rounded" // 다운로드 완료 아이콘
                                : "streamline:arrow-down-2" // 다운로드 전 아이콘
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

      {/* ================== 상품 예약 완료 모달 (웹뷰 전용 중앙 카드) ================== */}
      {showReservationModal && (
        <>
          {/* 딤드 */}
          <div
            className="fixed inset-0 z-[70] bg-[rgba(0,0,0,0.6)]"
            onClick={() => setShowReservationModal(false)}
          />

          {/* 중앙 카드 모달 */}
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
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

                {/* 일러스트 영역 (모바일과 동일 이미지 사용) */}
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
