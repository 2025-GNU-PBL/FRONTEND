import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

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

const generateCouponCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// 숫자 문자열에서 콤마 제거
const removeCommas = (value: string) => value.replace(/,/g, "");

// 숫자에 콤마 찍기 (문자열 기준)
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

const RegisterMobileView = () => {
  const todayStr = getTodayString();

  const [couponCode, setCouponCode] = useState<string>("");
  const [couponName, setCouponName] = useState<string>("");
  const [couponDetail, setCouponDetail] = useState<string>("");
  const [discountType, setDiscountType] = useState<"AMOUNT" | "RATE">("AMOUNT");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>("");
  // ★ 시작일, 종료일 기본값을 오늘 기준으로 세팅
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
    setCouponCode(generateCouponCode());
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
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      console.error("액세스 토큰이 없습니다.");
      toast.error("로그인 정보가 없습니다. 다시 로그인해 주세요.");
      navigate("/log-in");
      return;
    }
    try {
      const response = await fetch("/api/v1/product?pageNumber=1&pageSize=10", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const list: ProductPageResponse[] = data.content || [];
        setProducts(list);

        if (list.length > 0 && selectedProductId === null) {
          const firstProduct = list[0];
          setSelectedProductId(firstProduct.id);
          setSelectedProductName(firstProduct.name);
          setSelectedCategory(firstProduct.category);
        }
      } else {
        console.error("상품 목록 불러오기 실패:", response.statusText);
        toast.error("상품 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("상품 목록 API 호출 중 오류 발생:", error);
      toast.error("상품 목록을 불러오는 중 오류가 발생했습니다.");
    }
  };

  const handleProductSelect = (product: ProductPageResponse) => {
    setSelectedProductId(product.id);
    setSelectedProductName(product.name);
    setSelectedCategory(product.category);
    setIsProductDropdownOpen(false);
  };

  const handleSubmit = async () => {
    if (selectedProductId === null) {
      toast.error("상품을 선택해 주세요.");
      return;
    }
    if (selectedCategory === null) {
      toast.error("상품 카테고리를 선택해 주세요.");
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("로그인 정보가 없습니다. 다시 로그인해 주세요.");
      navigate("/log-in");
      return;
    }

    const couponData = {
      productId: selectedProductId,
      couponCode,
      couponName,
      couponDetail,
      discountType,
      // ★ 콤마 제거 후 숫자로 변환
      discountValue: parseFloat(removeCommas(discountValue)) || 0,
      maxDiscountAmount: parseFloat(removeCommas(maxDiscountAmount)) || 0,
      minPurchaseAmount: parseFloat(removeCommas(minPurchaseAmount)) || 0,
      category: selectedCategory ?? ("DRESS" as ProductCategory),
      startDate,
      expirationDate,
    };

    try {
      const response = await fetch("/api/v1/owner/coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(couponData),
      });

      if (response.ok) {
        toast.success("쿠폰이 성공적으로 등록되었습니다!");
        navigate("/my-page/owner/coupons");
      } else {
        const errorData = await response.json();
        toast.error(
          `쿠폰 등록 실패: ${
            errorData.message || response.statusText || "알 수 없는 오류"
          }`
        );
      }
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      toast.error("쿠폰 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-white flex flex-col pb-[116px]">
      {/* Page Title */}
      <div className="w-full h-[60px] bg-white flex flex-row justify-between items-center px-[20px] gap-[4px] shadow-sm">
        <button
          className="w-8 h-8 flex-none relative flex items-center justify-center"
          onClick={() => navigate(-1)}
        >
          <Icon
            icon="solar:alt-arrow-left-linear"
            className="w-[24px] h-[24px] text-[#1E2124]"
          />
        </button>
        <div className="h-[29px] font-['Pretendard'] font-semibold text-lg leading-[160%] text-center tracking-[-0.2px] text-black">
          쿠폰 등록
        </div>
        <div className="w-6 h-6 flex-none" />
      </div>

      {/* Form Content */}
      <div className="px-[20px] pt-[20px] flex flex-col items-start gap-[20px] flex-1">
        {/* Coupon Code */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            쿠폰 코드
          </div>
          <div className="flex flex-row items-center gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] w-full h-[49px] bg-[#F8F8F8] border border-[#E8E8E8] rounded-[8px]">
              <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-[#949494] break-all">
                {couponCode}
              </div>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div
          className="flex flex-col items-start gap-[10px] w-full relative"
          ref={dropdownRef}
        >
          <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            상품 선택
          </div>
          <button
            className="box-border flex flex-row items-center justify-between px-[16px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]"
            onClick={() => {
              if (products.length === 0) {
                toast.error("등록된 상품이 없습니다.");
              } else {
                setIsProductDropdownOpen((prev) => !prev);
              }
            }}
            disabled={products.length === 0}
          >
            <div
              className={`w-full h-full flex items-center font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] ${
                selectedProductName || products.length === 0
                  ? "text-black"
                  : "text-[#9D9D9D]"
              }`}
            >
              {products.length === 0
                ? "등록된 상품 없음"
                : selectedProductName || "상품을 선택해 주세요"}
            </div>
            <Icon
              icon="solar:magnifer-linear"
              className="w-[20px] h-[20px] text-[#1E2124]"
            />
          </button>
          {isProductDropdownOpen && products.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white border border-[#D9D9D9] rounded-[8px] shadow-lg z-10 max-h-[200px] overflow-y-auto custom-scrollbar">
              <ul>
                {products.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between p-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleProductSelect(product)}
                  >
                    <span>{product.name}</span>
                    <span className="text-gray-500 text-sm">
                      ID: {product.id}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Coupon Name */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            쿠폰 이름
          </div>
          <div className="flex flex-row items-center gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="쿠폰명을 입력해 주세요"
                className={`w-full h-full font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${
                  couponName ? "text-black" : "text-[#9D9D9D]"
                }`}
                value={couponName}
                onChange={(e) => setCouponName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Coupon Detail */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            쿠폰 상세 설명
          </div>
          <div className="flex flex-row items-center gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="쿠폰 설명을 입력해 주세요"
                className={`w-full h-full font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${
                  couponDetail ? "text-black" : "text-[#9D9D9D]"
                }`}
                value={couponDetail}
                onChange={(e) => setCouponDetail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category Display */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            선택된 카테고리
          </div>
          <div className="box-border flex flex-row items-center pl-[16px] w-full h-[49px] bg-[#F8F8F8] border border-[#E8E8E8] rounded-[8px]">
            <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-[#949494]">
              {selectedCategory
                ? CATEGORY_LABEL[selectedCategory]
                : "카테고리가 선택되지 않았습니다."}
            </div>
          </div>
        </div>

        {/* Discount Type */}
        <div className="w-full relative mt-[10px]">
          <div className="h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            할인 유형
          </div>
          <div className="flex flex-row w-full h-[49px] mt-[10px] gap-3">
            <button
              type="button"
              className={`box-border flex flex-col justify-center items-center flex-1 h-[49px] rounded-[10px] cursor-pointer border ${
                discountType === "AMOUNT"
                  ? "border-[#1E2124]"
                  : "border-[#E8E8E8]"
              }`}
              onClick={() => setDiscountType("AMOUNT")}
            >
              <div className="flex flex-col justify-center items-center px-[20px] w-full h-[22px]">
                <div className="flex flex-row items-center w-full h-[22px] justify-center">
                  <div
                    className={`w-full h-[22px] font-['Pretendard'] text-sm leading-[160%] text-center tracking-[-0.2px] ${
                      discountType === "AMOUNT"
                        ? "text-[#1E2124]"
                        : "text-[#9D9D9D]"
                    }`}
                  >
                    정액
                  </div>
                </div>
              </div>
            </button>
            <button
              type="button"
              className={`box-border flex flex-col justify-center items-center flex-1 h-[49px] rounded-[10px] cursor-pointer border ${
                discountType === "RATE"
                  ? "border-[#1E2124]"
                  : "border-[#E8E8E8]"
              }`}
              onClick={() => setDiscountType("RATE")}
            >
              <div className="flex flex-col justify-center items-center px-[20px] w-full h-[22px]">
                <div className="flex flex-row justify-center items-center w-full h-[22px]">
                  <div
                    className={`w-full h-[22px] font-['Pretendard'] text-sm leading-[160%] text-center tracking-[-0.2px] ${
                      discountType === "RATE"
                        ? "text-[#1E2124]"
                        : "text-[#9D9D9D]"
                    }`}
                  >
                    정율
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Discount Value */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            할인 값
          </div>
          <div className="flex flex-row items-center gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="ex) 1,000원 => 1,000 / 10% => 10"
                className={`w-full h-full font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${
                  discountValue ? "text-black" : "text-[#9D9D9D]"
                }`}
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(formatNumberWithCommas(e.target.value))
                }
              />
            </div>
          </div>
        </div>

        {/* Max Discount Amount */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            최대 할인 금액
          </div>
          <div className="flex flex-row items-center gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="ex) 30,000"
                className={`w-full h-full font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${
                  maxDiscountAmount ? "text-black" : "text-[#9D9D9D]"
                }`}
                value={maxDiscountAmount}
                onChange={(e) =>
                  setMaxDiscountAmount(formatNumberWithCommas(e.target.value))
                }
              />
            </div>
          </div>
        </div>

        {/* Min Purchase Amount */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            최소 구매 금액
          </div>
          <div className="flex flex-row items-center gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="ex) 10,000"
                className={`w-full h-full font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${
                  minPurchaseAmount ? "text-black" : "text-[#9D9D9D]"
                }`}
                value={minPurchaseAmount}
                onChange={(e) =>
                  setMinPurchaseAmount(formatNumberWithCommas(e.target.value))
                }
              />
            </div>
          </div>
        </div>

        {/* Coupon Period */}
        <div className="w-full relative mt-[10px] mb-[20px]">
          <div className="h-[21px] font-['Pretendard'] text-sm leading-[150%] tracking-[-0.2px] text-black">
            쿠폰 기간
          </div>
          <div className="flex flex-row w-full h-[49px] mt-[10px] gap-3">
            {/* 시작일: 오늘 이전 날짜 선택 불가 */}
            <div className="box-border relative flex flex-row items-center justify-between flex-1 h-[49px] border border-[#E8E8E8] rounded-[10px]">
              <input
                type="date"
                className={`w-full h-full font-['Pretendard'] text-sm leading-[160%] tracking-[-0.2px] border-none focus:outline-none bg-transparent pl-[16px] pr-[16px] ${
                  startDate ? "text-black" : "text-[#9D9D9D]"
                }`}
                value={startDate}
                min={todayStr} // ★ 오늘 이전 선택 불가
                onChange={(e) => {
                  const value = e.target.value;
                  setStartDate(value);
                  // 시작일을 바꿨는데 종료일이 시작일보다 이전이면 종료일도 맞춰 줌
                  if (expirationDate && value && expirationDate < value) {
                    setExpirationDate(value);
                  }
                }}
              />
            </div>
            {/* 종료일: 시작일 이전은 선택 불가 */}
            <div className="box-border relative flex flex-row items-center justify-between flex-1 h-[49px] border border-[#E8E8E8] rounded-[10px]">
              <input
                type="date"
                className={`w-full h-full font-['Pretendard'] text-sm leading-[160%] tracking-[-0.2px] border-none focus:outline-none bg-transparent pl-[16px] pr-[16px] ${
                  expirationDate ? "text-black" : "text-[#9D9D9D]"
                }`}
                value={expirationDate}
                min={startDate || todayStr}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="absolute bottom-0 left-0 w-full h-[96px] flex flex-col justify-center items-center px-[20px] py-[20px]">
        <button
          className="flex flex-col justify-center items-center p-[16px] w-full h-[56px] bg-[#FF2233] rounded-[12px]"
          onClick={handleSubmit}
        >
          <div className="flex flex-row justify-center items-center gap-[8px] h-[24px]">
            <div className="h-[24px] font-['Pretendard'] font-semibold text-base leading-[150%] text-center tracking-[-0.2px] text-white">
              등록하기
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default RegisterMobileView;
