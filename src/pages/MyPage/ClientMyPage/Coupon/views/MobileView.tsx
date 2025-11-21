import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import api from "../../../../../lib/api/axios";
// TODO: 프로젝트 실제 api 인스턴스 경로에 맞게 수정

interface Coupon {
  userCouponId: number;
  status: "AVAILABLE" | "USED" | "EXPIRED" | "CANCELLED" | string;
  downloadedAt: string;
  usedAt: string | null;
  couponId: number;
  couponCode: string;
  couponName: string;
  couponDetail: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  startDate: string;
  expirationDate: string;
  category: string;
  canUse: boolean;
  daysUntilExpiration: number;
  productId: number | null;
  productName: string | null;
}

type CouponCategory = "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

const MobileView: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CouponCategory>("전체");

  // 뒤로가기
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // 히스토리 없을 때 대비 (원하면 여기서 라우팅 변경)
      window.location.href = "/";
    }
  };

  // 쿠폰 조회
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get<Coupon[]>("/api/v1/customer/coupon/my");
        setCoupons(res.data || []);
      } catch (err) {
        console.error("쿠폰 조회 실패", err);
      }
    };

    fetchCoupons();
  }, []);

  // 카테고리 필터링
  const filteredCoupons = useMemo(() => {
    if (selectedCategory === "전체") return coupons;
    // 백엔드 category 값이 "웨딩홀", "스튜디오" 등으로 온다고 가정
    return coupons.filter((coupon) => coupon.category === selectedCategory);
  }, [coupons, selectedCategory]);

  // 숫자 포맷
  const formatNumber = (value: number) => {
    if (value == null) return "";
    return new Intl.NumberFormat("ko-KR").format(value);
  };

  // 할인 표시
  const formatDiscount = (discountType: string, discountValue: number) => {
    if (!discountValue) return "0원";

    // 할인 타입 명세에 맞게 필요하면 수정
    if (discountType === "PERCENT" || discountType === "RATE") {
      return `${discountValue}%`;
    }

    return `${formatNumber(discountValue)}원`;
  };

  // 최소금액 조건
  const formatCondition = (minPurchaseAmount: number) => {
    if (!minPurchaseAmount || minPurchaseAmount <= 0) {
      return "최소 주문금액 제한 없음";
    }
    return `최소 ${formatNumber(minPurchaseAmount)}원 이상 구매 시`;
  };

  // 날짜 포맷: 2025-01-01 -> 2025.01.01
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return dateStr.replace(/-/g, ".");
  };

  return (
    <div className="min-h-screen flex justify-center bg-[#F5F5F5]">
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col">
        {/* 헤더 */}
        <header className="relative flex h-[60px] items-center justify-between px-5">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center"
            onClick={handleBack}
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="h-8 w-8 text-[#1E2124]"
            />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 text-center text-[18px] font-semibold text-[#1E2124]">
            쿠폰함
          </div>

          <div className="h-6 w-6" />
        </header>

        {/* 메인 */}
        <main className="flex-1 px-5 pt-5 pb-4 overflow-y-auto">
          <div className="w-full max-w-[350px] mx-auto flex flex-col gap-6">
            {/* 카테고리 탭 (정적 버튼 + 클릭 기능 추가) */}
            <div className="flex gap-2 h-[37px] flex-nowrap">
              {/* 전체 */}
              <button
                type="button"
                onClick={() => setSelectedCategory("전체")}
                className={`px-3 py-2 rounded-[20px] h-[37px] text-[14px] whitespace-nowrap border ${
                  selectedCategory === "전체"
                    ? "bg-[#000000] text-[#FEFFFF] border-[#000000]"
                    : "bg-[#FEFFFF] text-[#000000] border-[#D9D9D9]"
                }`}
              >
                전체
              </button>
              {/* 웨딩홀 */}
              <button
                type="button"
                onClick={() => setSelectedCategory("웨딩홀")}
                className={`px-3 py-2 rounded-[20px] h-[37px] text-[14px] whitespace-nowrap border ${
                  selectedCategory === "웨딩홀"
                    ? "bg-[#000000] text-[#FEFFFF] border-[#000000]"
                    : "bg-[#FEFFFF] text-[#000000] border-[#D9D9D9]"
                }`}
              >
                웨딩홀
              </button>
              {/* 스튜디오 */}
              <button
                type="button"
                onClick={() => setSelectedCategory("스튜디오")}
                className={`px-3 py-2 rounded-[20px] h-[37px] text-[14px] whitespace-nowrap border ${
                  selectedCategory === "스튜디오"
                    ? "bg-[#000000] text-[#FEFFFF] border-[#000000]"
                    : "bg-[#FEFFFF] text-[#000000] border-[#D9D9D9]"
                }`}
              >
                스튜디오
              </button>
              {/* 드레스 */}
              <button
                type="button"
                onClick={() => setSelectedCategory("드레스")}
                className={`px-3 py-2 rounded-[20px] h-[37px] text-[14px] whitespace-nowrap border ${
                  selectedCategory === "드레스"
                    ? "bg-[#000000] text-[#FEFFFF] border-[#000000]"
                    : "bg-[#FEFFFF] text-[#000000] border-[#D9D9D9]"
                }`}
              >
                드레스
              </button>
              {/* 메이크업 */}
              <button
                type="button"
                onClick={() => setSelectedCategory("메이크업")}
                className={`px-3 py-2 rounded-[20px] h-[37px] text-[14px] whitespace-nowrap border ${
                  selectedCategory === "메이크업"
                    ? "bg-[#000000] text-[#FEFFFF] border-[#000000]"
                    : "bg-[#FEFFFF] text-[#000000] border-[#D9D9D9]"
                }`}
              >
                메이크업
              </button>
            </div>

            {/* 상단 카운트 영역 */}
            <div className="flex items-center justify-between h-[21px]">
              <span className="text-[14px]">{`보유쿠폰 ${filteredCoupons.length}`}</span>
              <></>
            </div>

            {/* 쿠폰 리스트 */}
            <div className="flex flex-col gap-4 pb-4">
              {filteredCoupons.map((coupon) => {
                const isUsed = coupon.status === "USED";

                return (
                  <div
                    key={coupon.userCouponId}
                    className="flex flex-row items-center w-[350px] h-[129px]"
                  >
                    {/* 왼쪽 쿠폰 정보 영역 */}
                    <div className="flex flex-col items-start p-4 gap-[10px] w-[278px] h-[129px] border border-[#F2F2F2] border-r-0 rounded-l-[16px]">
                      <div className="flex flex-col items-start gap-1 w-[222px] h-[97px]">
                        <p className="text-[14px] text-[#000000]">
                          {coupon.couponName}
                        </p>

                        <p className="text-[20px] font-[700] text-[#000000]">
                          {formatDiscount(
                            coupon.discountType,
                            coupon.discountValue
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col items-start w-[169px] h-[36px]">
                        <p className="text-[12px] text-[#999999]">
                          {formatCondition(coupon.minPurchaseAmount)}
                        </p>
                        <p className="text-[12px] text-[#999999]">
                          {`${formatDate(coupon.startDate)} ~ ${formatDate(
                            coupon.expirationDate
                          )}`}
                        </p>
                      </div>
                    </div>

                    {/* 오른쪽 사용여부 영역 – 디자인만 변경 */}
                    <div className="flex flex-row items-center px-[18px] w-[72px] h-[129px] bg-[#F6F7FB] border border-[#F2F2F2] border-l-0 rounded-r-[16px]">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`flex items-center justify-center w-[36px] h-[36px] rounded-[20px] ${
                            isUsed ? "bg-[#F3F4F6]" : "bg-[#ECFDF3]"
                          }`}
                        >
                          <Icon
                            icon={
                              isUsed
                                ? "mdi:check-all"
                                : "mdi:check-circle-outline"
                            }
                            className={`w-4 h-4 ${
                              isUsed ? "text-[#6B7280]" : "text-[#16A34A]"
                            }`}
                          />
                        </div>
                        <span
                          className={`whitespace-nowrap text-[12px] font-medium ${
                            isUsed ? "text-[#6B7280]" : "text-[#16A34A]"
                          }`}
                        >
                          {isUsed ? "사용됨" : "사용 가능"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 쿠폰이 아예 없을 때는 리스트만 비어 있는 상태로 유지 */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MobileView;
