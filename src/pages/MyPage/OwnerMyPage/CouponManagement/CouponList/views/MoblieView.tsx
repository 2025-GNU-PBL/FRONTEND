import { useEffect, useMemo, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../../lib/api/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

// 날짜 포맷
function formatDate(d: string): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

/** ====== Main Component ====== */

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav("/my-page/owner"), [nav]);

  const [coupons, setCoupons] = useState<OwnerCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<OwnerCoupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  /** 목록 조회 */
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const config = { params: { accessor: accessorParam ?? {} } };

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

  const openDeleteModal = (coupon: OwnerCoupon) => setDeleteTarget(coupon);

  const closeDeleteModal = () => {
    if (!isDeleting) setDeleteTarget(null);
  };

  /** ====== 쿠폰 삭제 ====== */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);

      const config = { params: { accessor: accessorParam ?? {} } };

      await api.delete(`/api/v1/owner/coupon/${deleteTarget.id}`, config);

      setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);

      toast.success("쿠폰이 삭제되었습니다.");
    } catch (e) {
      console.error("[delete] error:", e);
      toast.error("쿠폰 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const registeredCount = coupons.length;
  const isEmpty = !loading && !errorMsg && coupons.length === 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 border-b border-[#F2F2F2] bg-white">
        <div className="flex h-[59px] items-center justify-between px-5">
          <button onClick={onBack} aria-label="back">
            <Icon icon="solar:alt-arrow-left-linear" className="h-6 w-6" />
          </button>
          <h1 className="text-[18px] font-semibold">쿠폰함</h1>
          <button onClick={() => nav("register")} aria-label="add coupon">
            <Icon icon="majesticons:plus-line" className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 내용 */}
      {/* ✅ 빈 상태일 때 헤더 아래 영역을 flex로 중앙 정렬 */}
      <div
        className={`relative flex-1 overflow-y-auto ${isEmpty ? "flex" : ""}`}
      >
        {/* ✅ 내부 컨테이너: 빈 상태면 중앙 정렬 */}
        <div
          className={`w-full px-5 pt-5 pb-6 ${
            isEmpty ? "flex items-center justify-center" : ""
          }`}
        >
          {/* 상단 카운트는 쿠폰 있을 때만 표시 */}
          {!isEmpty && (
            <div className="mb-4 flex items-center justify-between">
              {registeredCount > 0 && (
                <p className="text-[14px] text-[#000000]">
                  {loading
                    ? "쿠폰 불러오는 중..."
                    : `등록된 쿠폰 ${registeredCount}`}
                </p>
              )}
            </div>
          )}

          {loading && !isEmpty && (
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
                // ✅ 빈 상태: 헤더 아래 영역 기준 정중앙
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

/** ====== Coupon Card ====== */

interface CouponCardProps {
  c: OwnerCoupon;
  onRemove: (coupon: OwnerCoupon) => void;
}

function CouponCard({ c: coupon, onRemove }: CouponCardProps) {
  const discountLabel =
    coupon.discountType === "RATE"
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue}원`;

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
    <div className="flex w-full">
      <div className="flex flex-1 flex-col gap-1 rounded-l-[16px] border border-r-0 border-[#F2F2F2] bg-white p-4">
        <div className="flex w-full flex-col gap-1">
          <div className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
            {coupon.couponName}
          </div>
          <div className="text-[20px] font-bold leading-[32px] tracking-[-0.2px] text-black">
            {discountLabel}
          </div>
        </div>
        <div className="flex w-full flex-col">
          <div className="line-clamp-1 text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
            {line1}
          </div>
          <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
            {line2}
          </div>
        </div>
      </div>

      <div className="flex w-[72px] items-center justify-center rounded-r-[16px] border border-l-0 border-[#F2F2F2] bg-[#F6F7FB] px-[18px]">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-[20px] bg-white active:scale-95"
          aria-label="delete-coupon"
          onClick={() => onRemove(coupon)}
        >
          <Icon icon="majesticons:close" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/** ====== Empty ====== */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center mb-20">
      <div className="w-20 h-20 mb-4 rounded-full bg-[#F6F7FB] flex items-center justify-center opacity-50">
        <img src="/images/coupon.png" alt="coupon" className="w-20 h-20" />
      </div>
      <p className="text-center text-[18px] font-semibold leading-[29px] tracking-[-0.2px] text-black">
        보유중인 쿠폰이 없어요
      </p>
    </div>
  );
}

/** ====== 삭제 모달 ====== */

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
        className="relative w-[335px] rounded-[14px] bg-white shadow-[4px_4px_10px_rgba(0,0,0,0.06)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-start gap-2 px-5 pb-0 pt-6">
          <div className="flex w-full flex-row items-start gap-[14px]">
            <p className="text-[16px] font-bold leading-[24px] tracking-[-0.2px] text-[#1E2124]">
              {title}
            </p>
          </div>
          <p className="w-full text-[14px] font-medium leading-[21px] tracking-[-0.2px] text-[#9D9D9D]">
            {description}
          </p>
        </div>

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
