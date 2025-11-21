import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
  category: ProductCategory; // 타입 변경
  tags: any[]; // Adjust based on actual TagResponse structure if needed
}

const RegisterMobileView = () => {
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponName, setCouponName] = useState<string>("");
  const [couponDetail, setCouponDetail] = useState<string>("");
  const [discountType, setDiscountType] = useState<"AMOUNT" | "RATE">("AMOUNT"); // Default to AMOUNT based on user's change
  const [discountValue, setDiscountValue] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("2025-11-11"); // Initial values from image
  const [expirationDate, setExpirationDate] = useState<string>("2025-11-12"); // Initial values from image
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null); // selectedCategory 상태 추가
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false); // 드롭다운 상태 추가
  const [products, setProducts] = useState<ProductPageResponse[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null); // 드롭다운 참조 추가
  const navigate = useNavigate();

  useEffect(() => {
    const generateCode = () => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 20; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };
    setCouponCode(generateCode());
    fetchProducts(); // 컴포넌트 마운트 시 상품 목록을 가져옵니다.

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchProducts = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      console.error("액세스 토큰이 없습니다.");
      alert("로그인 정보가 없습니다. 다시 로그인해 주세요.");
      navigate("/log-in"); // 로그인 페이지로 리디렉션
      return;
    }
    try {
      const response = await fetch("/api/v1/product?pageNumber=1&pageSize=10", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // AccessToken 추가
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.content || []); // Assuming the API returns a 'content' array for products
        if (data.content && data.content.length > 0 && selectedProductId === null) {
          // 상품 목록을 불러온 후, 선택된 상품이 없으면 첫 번째 상품으로 자동 선택
          const firstProduct = data.content[0];
          setSelectedProductId(firstProduct.id);
          setSelectedProductName(firstProduct.name);
          setSelectedCategory(firstProduct.category); // 첫 번째 상품의 카테고리도 설정
        }
      } else {
        console.error("상품 목록 불러오기 실패:", response.statusText);
        alert("상품 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("상품 목록 API 호출 중 오류 발생:", error);
      alert("상품 목록을 불러오는 중 오류가 발생했습니다.");
    }
  };

  const handleProductSelect = (product: ProductPageResponse) => {
    setSelectedProductId(product.id);
    setSelectedProductName(product.name);
    setSelectedCategory(product.category); // 선택된 상품의 카테고리 업데이트
    setIsProductDropdownOpen(false); // 상품 선택 시 드롭다운 닫기
  };

  const handleSubmit = async () => {
    if (selectedProductId === null) {
      alert("상품을 선택해 주세요.");
      return;
    }
    if (selectedCategory === null) { // selectedCategory 유효성 검사 추가
      alert("상품 카테고리를 선택해 주세요.");
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("로그인 정보가 없습니다. 다시 로그인해 주세요.");
      navigate("/log-in"); // 로그인 페이지로 리디렉션
      return;
    }

    const couponData = {
      productId: selectedProductId, // Use the selected product ID
      couponCode, // Use the generated coupon code
      couponName,
      couponDetail,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      maxDiscountAmount: parseFloat(maxDiscountAmount) || 0,
      minPurchaseAmount: parseFloat(minPurchaseAmount) || 0,
      category: selectedCategory ?? ("DRESS" as ProductCategory), // selectedCategory 사용, null일 경우 DRESS를 fallback으로
      startDate,
      expirationDate,
    };

    try {
      const response = await fetch("/api/v1/owner/coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // AccessToken 추가
        },
        body: JSON.stringify(couponData),
      });

      if (response.ok) {
        alert("쿠폰이 성공적으로 등록되었습니다!");
        navigate("/my-page/owner/coupons"); // 쿠폰함 페이지로 리다이렉트
      } else {
        const errorData = await response.json();
        alert(`쿠폰 등록 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      alert("쿠폰 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="relative w-[390px] min-h-screen bg-white pb-[116px]">
      {/* Page Title */}
      <div className="w-full h-[60px] bg-white flex flex-row justify-between items-center px-[20px] gap-[4px] shadow-sm">
        <button
          className="w-8 h-8 flex-none order-0 flex-grow-0 relative"
          onClick={() => navigate(-1)}
        >
          {/* Back Arrow Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--solar w-[24px] h-[24px] text-[#1E2124] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m15 5l-6 7l6 7"></path></svg>
        </button>
        <div className="w-[66px] h-[29px] font-['Pretendard'] font-semibold text-lg leading-[160%] text-center tracking-[-0.2px] text-black flex-none order-1 flex-grow-0">
          쿠폰 등록
        </div>
        <div className="w-6 h-6 flex-none order-2 flex-grow-0"></div> {/* Placeholder for right icon */}
      </div>

      {/* Form Content */}
      <div className="px-[20px] pt-[20px] flex flex-col items-start gap-[20px]">
        {/* Coupon Code */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            쿠폰 코드
          </div>
          <div className="flex flex-row items-center p-0 gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] gap-[8px] w-full h-[49px] bg-[#F8F8F8] border border-[#E8E8E8] rounded-[8px]">
              <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-[#949494]">
                {couponCode}
              </div>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="flex flex-col items-start gap-[10px] w-full relative" ref={dropdownRef}> {/* ref 추가 */}
          <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            상품 선택
          </div>
          <button
            className="box-border flex flex-row items-center justify-between pl-[16px] pr-[16px] gap-[8px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]"
            onClick={() => {
              if (products.length === 0) {
                alert("등록된 상품이 없습니다.");
              } else {
                setIsProductDropdownOpen((prev) => !prev); // 드롭다운 토글
              }
            }}
            disabled={products.length === 0}
          >
            <div className={`w-full h-full flex items-center font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] ${selectedProductName || products.length === 0 ? "text-black" : "text-[#9D9D9D]"}`}>
              {products.length === 0 ? "등록된 상품 없음" : selectedProductName || "상품을 선택해 주세요"}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
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
                    <span className="text-gray-500 text-sm">ID: {product.id}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Coupon Name */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            쿠폰 이름
          </div>
          <div className="flex flex-row items-center p-0 gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] gap-[8px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="상품명을 입력해 주세요"
                className={`w-full h-full font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${couponName ? "text-black" : "text-[#9D9D9D]"}`}
                value={couponName}
                onChange={(e) => setCouponName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Coupon Detail */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            쿠폰 상세 설명
          </div>
          <div className="flex flex-row items-center p-0 gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] gap-[8px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="상품명을 입력해 주세요"
                className={`w-full h-full font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${couponDetail ? "text-black" : "text-[#9D9D9D]"}`}
                value={couponDetail}
                onChange={(e) => setCouponDetail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category Display (추가) */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            선택된 카테고리
          </div>
          <div className="box-border flex flex-row items-center pl-[16px] gap-[8px] w-full h-[49px] bg-[#F8F8F8] border border-[#E8E8E8] rounded-[8px]">
            <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-[#949494]">
              {selectedCategory ? CATEGORY_LABEL[selectedCategory] : "카테고리가 선택되지 않았습니다."}
            </div>
          </div>
        </div>

        {/* Discount Type */}
        <div className="w-full relative mt-[10px]">
          <div className="w-[52px] h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            할인 유형
          </div>
          <div className="flex flex-row justify-between w-full h-[49px] mt-[10px]">
            <div className="box-border flex flex-col justify-center items-center p-0 w-[170px] h-[49px] rounded-[10px] cursor-pointer"
              style={{ borderColor: discountType === "AMOUNT" ? "#1E2124" : "#E8E8E8", borderWidth: "1px" }}
              onClick={() => setDiscountType("AMOUNT")}>
              <div className="flex flex-col justify-center items-center px-[20px] p-0 gap-[300px] w-full h-[22px]">
                <div className="flex flex-row items-center p-0 w-[130px] h-[22px]">
                  <div className="w-[130px] h-[22px] font-['Pretendard'] font-normal text-sm leading-[160%] text-center tracking-[-0.2px] flex-none order-0 flex-grow"
                    style={{ color: discountType === "AMOUNT" ? "#1E2124" : "#9D9D9D" }}>
                    정액
                  </div>
                </div>
              </div>
            </div>
            <div className="box-border flex flex-col justify-center items-center p-0 w-[170px] h-[49px] rounded-[10px] cursor-pointer"
              style={{ borderColor: discountType === "RATE" ? "#1E2124" : "#E8E8E8", borderWidth: "1px" }}
              onClick={() => setDiscountType("RATE")}>
              <div className="flex flex-col justify-center items-center px-[20px] p-0 gap-[300px] w-full h-[22px]">
                <div className="flex flex-row justify-center items-center p-0 w-[130px] h-[22px]">
                  <div className="w-[130px] h-[22px] font-['Pretendard'] font-normal text-sm leading-[160%] text-center tracking-[-0.2px] flex-none order-0 flex-grow"
                    style={{ color: discountType === "RATE" ? "#1E2124" : "#9D9D9D" }}>
                    정율
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discount Value */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            할인 값
          </div>
          <div className="flex flex-row items-center p-0 gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] gap-[8px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="ex) 1,000원 / 10%"
                className={`w-full h-full font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${discountValue ? "text-black" : "text-[#9D9D9D]"}`}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Max Discount Amount */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            최대 할인 금액
          </div>
          <div className="flex flex-row items-center p-0 gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] gap-[8px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="상품명을 입력해 주세요"
                className={`w-full h-full font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${maxDiscountAmount ? "text-black" : "text-[#9D9D9D]"}`}
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Min Purchase Amount */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="w-full h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            최소 구매 금액
          </div>
          <div className="flex flex-row items-center p-0 gap-[16px] w-full h-[49px]">
            <div className="box-border flex flex-row items-center pl-[16px] gap-[8px] w-full h-[49px] border border-[#D9D9D9] rounded-[8px]">
              <input
                type="text"
                placeholder="상품명을 입력해 주세요"
                className={`w-full h-full font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] border-none focus:outline-none bg-transparent ${minPurchaseAmount ? "text-black" : "text-[#9D9D9D]"}`}
                value={minPurchaseAmount}
                onChange={(e) => setMinPurchaseAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Coupon Period */}
        <div className="w-full relative mt-[10px]">
          <div className="w-[52px] h-[21px] font-['Pretendard'] font-normal text-sm leading-[150%] tracking-[-0.2px] text-black">
            쿠폰 기간
          </div>
          <div className="flex flex-row justify-between w-full h-[49px] mt-[10px]">
            <div className="box-border relative flex flex-row items-center justify-between p-0 w-[170px] h-[49px] border border-[#E8E8E8] rounded-[10px]">
              <input
                type="date"
                className={`w-full h-full font-['Pretendard'] font-normal text-sm leading-[160%] tracking-[-0.2px] border-none focus:outline-none bg-transparent pl-[16px] pr-[16px] ${startDate ? "text-black" : "text-[#9D9D9D]"}`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="box-border relative flex flex-row items-center justify-between p-0 w-[170px] h-[49px] border border-[#E8E8E8] rounded-[10px]">
              <input
                type="date"
                className={`w-full h-full font-['Pretendard'] font-normal text-sm leading-[160%] tracking-[-0.2px] border-none focus:outline-none bg-transparent pl-[16px] pr-[16px] ${expirationDate ? "text-black" : "text-[#9D9D9D]"}`}
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="absolute bottom-0 left-0 w-[390px] h-[96px] flex flex-col justify-center items-center px-[20px] py-[20px]">
        <button
          className="flex flex-col justify-center items-center p-[16px] w-full h-[56px] bg-[#FF2233] rounded-[12px]"
          onClick={handleSubmit}
        >
          <div className="flex flex-row justify-center items-center p-0 gap-[8px] w-[55px] h-[24px]">
            <div className="w-[55px] h-[24px] font-['Pretendard'] font-semibold text-base leading-[150%] text-center tracking-[-0.2px] text-white">
              등록하기
            </div>
          </div>
        </button>
      </div>

    </div>
  );
};

export default RegisterMobileView;
