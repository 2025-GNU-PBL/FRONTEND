import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
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
          <div className="h-[59px] flex items-center justify-between px-5">
            <button onClick={onBack} aria-label="back">
              <Icon icon="solar:alt-arrow-left-linear" className="w-6 h-6" />
            </button>
            <h1 className="text-[18px] font-semibold">쿠폰함</h1>
            <button onClick={() => nav("register-edit")} aria-label="add coupon">
              <Icon icon="solar:add-square-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 내용 영역 */}
        <div className="relative flex-1 overflow-y-auto">
          <div className="px-5 pt-5 pb-6">
            {/* 등록된 쿠폰 개수 */}
            <div className="flex items-center justify-between mb-4">
              {registeredCount > 0 && (
                <p className="text-[14px] text-[#000000]">
                  {loading ? "쿠폰 불러오는 중..." : `등록된 쿠폰 ${registeredCount}`}
                </p>
              )}
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
                  <EmptyState />
                ) : (
                  <div className="flex flex-col gap-4">
                    {coupons.map((coupon) => (
                      <CouponCard key={coupon.id} c={coupon} onRemove={handleRemove} />
                    ))}
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

/** ====== 컴포넌트 ====== */

interface CouponCardProps {
  c: OwnerCoupon;
  onRemove: (couponId: number) => void;
}

function CouponCard({ c, onRemove }: CouponCardProps) {
  const discountLabel =
    c.discountType === "PERCENT" ? `${c.discountValue}%` : `${c.discountValue}원`;
  const period = formatDateRange(c.startDate, c.expirationDate);

  return (
    <div className="w-full h-[129px] flex">
      {/* 좌측 본문 */}
      <div className="w-[278px] h-[129px] border border-r-0 border-[#F2F2F2] rounded-l-[16px] p-4 flex flex-col gap-2 bg-white">
        <div className="flex flex-col gap-1 w-[222px]">
          <div className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
            {c.couponName}
          </div>
          <div className="text-[20px] font-bold leading-[32px] tracking-[-0.2px] text-black">
            {discountLabel}
          </div>
        </div>
        <div className="flex flex-col w-[200px]">
          <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999] line-clamp-1">
            {c.couponDetail}
          </div>
          <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
            사용기간: {period}
          </div>
        </div>
      </div>

      {/* 우측 영역: 삭제 버튼 */}
      <div className="w-[72px] h-[129px] bg-[#F6F7FB] border border-l-0 border-[#F2F2F2] rounded-r-[16px] flex items-center justify-center px-[18px]">
        <button
          className="w-9 h-9 rounded-[20px] bg-white flex items-center justify-center active:scale-95"
          aria-label="delete-coupon"
          onClick={() => onRemove(c.id)}
        >
          <Icon icon="solar:close-square-broken" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Icon
          icon="material-symbols:credit-card-outline"
          className="w-[80px] h-[80px] opacity-50"
        />
        <p className="text-center font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-black">
          보유중인 쿠폰이 없어요
        </p>
      </div>
    </div>
  );
}
