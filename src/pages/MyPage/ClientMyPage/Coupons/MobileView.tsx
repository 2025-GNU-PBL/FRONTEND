import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../../lib/api/axios";

type UserCoupon = {
  userCouponId: number;
  status: "AVAILABLE" | "USED" | "EXPIRED" | string;
  downloadedAt: string;
  usedAt: string | null;
  couponId: number;
  couponCode: string;
  couponName: string;
  discountType: "RATE" | "FIXED";
  discountValue: number;
  minPurchaseAmount: number;
  startDate: string;
  expirationDate: string;
  couponDetail: string;
  category: string;
};

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

        // 상품 없는 경우 - purchaseAmount만
        if (productList.length === 0) {
          const params: any = {
            ...(purchaseAmount !== undefined && { purchaseAmount }),
            accessor: {
              socialId: "",
              userRole: "CUSTOMER",
              customer: true,
              owner: true,
            },
          };

          const res = await api.get<Coupon[]>(
            "/api/v1/customer/coupon/my/applicable",
            { params }
          );

          setCoupons(res.data);
          return;
        }

        // 상품 각각에 대해 호출
        const responses = await Promise.all(
          productList.map((p) => {
            const params: any = {
              productId: p.productId,
              purchaseAmount:
                purchaseAmount !== undefined ? purchaseAmount : p.lineTotal,
            };

            return api.get<Coupon[]>(
              `/api/v1/owner/coupon/product/${p.productId}`,
              { params }
            );
          })
        );

        // 중복 제거 후 병합
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

  // UI 표기에 맞춰 category 변환
  const convertCategory = (key: string): string => {
    return categoryMap[key] ?? key;
  };

  // 할인율 또는 할인금액 포맷팅
  const formatRate = (coupon: Coupon) => {
    if (coupon.discountType === "RATE") {
      return `${coupon.discountValue}%`;
    }
    return `${coupon.discountValue.toLocaleString()}원`;
  };

  // 조건 텍스트 포맷팅
  const formatCondition = (coupon: Coupon) => {
    return `최소 ${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매 시`;
  };

  // 기간 텍스트 포맷팅
  const formatPeriod = (coupon: Coupon) => {
    return `${coupon.startDate} ~ ${coupon.expirationDate}`;
  };

  const filteredCoupons =
    activeCategory === "전체"
      ? coupons
      : coupons.filter((c) => convertCategory(c.category) === activeCategory);

  return (
    <div className="min-h-screen flex justify-center bg-[#F5F5F5]">
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col">
        <header className="relative flex h-[60px] items-center justify-between px-5">
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

          <div className="absolute left-1/2 -translate-x-1/2 text-center text-[18px] font-semibold text-[#1E2124]">
            쿠폰 선택
          </div>

          <div className="h-6 w-6" />
        </header>

        <main className="flex-1 px-5 pt-5 pb-4 overflow-y-auto">
          <div className="w-full max-w-[350px] mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between h-[21px]">
              <span className="text-[14px]">{`상품 쿠폰 ${coupons.length}`}</span>
              <span className="text-[14px] text-[#999999]">{`적용가능 ${coupons.length}`}</span>
            </div>

            <div className="flex gap-2 h-[37px] flex-nowrap">
              {["전체", "웨딩홀", "스튜디오", "드레스", "메이크업"].map(
                (label) => {
                  const key = label as CouponCategory;
                  const isActive = activeCategory === key;

                  const baseClass =
                    "px-3 py-2 rounded-[20px] h-[37px] text-[14px] whitespace-nowrap";
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

            {loading ? (
              <div className="text-[13px] text-[#999999]">
                쿠폰을 불러오는 중입니다...
              </div>
            ) : error ? (
              <div className="text-[13px] text-[#EF4444]">{error}</div>
            ) : filteredCoupons.length === 0 ? (
              <div className="text-[13px] text-[#999999]">
                적용 가능한 쿠폰이 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-4">
                {filteredCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex flex-row items-center w-[350px] h-[129px]"
                  >
                    <div className="flex flex-col items-start p-4 gap-[10px] w-[278px] h-[129px] border border-[#F2F2F2] border-r-0 rounded-l-[16px]">
                      <div className="flex flex-col items-start gap-1 w-[222px] h-[97px]">
                        <p className="text-[14px] text-[#000000]">
                          {coupon.couponName}
                        </p>

                        <p className="text-[20px] font-[700] text-[#000000]">
                          {formatRate(coupon)}
                        </p>
                      </div>

                      <div className="flex flex-col items-start w-[169px] h-[36px]">
                        <p className="text-[12px] text-[#999999]">
                          {formatCondition(coupon)}
                        </p>
                        <p className="text-[12px] text-[#999999]">
                          {formatPeriod(coupon)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row items-center px-[18px] w-[72px] h-[129px] bg-[#F6F7FB] border border-[#F2F2F2] border-l-0 rounded-r-[16px]">
                      <div className="flex items-center justify-center w-[36px] h-[36px] bg-[#FFFFFF] rounded-[20px]">
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
      </div>
    </div>
  );
};

export default MobileView;
