import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";

/** ====== 타입 ====== */
type DiscountType = "AMOUNT" | "RATE";
type Category = "WEDDING" | "STUDIO" | "DRESS" | "MAKEUP" | "WEDDING_HALL";

type CouponStatus = "ACTIVE" | "INACTIVE";

interface OwnerCoupon {
  id: number;
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  expirationDate: string;
  couponName: string;
  couponDetail: string;
  category: Category;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  currentUsageCount: number;
  ownerId: number;
  productId: number;
  status: CouponStatus;
}

/** ====== 유틸 ====== */

const CATEGORY_LABEL: Record<Category, string> = {
  WEDDING: "웨딩홀",
  WEDDING_HALL: "웨딩홀",
  STUDIO: "스튜디오",
  DRESS: "드레스",
  MAKEUP: "메이크업",
};

function formatDiscountValue(type: DiscountType, value: number): string {
  if (!value || Number.isNaN(value)) return "-";
  if (type === "RATE") return `${value}%`;
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatConditionText(
  minPurchaseAmount: number,
  maxDiscountAmount: number,
  type: DiscountType
): string {
  const minText =
    minPurchaseAmount && minPurchaseAmount > 0
      ? `${(minPurchaseAmount / 10000).toLocaleString(
          "ko-KR"
        )}만원 이상 구매 시`
      : "구매 시";

  if (type === "RATE") {
    const maxText =
      maxDiscountAmount && maxDiscountAmount > 0
        ? ` 최대 ${(maxDiscountAmount / 10000).toLocaleString(
            "ko-KR"
          )}만원 할인`
        : " 할인";
    return `${minText}${maxText}`;
  }

  return `${minText} 할인`;
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  };

  const s = fmt(start);
  const e = fmt(end);
  if (!s && !e) return "-";
  return `${s}~${e}`;
}

/** ====== 컴포넌트 ====== */

export default function CustomerCouponMobile() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [coupons, setCoupons] = useState<OwnerCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /** accessor (localStorage) -> query object */
  const accessorParam = useMemo(() => {
    try {
      const raw = localStorage.getItem("accessor");
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, []);

  /** 쿠폰 목록 조회: GET /api/v1/owner/coupon */
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const config = {
        params: {
          accessor: accessorParam ?? {},
        },
      };

      const res = await api.get<OwnerCoupon[]>("/api/v1/owner/coupon", config);
      setCoupons(res.data || []);
    } catch (e) {
      console.error("[CustomerCouponMobile] fetch error:", e);
      setErrorMsg("쿠폰 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [accessorParam]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  /** 쿠폰 삭제 (있다면 DELETE /api/v1/owner/coupon/{id} 가정) */
  const handleRemove = async (couponId: number) => {
    if (!window.confirm("해당 쿠폰을 삭제하시겠어요?")) return;

    try {
      const config = {
        params: {
          accessor: accessorParam ?? {},
        },
      };

      // 백엔드에 따라 경로 수정 가능
      await api.delete(`/api/v1/owner/coupon/${couponId}`, config);

      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    } catch (e) {
      console.error("[CustomerCouponMobile] delete error:", e);
      alert("쿠폰 삭제 중 오류가 발생했습니다.");
    }
  };

  const registeredCount = coupons.length;

  return (
    <div className="w-full bg-white">
      {/* 390 × 844 프레임 (상단 노치/하단 인디케이터 X) */}
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white border-b border-[#F2F2F2]">
          <MyPageHeader title="쿠폰함" onBack={onBack} showMenu={false} />
        </div>

        {/* 내용 영역 */}
        <div className="relative flex-1 overflow-y-auto">
          <div className="px-5 pt-5 pb-6">
            {/* 등록된 쿠폰 개수 */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] text-[#000000]">
                등록된 쿠폰 {registeredCount}
              </p>
            </div>

            {/* 상태 표시 */}
            {loading && (
              <div className="py-10 text-center text-[14px] text-[#999999]">
                쿠폰 정보를 불러오는 중입니다...
              </div>
            )}

            {errorMsg && !loading && (
              <div className="py-10 text-center text-[14px] text-[#EB5147]">
                {errorMsg}
              </div>
            )}

            {!loading && !errorMsg && (
              <>
                {coupons.length === 0 ? (
                  <div className="py-10 text-center text-[14px] text-[#999999]">
                    등록된 쿠폰이 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {coupons.map((coupon) => {
                      const discountText = formatDiscountValue(
                        coupon.discountType,
                        coupon.discountValue
                      );
                      const conditionText = formatConditionText(
                        coupon.minPurchaseAmount,
                        coupon.maxDiscountAmount,
                        coupon.discountType
                      );
                      const dateRange = formatDateRange(
                        coupon.startDate,
                        coupon.expirationDate
                      );

                      return (
                        <div key={coupon.id} className="flex w-full h-[129px]">
                          {/* 왼쪽 쿠폰 내용 영역 */}
                          <div className="flex flex-col justify-between w-[278px] h-full border border-[#F2F2F2] border-r-0 rounded-l-[16px] bg-white px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <p className="text-[14px] leading-[21px] text-[#000000]">
                                {coupon.couponName ||
                                  `[${CATEGORY_LABEL[coupon.category]}] 쿠폰`}
                              </p>
                              <p className="text-[20px] font-bold leading-[32px] text-[#000000]">
                                {discountText}
                              </p>
                            </div>

                            <div className="flex flex-col gap-1 mt-1">
                              <p className="text-[12px] leading-[18px] text-[#999999]">
                                {coupon.couponDetail || conditionText}
                              </p>
                              <p className="text-[12px] leading-[18px] text-[#999999]">
                                사용기간 : {dateRange}
                              </p>
                            </div>
                          </div>

                          {/* 오른쪽 X 버튼 영역 */}
                          <div className="flex items-center justify-center w-[72px] h-full bg-[#F6F7FB] border border-[#F2F2F2] border-l-0 rounded-r-[16px]">
                            <button
                              type="button"
                              onClick={() => handleRemove(coupon.id)}
                              className="flex items-center justify-center w-9 h-9 rounded-[20px] bg-white active:scale-95"
                            >
                              <Icon
                                icon="solar:close-circle-linear"
                                className="w-5 h-5 text-[#000000]"
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
