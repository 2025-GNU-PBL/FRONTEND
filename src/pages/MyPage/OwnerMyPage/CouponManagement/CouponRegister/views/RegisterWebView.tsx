import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import api from "../../../../../../lib/api/axios";

// -------- 추가된 부분: 명확한 태그 타입 지정 --------
interface ProductTag {
  tagName: string;
}

type ProductCategory =
  | "WEDDING"
  | "STUDIO"
  | "DRESS"
  | "MAKEUP"
  | "WEDDING_HALL";

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  WEDDING: "웨딩",
  WEDDING_HALL: "웨딩홀",
  STUDIO: "스튜디오",
  DRESS: "드레스",
  MAKEUP: "메이크업",
};

interface ProductPageResponse {
  id: number;
  name: string;
  starCount: number;
  address: string;
  detail: string;
  price: number;
  availableTime: string;
  createdAt: string;
  region: string;
  thumbnail: string;
  category: ProductCategory;
  tags: ProductTag[];
}

// ★ 숫자 문자열에서 콤마 제거
const removeCommas = (value: string) => value.replace(/,/g, "");

// ★ 숫자에 콤마 찍기 (문자열 기준)
const formatNumberWithCommas = (value: string) => {
  if (!value) return "";
  // 숫자만 남김
  const numeric = value.replace(/[^\d]/g, "");
  if (!numeric) return "";
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// 오늘 날짜를 로컬 기준(브라우저 타임존)으로 YYYY-MM-DD 문자열로 반환
const getTodayString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const local = new Date(today.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
};

const RegisterWebView = () => {
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponName, setCouponName] = useState<string>("");
  const [couponDetail, setCouponDetail] = useState<string>("");
  const [discountType, setDiscountType] = useState<"AMOUNT" | "RATE">("AMOUNT");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>("");

  const todayStr = getTodayString();

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [expirationDate, setExpirationDate] = useState<string>(todayStr);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);
  const [isProductDropdownOpen, setIsProductDropdownOpen] =
    useState<boolean>(false);
  const [products, setProducts] = useState<ProductPageResponse[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const generateCode = () => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 20; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return result;
    };
    setCouponCode(generateCode());
    fetchProducts();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get<{ content: ProductPageResponse[] }>(
        "/api/v1/product?pageNumber=1&pageSize=10"
      );
      const list = response.data.content || [];
      setProducts(list);

      if (list.length > 0 && selectedProductId === null) {
        const firstProduct = list[0];
        setSelectedProductId(firstProduct.id);
        setSelectedProductName(firstProduct.name);
        setSelectedCategory(firstProduct.category);
      }
    } catch (error: any) {
      console.error("상품 목록 API 호출 중 오류 발생:", error);
      toast.error(
        error.response?.data?.message || "상품 목록을 불러오는 중 오류가 발생했습니다."
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/log-in");
      }
    }
  };

  const handleProductSelect = (product: ProductPageResponse) => {
    setSelectedProductId(product.id);
    setSelectedProductName(product.name);
    setSelectedCategory(product.category);
    setIsProductDropdownOpen(false);
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (
      !couponCode ||
      !couponName ||
      !couponDetail ||
      !discountValue ||
      !minPurchaseAmount ||
      !startDate ||
      !expirationDate ||
      selectedProductId === null ||
      selectedCategory === null
    ) {
      toast.error("모든 필드를 입력해 주세요.");
      return;
    }

    const parsedDiscountValue = parseFloat(removeCommas(discountValue));
    const parsedMaxDiscountAmount = maxDiscountAmount
      ? parseFloat(removeCommas(maxDiscountAmount))
      : null;
    const parsedMinPurchaseAmount = parseFloat(removeCommas(minPurchaseAmount));

    if (parsedDiscountValue <= 0) {
      toast.error("할인 값은 0보다 커야 합니다.");
      return;
    }
    if (
      parsedMaxDiscountAmount !== null &&
      parsedMaxDiscountAmount <= 0
    ) {
      toast.error("최대 할인 금액은 0보다 커야 합니다.");
      return;
    }
    if (parsedMinPurchaseAmount < 0) {
      toast.error("최소 구매 금액은 0보다 크거나 같아야 합니다.");
      return;
    }

    if (new Date(startDate) > new Date(expirationDate)) {
      toast.error("시작일은 종료일보다 빨라야 합니다.");
      return;
    }

    const couponData = {
      couponCode,
      couponName,
      couponDetail,
      discountType,
      discountValue: parsedDiscountValue,
      maxDiscountAmount: parsedMaxDiscountAmount,
      minPurchaseAmount: parsedMinPurchaseAmount,
      startDate,
      expirationDate,
      productId: selectedProductId,
      category: selectedCategory,
    };

    try {
      const response = await api.post("/api/v1/owner/coupon", couponData);

      if (response.status === 201) {
        toast.success("쿠폰이 성공적으로 등록되었습니다!");
        navigate("/my-page/owner/coupons");
      } else {
        const errorData = response.data;
        toast.error(
          `쿠폰 등록 실패: ${errorData.message || response.statusText}`
        );
      }
    } catch (error: any) {
      console.error("쿠폰 등록 API 호출 중 오류 발생:", error);
      toast.error(
        error.response?.data?.message || "쿠폰 등록 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F6FA] pt-20 pb-10">
      <div className="max-w-[720px] mx-auto px-6 space-y-8">
        {/* 타이틀 영역 */}
        <div>
          <h1 className="text-[24px] font-bold text-[#111827]">쿠폰 등록</h1>
          <p className="mt-2 text-[14px] text-[#6B7280]">
            상품을 선택하고 쿠폰 정보를 입력해 고객에게 혜택을 제공해 보세요.
          </p>
        </div>

        {/* 상품 선택 & 카테고리 패널 */}
        <div
          ref={dropdownRef}
          className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:shop-linear"
                className="w-5 h-5 text-[#6B7280]"
              />
              <h2 className="text-[15px] font-semibold text-[#1E2124]">
                상품 선택
              </h2>
            </div>
            <span className="text-[12px] text-[#9CA3AF]">
              등록된 상품 중 하나를 선택하세요.
            </span>
          </div>

          {/* 상품 드롭다운 */}
          <div className="space-y-2 relative">
            <label className="text-[13px] font-medium text-[#1E2124]">
              상품
            </label>
            <button
              type="button"
              className="box-border flex flex-row items-center justify-between px-4 w-full h-[48px] border border-[#D1D5DB] rounded-[10px] bg-white text-left"
              onClick={() => {
                if (products.length === 0) {
                  toast.error("등록된 상품이 없습니다.");
                } else {
                  setIsProductDropdownOpen((prev) => !prev);
                }
              }}
              disabled={products.length === 0}
            >
              <span
                className={[
                  "text-[14px]",
                  selectedProductName || products.length === 0
                    ? "text-[#111827]"
                    : "text-[#9CA3AF]",
                ].join(" ")}
              >
                {products.length === 0
                  ? "등록된 상품 없음"
                  : selectedProductName || "상품을 선택해 주세요"}
              </span>
              <Icon
                icon={
                  isProductDropdownOpen
                    ? "solar:alt-arrow-up-linear"
                    : "solar:alt-arrow-down-linear"
                }
                className="w-5 h-5 text-[#4B5563]"
              />
            </button>

            {isProductDropdownOpen && products.length > 0 && (
              <div className="absolute top-[76px] left-0 w-full bg-white border border-[#D1D5DB] rounded-[10px] shadow-lg z-10 max-h-[220px] overflow-y-auto custom-scrollbar">
                <ul className="divide-y divide-[#F3F4F6]">
                  {products.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[#F9FAFB]"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex flex-col">
                        <span className="text-[14px] text-[#111827]">
                          {product.name}
                        </span>
                        <span className="text-[12px] text-[#9CA3AF]">
                          {CATEGORY_LABEL[product.category]} · ID: {product.id}
                        </span>
                      </div>
                      <Icon
                        icon="mdi:chevron-right"
                        className="w-5 h-5 text-[#D1D5DB]"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 선택된 카테고리 표시 */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#1E2124]">
              선택된 카테고리
            </label>
            <div className="w-full h-[44px] px-3 flex items-center rounded-lg bg-[#F6F7FB] border border-[#E5E7EB]">
              <span className="text-[14px] text-[#4B5563]">
                {selectedCategory
                  ? CATEGORY_LABEL[selectedCategory]
                  : "카테고리가 선택되지 않았습니다."}
              </span>
            </div>
          </div>
        </div>

        {/* 쿠폰 기본 정보 패널 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-5">
          <div className="flex items-center gap-2">
            <Icon
              icon="mdi:ticket-percent-outline"
              className="w-5 h-5 text-[#6B7280]"
            />
            <h2 className="text-[15px] font-semibold text-[#1E2124]">
              쿠폰 기본 정보
            </h2>
          </div>

          {/* 쿠폰 코드 */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#1E2124]">
              쿠폰 코드
            </label>
            <div className="w-full h-[44px] px-3 flex items-center rounded-lg bg-[#F6F7FB] border border-[#E5E7EB]">
              <span className="text-[14px] text-[#4B5563]">{couponCode}</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              자동으로 생성된 고유 쿠폰 코드입니다.
            </p>
          </div>

          {/* 쿠폰 이름 */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#1E2124]">
              쿠폰 이름
            </label>
            <div className="w-full h-[44px] px-3 flex items-center rounded-lg border border-[#E5E7EB] bg-white">
              <input
                type="text"
                placeholder="ex) 웨딩홀 주중 10% 할인 쿠폰"
                className={[
                  "w-full h-full text-[14px] bg-transparent outline-none",
                  couponName ? "text-[#111827]" : "placeholder:text-[#C1C1C1]",
                ].join(" ")}
                value={couponName}
                onChange={(e) => setCouponName(e.target.value)}
              />
            </div>
          </div>

          {/* 쿠폰 상세 설명 */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#1E2124]">
              쿠폰 상세 설명
            </label>
            <div className="w-full h-[44px] px-3 flex items-center rounded-lg border border-[#E5E7EB] bg-white">
              <input
                type="text"
                placeholder="ex) 특정 상품에만 적용 가능한 할인 쿠폰입니다."
                className={[
                  "w-full h-full text-[14px] bg-transparent outline-none",
                  couponDetail
                    ? "text-[#111827]"
                    : "placeholder:text-[#C1C1C1]",
                ].join(" ")}
                value={couponDetail}
                onChange={(e) => setCouponDetail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 할인 설정 패널 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:cash-multiple" className="w-5 h-5 text-[#6B7280]" />
            <h2 className="text-[15px] font-semibold text-[#1E2124]">
              할인 설정
            </h2>
          </div>

          {/* 할인 유형 */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#1E2124]">
              할인 유형
            </label>
            <div className="flex flex-row gap-3 h-[44px]">
              <button
                type="button"
                className={[
                  "flex-1 flex items-center justify-center rounded-[999px] border text-[14px]",
                  discountType === "AMOUNT"
                    ? "bg-[#FFE8EA] border-[#FF5B68] text-[#FF3344]"
                    : "bg-white border-[#E5E7EB] text-[#4B5563]",
                ].join(" ")}
                onClick={() => setDiscountType("AMOUNT")}
              >
                정액 할인
              </button>
              <button
                type="button"
                className={[
                  "flex-1 flex items-center justify-center rounded-[999px] border text-[14px]",
                  discountType === "RATE"
                    ? "bg-[#FFE8EA] border-[#FF5B68] text-[#FF3344]"
                    : "bg-white border-[#E5E7EB] text-[#4B5563]",
                ].join(" ")}
                onClick={() => setDiscountType("RATE")}
              >
                정율 할인
              </button>
            </div>
          </div>

          {/* 할인 값 */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#1E2124]">
              할인 값
            </label>
            <div className="w-full h-[44px] px-3 flex items-center rounded-lg border border-[#E5E7EB] bg-white">
              <input
                type="text"
                placeholder="ex) 10,000 (정액) / 10 (정율, %)"
                className={[
                  "w-full h-full text-[14px] bg-transparent outline-none",
                  discountValue
                    ? "text-[#111827]"
                    : "placeholder:text-[#C1C1C1]",
                ].join(" ")}
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(formatNumberWithCommas(e.target.value))
                }
              />
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              정액: 할인 금액(원), 정율: 할인 비율(%)로 숫자만 입력해 주세요.
            </p>
          </div>
        </div>

        {/* 사용 조건 & 최소/최대 금액 패널 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
          <div className="flex items-center gap-2">
            <Icon
              icon="mdi:clipboard-check-outline"
              className="w-5 h-5 text-[#6B7280]"
            />
            <h2 className="text-[15px] font-semibold text-[#1E2124]">
              사용 조건
            </h2>
          </div>

          {/* 최대 할인 금액 */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#1E2124]">
              최대 할인 금액
            </label>
            <div className="w-full h-[44px] px-3 flex items-center rounded-lg border border-[#E5E7EB] bg-white">
              <input
                type="text"
                placeholder="ex) 30,000"
                className={[
                  "w-full h-full text-[14px] bg-transparent outline-none",
                  maxDiscountAmount
                    ? "text-[#111827]"
                    : "placeholder:text-[#C1C1C1]",
                ].join(" ")}
                value={maxDiscountAmount}
                onChange={(e) =>
                  setMaxDiscountAmount(formatNumberWithCommas(e.target.value))
                }
              />
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              정율 쿠폰 사용 시 적용되는 최대 할인 금액입니다. (정액은 선택
              사항)
            </p>
          </div>

          {/* 최소 구매 금액 */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#1E2124]">
              최소 구매 금액
            </label>
            <div className="w-full h-[44px] px-3 flex items-center rounded-lg border border-[#E5E7EB] bg-white">
              <input
                type="text"
                placeholder="ex) 10,000"
                className={[
                  "w-full h-full text-[14px] bg-transparent outline-none",
                  minPurchaseAmount
                    ? "text-[#111827]"
                    : "placeholder:text-[#C1C1C1]",
                ].join(" ")}
                value={minPurchaseAmount}
                onChange={(e) =>
                  setMinPurchaseAmount(formatNumberWithCommas(e.target.value))
                }
              />
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              해당 금액 이상 결제 시에만 쿠폰이 적용됩니다.
            </p>
          </div>
        </div>

        {/* 쿠폰 기간 패널 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
          <div className="flex items-center gap-2">
            <Icon
              icon="mdi:calendar-range-outline"
              className="w-5 h-5 text-[#6B7280]"
            />
            <h2 className="text-[15px] font-semibold text-[#1E2124]">
              쿠폰 기간
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 시작일 */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#1E2124]">
                시작일
              </label>
              <div className="w-full h-[44px] px-3 flex items-center rounded-lg border border-[#E5E7EB] bg-white">
                <input
                  type="date"
                  className={[
                    "w-full h-full text-[14px] bg-transparent outline-none",
                    startDate ? "text-[#111827]" : "text-[#9CA3AF]",
                  ].join(" ")}
                  value={startDate}
                  min={todayStr} // 오늘 이전 선택 불가
                  onChange={(e) => {
                    const value = e.target.value;
                    setStartDate(value);
                    // 시작일 변경 시 종료일이 시작일보다 이전이면 종료일을 시작일로 보정
                    if (expirationDate && value && expirationDate < value) {
                      setExpirationDate(value);
                    }
                  }}
                />
              </div>
            </div>

            {/* 종료일 */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#1E2124]">
                종료일
              </label>
              <div className="w-full h-[44px] px-3 flex items-center rounded-lg border border-[#E5E7EB] bg-white">
                <input
                  type="date"
                  className={[
                    "w-full h-full text-[14px] bg-transparent outline-none",
                    expirationDate ? "text-[#111827]" : "text-[#9CA3AF]",
                  ].join(" ")}
                  value={expirationDate}
                  min={startDate || todayStr} // 시작일 이전 선택 불가
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#9CA3AF]">
            설정한 기간 동안에만 쿠폰이 사용 가능합니다.
          </p>
        </div>

        {/* 하단 버튼 */}
        <div className="pt-2">
          <button
            className="flex justify-center items-center w-full h-[52px] rounded-[12px] bg-[#FF2233] text-white text-[15px] font-semibold active:scale-95 transition-transform"
            onClick={handleSubmit}
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterWebView;
