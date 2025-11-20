import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../lib/api/axios";

type UserCoupon = {
  userCouponId: number;
  status: "AVAILABLE" | "USED" | "EXPIRED" | string;
  downloadedAt: string;
  usedAt: string | null;
  couponId: number;
  couponCode: string;
  couponName: string;
  couponDetail: string;
  discountType: string; // PERCENT, AMOUNT 등
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  startDate: string; // "2025-11-07"
  expirationDate: string;
  category: string; // "웨딩홀" | "스튜디오" | ...
  canUse: boolean;
  daysUntilExpiration: number;
  productId: number | null;
  productName: string | null;
};

type CategoryFilter = "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [category, setCategory] = useState<CategoryFilter>("전체");
  const [sortOpen, setSortOpen] = useState(false);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(false);

  // 정렬 드롭다운 외부 클릭 감지
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchMyCoupons = async () => {
      try {
        setLoading(true);

        const res = await api.get<UserCoupon[]>(
          "/api/v1/customer/coupon/my/available"
        );

        setCoupons(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCoupons();
  }, []);

  const handleDownload = useCallback(async (couponId: number) => {
    try {
      const res = await api.post<UserCoupon>(
        `/api/v1/customer/coupon/${couponId}/download`
      );

      setCoupons((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 카테고리 + 정렬 적용
  const filtered = useMemo(() => {
    const list = coupons.filter((c) =>
      category === "전체" ? true : c.category === category
    );

    return list;
  }, [coupons, category]);

  return (
    <div className="w-full bg-white">
      {/* 화면 프레임(390×844) */}
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="h-[59px] flex items-center justify-between px-5">
            <button onClick={onBack} aria-label="back">
              <Icon icon="solar:alt-arrow-left-linear" className="w-6 h-6" />
            </button>
            <h1 className="text-[18px] font-semibold">쿠폰함</h1>
            <button onClick={() => {}} aria-label="add coupon">
              <Icon icon="solar:add-square-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 px-5 pt-20 pb-20 overflow-auto">
          {/* 카테고리 칩 */}
          <div className="w-full flex items-center gap-2">
            <Chip
              label="전체"
              className="w-[48px]"
              onClick={() => setCategory("전체")}
              isActive={category === "전체"}
            />
            <Chip
              label="웨딩홀"
              className="w-[60px]"
              onClick={() => setCategory("웨딩홀")}
              isActive={category === "웨딩홀"}
            />
            <Chip
              label="스튜디오"
              className="w-[72px]"
              onClick={() => setCategory("스튜디오")}
              isActive={category === "스튜디오"}
            />
            <Chip
              label="드레스"
              className="w-[60px]"
              onClick={() => setCategory("드레스")}
              isActive={category === "드레스"}
            />
            <Chip
              label="메이크업"
              className="w-[72px]"
              onClick={() => setCategory("메이크업")}
              isActive={category === "메이크업"}
            />
          </div>

          {/* 보유개수 */}
          <div className="mt-4 w-full flex items-center justify-between relative">
            <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
              {loading ? "쿠폰 불러오는 중..." : `등록된 쿠폰 ${filtered.length}`}
            </span>
          </div>

          {/* 리스트 */}
          <div className="mt-4 flex flex-col gap-4">
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-[14px] text-[#999999]">
                쿠폰 정보를 불러오는 중입니다...
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((c) => (
                <CouponCard
                  key={c.userCouponId}
                  c={c}
                  
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-3 text-[14px] leading-[21px] tracking-[-0.2px]",
        active ? "bg-gray-100 font-semibold" : "hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Chip({
  label,
  onClick,
  isActive,
  className = "",
}: {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center h-[37px] px-4 rounded-[20px]",
        "text-[14px] leading-[21px] tracking-[-0.2px] whitespace-nowrap text-center",
        isActive
          ? "bg-black text-white"
          : "bg-[#FEFFFF] text-black border border-[#D9D9D9]",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function CouponCard({
  c,
}: {
  c: UserCoupon;
}) {
  const period = `사용기간 : ${c.startDate} ~ ${c.expirationDate}`;
  const discountLabel =
    c.discountType === "PERCENT"
      ? `${c.discountValue}%`
      : `${c.discountValue.toLocaleString()}원`;

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
            {period}
          </div>
        </div>
      </div>

      {/* 우측 영역: 재발급/사용 버튼 */}
      <div className="w-[72px] h-[129px] bg-[#F6F7FB] border border-l-0 border-[#F2F2F2] rounded-r-[16px] flex items-center justify-center px-[18px]">
        <button
          className="w-9 h-9 rounded-[20px] bg-white flex items-center justify-center active:scale-95 disabled:opacity-40"
          aria-label="delete-coupon"
          onClick={() => console.log("delete coupon", c.userCouponId)}
          
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
