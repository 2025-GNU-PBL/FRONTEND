// src/pages/CheckoutPage/coupon/views/MobileView.tsx

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../../lib/api/axios";

type CouponCategory =
  | "전체"
  | "웨딩홀"
  | "스튜디오"
  | "드레스"
  | "메이크업"
  | string;

interface Coupon {
  id: number;
  title: string;
  rate: string;
  condition: string;
  period: string;
  category: CouponCategory;
}

interface ProductForCoupon {
  productId: number;
  productName: string;
  lineTotal: number;
  shopName: string | null;
}

interface CouponPageState {
  products?: ProductForCoupon[];
  purchaseAmount?: number;
}

const MobileView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CouponCategory>("전체");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { products, purchaseAmount } =
    (location.state as CouponPageState) || {};

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError(null);

        const productList = products ?? [];

        // 넘어온 상품이 없는 경우: purchaseAmount만으로 한 번 호출 (옵션)
        if (productList.length === 0) {
          const params: any = {
            ...(purchaseAmount !== undefined && { purchaseAmount }),
            accessor: {
              // TODO: 실제 로그인 유저 정보로 교체
              socialId: "",
              userRole: "CUSTOMER",
              customer: true,
              owner: true,
            },
          };

          const res = await api.get<Coupon[]>(
            "/api/v1/customer/coupon/my/applicable",
            {
              params,
            }
          );

          setCoupons(res.data);
          return;
        }

        // ✅ 모든 상품에 대해 반복 호출
        const responses = await Promise.all(
          productList.map((p) => {
            const params: any = {
              productId: p.productId,
              // 여기서는 전체 결제 금액 기준으로 보낼지, 각 상품 lineTotal 기준으로 보낼지 선택 가능
              // lineTotal 기준으로 보내고 싶으면 purchaseAmount 대신 p.lineTotal 사용
              purchaseAmount:
                purchaseAmount !== undefined ? purchaseAmount : p.lineTotal,
            };

            return api.get<Coupon[]>("/api/v1/customer/coupon/my/applicable", {
              params,
            });
          })
        );

        // 모든 결과를 합치고, id 기준으로 중복 제거
        const merged: Coupon[] = [];
        const seen = new Set<number>();

        responses.forEach((res) => {
          res.data.forEach((c) => {
            if (!seen.has(c.id)) {
              seen.add(c.id);
              merged.push(c);
            }
          });
        });

        setCoupons(merged);
      } catch (err) {
        console.error(err);
        setError("쿠폰 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [products, purchaseAmount]);

  const filteredCoupons =
    activeCategory === "전체"
      ? coupons
      : coupons.filter((c) => c.category === activeCategory);

  return (
    <div className="min-h-screen flex justify-center bg-[#F5F5F5]">
      {/* 390 x 844 프레임 */}
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col">
        {/* 상단 앱바 - 결제하기 페이지와 동일한 헤더 스타일 */}
        <header className="relative flex h-[60px] items-center justify-between px-5">
          {/* 뒤로가기 버튼 */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-6 w-6 items-center justify-center"
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="h-6 w-6 text-[#1E2124]"
            />
          </button>

          {/* 제목 */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
            쿠폰 선택
          </div>

          {/* 우측 아이콘 자리 맞춤용 빈 영역 */}
          <div className="h-6 w-6" />
        </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 px-5 pt-5 pb-4 overflow-y-auto">
          <div className="w-full max-w-[350px] mx-auto flex flex-col gap-6">
            {/* 상단 텍스트: 상품 쿠폰 / 적용가능 */}
            <div className="flex items-center justify-between h-[21px]">
              <span className="font-[400] text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000]">
                상품 쿠폰 {coupons.length}
              </span>
              <span className="font-[400] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                적용가능 {coupons.length}
              </span>
            </div>

            {/* 카테고리 필터칩 - 글자수만큼 버튼 넓이 조정, 한 줄 */}
            <div className="flex gap-2 h-[37px] flex-nowrap">
              {["전체", "웨딩홀", "스튜디오", "드레스", "메이크업"].map(
                (label) => {
                  const key = label as CouponCategory;
                  const isActive = activeCategory === key;

                  const baseClass =
                    "px-3 py-2 rounded-[20px] h-[37px] text-[14px] leading-[21px] tracking-[-0.2px] whitespace-nowrap";
                  const activeClass =
                    "bg-[#000000] text-[#FEFFFF] border border-[#000000]";
                  const inactiveClass =
                    "bg-[#FEFFFF] text-[#000000] border border-[#D9D9D9]";

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`${baseClass} ${
                        isActive ? activeClass : inactiveClass
                      }`}
                      onClick={() => setActiveCategory(key)}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>

            {/* 로딩 / 에러 / 쿠폰 리스트 */}
            {loading ? (
              <div className="flex flex-col gap-4 pb-4">
                <div className="text-[13px] text-[#999999]">
                  쿠폰을 불러오는 중입니다...
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col gap-4 pb-4">
                <div className="text-[13px] text-[#EF4444]">{error}</div>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="flex flex-col gap-4 pb-4">
                <div className="text-[13px] text-[#999999]">
                  적용 가능한 쿠폰이 없습니다.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-4">
                {filteredCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex flex-row items-center w-[350px] h-[129px]"
                  >
                    {/* 왼쪽 쿠폰 본문 */}
                    <div className="flex flex-col items-start p-4 gap-[10px] w-[278px] h-[129px] border border-[#F2F2F2] border-r-0 rounded-l-[16px]">
                      {/* 상단 타이틀 + 할인율 */}
                      <div className="flex flex-col items-start gap-1 w-[222px] h-[97px]">
                        <p className="w-[222px] h-[21px] font-[400] text-[14px] leading-[21px] tracking-[-0.2px] text-[#000000]">
                          {coupon.title}
                        </p>
                        <p className="w-[222px] h-[32px] font-[700] text-[20px] leading-[32px] tracking-[-0.2px] text-[#000000]">
                          {coupon.rate}
                        </p>
                      </div>

                      {/* 하단 조건/기간 */}
                      <div className="flex flex-col items-start w-[169px] h-[36px]">
                        <p className="w-[169px] h-[18px] font-[400] text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                          {coupon.condition}
                        </p>
                        <p className="w-[169px] h-[18px] font-[400] text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                          {coupon.period}
                        </p>
                      </div>
                    </div>

                    {/* 오른쪽 적용 화살표 영역 */}
                    <div className="flex flex-row items-center px-[18px] gap-[10px] w-[72px] h-[129px] bg-[#F6F7FB] border border-[#F2F2F2] border-l-0 rounded-r-[16px]">
                      {/* 동그란 버튼 */}
                      <div className="flex flex-row items-center justify-center p-[10px] gap-[10px] w-[36px] h-[36px] bg-[#FFFFFF] rounded-[20px]">
                        <Icon
                          icon="streamline:arrow-down-2"
                          className="w-4 h-4 text-[#000000]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* 하단 적용 버튼 영역 */}
        <div className="px-5 pb-5 pt-1">
          <div className="w-full max-w-[350px] mx-auto">
            <button
              type="button"
              className="w-full h-[56px] rounded-[12px] bg-[#FF2233] flex items-center justify-center"
            >
              <span className="font-[600] text-[16px] leading-[24px] tracking-[-0.2px] text-white">
                0원 적용하기
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
