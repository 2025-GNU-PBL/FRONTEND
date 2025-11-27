import { useEffect, useMemo, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../../lib/api/axios";

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

// ✅ 단일 날짜 포맷터 (yy.MM.dd 형식)
function formatDate(d: string): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

/** ====== 컴포넌트 ====== */

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [coupons, setCoupons] = useState<OwnerCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<OwnerCoupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  /** 삭제 모달 열기 */
  const openDeleteModal = (coupon: OwnerCoupon) => {
    setDeleteTarget(coupon);
  };

  /** 삭제 모달 닫기 */
  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  /** 쿠폰 삭제 실제 수행 */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);

      const config = {
        params: {
          accessor: accessorParam ?? {},
        },
      };

      await api.delete(`/api/v1/owner/coupon/${deleteTarget.id}`, config);

      setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error("[CustomerCouponMobile] delete error:", e);
      alert("쿠폰 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const registeredCount = coupons.length;

  return (
    // ✅ 전체 레이아웃: w-full, min-h-screen, flex-col
    <div className="w-full min-h-screen bg-white flex flex-col mb-15">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#F2F2F2]">
        <div className="h-[59px] flex items-center justify-between px-5">
          <button onClick={onBack} aria-label="back">
            <Icon icon="solar:alt-arrow-left-linear" className="w-6 h-6" />
          </button>
          <h1 className="text-[18px] font-semibold">쿠폰함</h1>
          <button onClick={() => nav("register")} aria-label="add coupon">
            <Icon icon="majesticons:plus-line" className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 내용 영역 */}
      <div className="relative flex-1 overflow-y-auto">
        {/* 내용은 가운데 정렬 + 양 옆 여백, 너비는 반응형 */}
        <div className="px-5 pt-5 pb-6 w-full max-w-xl mx-auto">
          {/* 등록된 쿠폰 개수 */}
          <div className="flex items-center justify-between mb-4">
            {registeredCount > 0 && (
              <p className="text-[14px] text-[#000000]">
                {loading
                  ? "쿠폰 불러오는 중..."
                  : `등록된 쿠폰 ${registeredCount}`}
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
                    <CouponCard
                      key={coupon.id}
                      c={coupon}
                      onRemove={openDeleteModal}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          title="쿠폰을 삭제하시겠어요?"
          description="삭제한 쿠폰은 다시 복구할 수 없어요."
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

/** ====== 쿠폰 카드 ====== */

interface CouponCardProps {
  c: OwnerCoupon;
  onRemove: (coupon: OwnerCoupon) => void;
}

function CouponCard({ c: coupon, onRemove }: CouponCardProps) {
  // ✅ RATE일 때 퍼센트, AMOUNT일 때 원
  const discountLabel =
    coupon.discountType === "RATE"
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue}원`;

  // ✅ 상세설명 영역을 조건 문구 + 기간으로 구성
  const line1 =
    coupon.minPurchaseAmount > 0
      ? `${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매 시${
          coupon.maxDiscountAmount > 0
            ? ` 최대 ${coupon.maxDiscountAmount.toLocaleString()}원`
            : ""
        }`
      : coupon.couponDetail;

  const line2 = `사용기간 : ${formatDate(coupon.startDate)} ~ ${formatDate(
    coupon.expirationDate
  )}`;

  return (
    // ✅ 카드도 전체 너비 사용
    <div className="w-full flex">
      {/* 좌측 본문: flex-1 로 남는 너비 모두 사용 */}
      <div className="flex-1 border border-r-0 border-[#F2F2F2] rounded-l-[16px] p-4 flex flex-col gap-1 bg-white">
        <div className="flex flex-col gap-1 w-full">
          <div className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
            {coupon.couponName}
          </div>
          <div className="text-[20px] font-bold leading-[32px] tracking-[-0.2px] text-black">
            {discountLabel}
          </div>
        </div>
        <div className="flex flex-col w-full">
          <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999] line-clamp-1">
            {line1}
          </div>
          <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
            {line2}
          </div>
        </div>
      </div>

      {/* 우측 영역: 삭제 버튼 (너비는 고정, 카드 전체는 w-full) */}
      <div className="w-[72px] bg-[#F6F7FB] border border-l-0 border-[#F2F2F2] rounded-r-[16px] flex items-center justify-center px-[18px]">
        <button
          className="w-9 h-9 rounded-[20px] bg-white flex items-center justify-center active:scale-95"
          aria-label="delete-coupon"
          onClick={() => onRemove(coupon)}
        >
          <Icon icon="majesticons:close" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/** ====== 빈 상태 ====== */

function EmptyState() {
  return (
    // ✅ 고정 높이 대신 padding 사용해서 반응형
    <div className="w-full flex items-center justify-center py-20">
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

/** ====== 삭제 확인 모달 ====== */

interface DeleteConfirmModalProps {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

function DeleteConfirmModal({
  title,
  description,
  onCancel,
  onConfirm,
  isLoading = false,
}: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="relative w-[335px] bg-white rounded-[14px] shadow-[4px_4px_10px_rgba(0,0,0,0.06)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 내용 영역 */}
        <div className="flex flex-col items-start gap-2 px-5 pt-6 pb-0">
          <div className="flex flex-row items-start gap-[14px] w-full">
            <p className="text-[16px] font-bold leading-[24px] tracking-[-0.2px] text-[#1E2124]">
              {title}
            </p>
          </div>
          <p className="w-full text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#9D9D9D]">
            {description}
          </p>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-4 flex flex-row items-center justify-between gap-2 px-5 pb-6 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex h-11 w-[142px] flex-row items-center justify-center rounded-[10px] bg-[#F3F4F5] disabled:opacity-70"
          >
            <span className="text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#999999]">
              취소
            </span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex h-11 w-[143px] flex-row items-center justify-center rounded-[10px] bg-[#FF2233] disabled:bg-[#FF2233]/60"
          >
            <span className="text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-white">
              {isLoading ? "삭제 중..." : "삭제"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
