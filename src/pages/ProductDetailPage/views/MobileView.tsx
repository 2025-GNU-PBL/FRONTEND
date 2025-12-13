import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import type { AxiosError } from "axios";
import api from "../../../lib/api/axios";
import { BasicInfoContent } from "../sections/BasicInfoContent";
import { DetailContent } from "../sections/DetailContent";
import ReviewContent from "../sections/ReviewContent"; // ✅ default import
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
import { toast } from "react-toastify"; // ✅ 토스트

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

const MobileView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isAuth = useAppSelector((s) => s.user.isAuth);
  const role = useAppSelector((s) => s.user.role); // 🔹 role 사용

  // ✅ OWNER일 때만 bzName 안전하게 꺼내기
  const ownerBzName = useAppSelector((s) => {
    const data = s.user.userData;
    const userRole = s.user.role;

    if (userRole === "OWNER" && data && "bzName" in data) {
      return data.bzName;
    }
    return undefined;
  });

  const [activeTab, setActiveTab] = useState<"basic" | "detail" | "review">(
    "basic"
  );
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [showCouponToast, setShowCouponToast] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0); // 장바구니 상품 개수 상태

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

  /* ========= 장바구니 공용 로직 (알럿 → toast) ========= */
  const addToCartCore = async (): Promise<boolean> => {
    if (!detailData || !id) {
      toast.error("상품 정보를 불러올 수 없습니다.");
      return false;
    }

    try {
      // 수량은 기본 1로 설정. 필요시 UI 추가하여 변경
      const quantity = 1;
      await api.post("/api/v1/cart", {
        productId: Number(id),
        quantity,
      });

      // 장바구니 개수 갱신
      const response = await api.get<number>("/api/v1/cart/count");
      setCartCount(response.data);

      return true;
    } catch (error) {
      console.error("장바구니 추가 실패:", error);
      toast.error("장바구니 추가에 실패했습니다.");
      return false;
    }
  };

  /* ========= 장바구니 버튼용 (성공도 toast) ========= */
  const addToCart = async () => {
    const ok = await addToCartCore();
    if (!ok) return;
    toast.success("상품이 장바구니에 담겼습니다.");
  };

  /* ========= 상품 예약 버튼용 (모달 O, 알럿 X) ========= */
  const handleProductReservation = async () => {
    const ok = await addToCartCore();
    if (!ok) return;

    // 예약용 예쁜 바텀시트 모달 오픈
    setShowReservationModal(true);
  };

  /* ========= 수정하기 버튼용 ========= */
  const handleEditProduct = () => {
    if (!category || !id) {
      toast.error("상품 정보를 불러올 수 없습니다.");
      return;
    }
    navigate(`/my-page/owner/product/edit/${category}/${id}`);
  };

  /* ========================= 플로팅 버튼 핸들러 ========================= */

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
        // 공유 취소 등은 무시
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

  // ✅ 채팅 버튼: 상품 기반 채팅방 열기 API 연동
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
        // 필요하면 로그인 페이지로 이동
        // navigate("/login");
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

  // 쿠폰 다운로드
  const handleCouponDownload = async (couponId: number) => {
    // 이미 다운로드된 쿠폰이면 무시
    if (downloadedCouponIds.includes(couponId) || myCouponIds.has(couponId)) {
      return;
    }
    // 토스트 떠 있는 동안에는 중복 클릭 방지
    if (showCouponToast) return;

    try {
      const { data } = await api.post(
        `/api/v1/customer/coupon/${couponId}/download`
      );

      // 응답 콘솔에서 확인
      console.log("쿠폰 다운로드 응답:", data);

      // 다운로드 완료된 쿠폰 id 저장 (세션용)
      setDownloadedCouponIds((prev) =>
        prev.includes(couponId) ? prev : [...prev, couponId]
      );

      // 내 쿠폰 목록에도 반영 (서버 반영 전까지 UI용)
      setMyCouponIds((prev) => {
        const next = new Set(prev);
        next.add(couponId);
        return next;
      });

      // 다운로드 완료 토스트 (기존 커스텀 토스트 유지)
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

    // 컴포넌트 마운트 시 장바구니 개수 조회
    if (isAuth) {
      const fetchCartCount = async () => {
        try {
          const response = await api.get<number>("/api/v1/cart/count");
          setCartCount(response.data);
        } catch (error) {
          console.error(
            "Failed to fetch cart count (ProductDetailPage MobileView):",
            error
          );
        }
      };
      fetchCartCount();
    }
  }, [location.pathname, isAuth]);

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

        console.log(data);

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

        // 기존 UI 제어용 배열에도 동기화
        setDownloadedCouponIds(Array.from(ids));
      } catch (error) {
        console.error("내 쿠폰 목록 조회 실패:", error);
      }
    };

    fetchMyCoupons();
  }, [isAuth]);

  /* ========================= 핸들러: 평점후기 탭으로 이동 ========================= */

  const handleGoReviewTab = () => {
    setActiveTab("review");

    // ✅ 평점후기 탭으로 전환하면서 화면 최상단으로 스크롤
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto", // 필요하면 'smooth' 로 변경 가능
      });
    }
  };

  /* ========================= 핸들러: 상품상세 탭으로 이동 ========================= */

  const handleGoDetailTab = () => {
    setActiveTab("detail");

    // ✅ 상품상세 탭으로 전환하면서 화면 최상단으로 스크롤
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto", // 필요하면 'smooth' 로 변경 가능
      });
    }
  };

  /* ========================= 오너 여부 판별 ========================= */
  const isOwnerOfProduct =
    !!detailData && !!ownerBzName && detailData.bzName === ownerBzName;

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

            {/* 카트 (로그인 + role !== OWNER 일 때만) */}
            {isAuth && role !== "OWNER" && (
              <button
                type="button"
                className="relative w-6 h-6 flex items-center justify-center"
                onClick={handleGoCart}
              >
                <Icon
                  icon="solar:cart-large-minimalistic-linear"
                  className="w-6 h-6 text-[#1E2124]"
                />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-[3px] bg-[#FF2233] text-[9px] text-white rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </header>

        {/* 탭 바: 기본정보 / 상세설명·사진 / 평점후기 */}
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
        <main className="pb-[80px]">
          {!loading && !errorMsg && detailData && (
            <>
              {activeTab === "basic" && (
                <BasicInfoContent
                  data={detailData}
                  onOpenCoupon={handleOpenCoupon}
                  onGoReviewTab={handleGoReviewTab}
                  onGoDetailTab={handleGoDetailTab}
                />
              )}

              {activeTab === "detail" && <DetailContent data={detailData} />}

              {activeTab === "review" && (
                <ReviewContent targetId={detailData.id} />
              )}
            </>
          )}
        </main>

        {/* ================== 우측 하단 플로팅 버튼 (공유 / 채팅) ================== */}
        {role !== "OWNER" && (
          <div className="fixed right-4 bottom-[100px] flex flex-col items-center gap-2 z-40">
            {/* 채팅 버튼: ✅ isAuth일 때만 표시 */}
            {isAuth && (
              <button
                type="button"
                onClick={handleChat}
                className="box-border flex items-center justify-center w-10 h-10 rounded-[20px] bg-white border border-[#D9D9D9] shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-95 transition-transform"
              >
                <Icon
                  icon="fluent:chat-16-regular"
                  className="w-6 h-6 text-[#333333]"
                />
              </button>
            )}

            {/* 공유 버튼 */}
            <button
              type="button"
              onClick={handleShare}
              className="box-border flex items-center justify-center w-10 h-10 rounded-[20px] bg-white border border-[#D9D9D9] shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-95 transition-transform"
            >
              <Icon
                icon="solar:share-linear"
                className="w-6 h-6 text-[#333333]"
              />
            </button>
          </div>
        )}

        {/* ===== 하단 고정 버튼 =====
            - 일반 유저: 장바구니 / 상품예약
            - OWNER + 내 업체 상품: 수정하기
            - OWNER + 내 업체 상품 아님: 아예 숨김
        */}
        {!loading &&
          !errorMsg &&
          detailData &&
          (role !== "OWNER" || isOwnerOfProduct) && (
            <div className="fixed left-0 bottom-0 w-full bg-white px-4 pt-3 pb-5 z-30">
              {isOwnerOfProduct ? (
                <button
                  type="button"
                  className="w-full h-[56px] rounded-[12px] bg-[#FF2233] text-white text-[16px] font-semibold flex items-center justify-center"
                  onClick={handleEditProduct}
                >
                  수정하기
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 h-[56px] border border-black/20 rounded-[12px] flex items-center justify-center text-[16px] font-semibold text-black/80"
                    onClick={addToCart}
                  >
                    장바구니
                  </button>
                  <button
                    type="button"
                    className="flex-1 h-[56px] rounded-[12px] bg-[#FF2233] text-white text-[16px] font-semibold flex items-center justify-center"
                    onClick={handleProductReservation}
                  >
                    상품예약
                  </button>
                </div>
              )}
            </div>
          )}

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
            {/* ✅ 쿠폰이 없을 때 Empty State */}
            {coupons.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-10">
                <div className="w-[64px] h-[64px] rounded-full bg-[#F6F7FB] flex items-center justify-center mb-4">
                  <Icon
                    icon="solar:ticket-sale-linear"
                    className="w-7 h-7 text-[#B0B5C0]"
                  />
                </div>
                <p className="text-[15px] font-semibold text-[#1E2124] mb-1 text-center">
                  받을 수 있는 쿠폰이 없어요
                </p>
                <p className="text-[13px] text-[#999999] leading-[1.6] text-center">
                  이 상품에는 현재 사용 가능한 쿠폰이 없어요.
                  <br />
                  추후 이벤트나 프로모션이 열리면 쿠폰이 추가될 수 있어요.
                </p>
              </div>
            ) : (
              <>
                {/* ✅ 디자인은 그대로, 내용만 API + 내 쿠폰 상태로 렌더링 */}
                {coupons.map((coupon, index) => {
                  const isFirst = index === 0;
                  const isLast = index === coupons.length - 1;

                  // 서버에서 조회한 내 쿠폰 + 현재 세션 다운로드 내역 둘 다 고려
                  const isDownloaded =
                    downloadedCouponIds.includes(coupon.id) ||
                    myCouponIds.has(coupon.id);

                  const wrapperMargin = [
                    isFirst ? "mt-5" : "mt-4",
                    isLast ? "mb-2" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

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
                      className={`w-full flex items-stretch ${wrapperMargin}`}
                    >
                      <div className="flex-1 border border-r-0 border-[#F2F2F2] rounded-l-[16px] p-4 flex flex-col gap-2">
                        <div className="text-[14px] text-[#000000]">
                          {coupon.couponName}
                        </div>
                        <div className="text-[20px] font-bold text-[#000000] leading-[1.4]">
                          {discountText}
                        </div>
                        <div className="flex flex-col gap-[2px] text-[12px] text-[#999999]">
                          {line1 && <span>{line1}</span>}
                          {line2 && <span>{line2}</span>}
                        </div>
                      </div>
                      <div className="w-[72px] bg-[#F6F7FB] border border-l-0 border-[#F2F2F2] rounded-r-[16px] flex items-center justify-center">
                        <button
                          type="button"
                          className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
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
                                ? "material-symbols:check-rounded" // 다운로드 완료 상태 아이콘
                                : "streamline:arrow-down-2" // 다운로드 전 아이콘
                            }
                            className="w-4 h-4 text-[#000000]"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
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

        {/* ================== 상품 예약 완료 모달 ================== */}
        {showReservationModal && (
          <>
            {/* 딤드 */}
            <div
              className="fixed inset-0 z-[70] bg-[rgba(0,0,0,0.6)]"
              onClick={() => setShowReservationModal(false)}
            />

            {/* 바텀시트 모달 */}
            <div className="fixed inset-x-0 bottom-0 z-[80] rounded-t-[24px] bg-white pt-8 pb-8 px-5">
              <div className="flex flex-col items-center">
                <p className="text-[15px] text-[#FF2233] font-medium mb-2 text-center">
                  예약 요청을 보냈어요
                </p>
                <p className="text-[20px] font-semibold leading-[1.4] tracking-[-0.2px] text-[#1E2124] text-center mb-6">
                  판매자가 승인하면
                  <br />
                  예약이 확정돼요
                </p>

                {/* 일러스트 영역 */}
                <img
                  className="w-[204px] h-[204px] mb-6 flex items-center justify-center"
                  src="/images/reservation.png"
                  alt="예약 완료 일러스트"
                />
              </div>

              <div className="mt-2">
                <button
                  type="button"
                  className="w-full h-[56px] rounded-[12px] bg-[#FF2233] flex items-center justify-center"
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
          </>
        )}
      </div>
    </div>
  );
};

export default MobileView;
