import { useEffect, useMemo, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../../lib/api/axios";
import { toast } from "react-toastify"; // ✅ 추가
import "react-toastify/dist/ReactToastify.css"; // ✅ 추가

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

/** ====== 웹뷰 컴포넌트 (쿠폰함) ====== */

export default function WebView() {
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
      console.error("[CustomerCouponWebView] fetch error:", e);
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

      // ✅ 삭제 성공 토스트
      toast.success("쿠폰이 삭제되었습니다.");
    } catch (e) {
      console.error("[CustomerCouponWebView] delete error:", e);
      // ✅ 에러도 토스트로
      toast.error("쿠폰 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const registeredCount = coupons.length;

  /** 뷰 */
  return (
    <div className="w-full min-h-screen bg-[#F6F7FB] mt-15">
      {/* 본문 */}
      <div className="max-w-[1040px] mx-auto px-6 py-8">
        {/* 상단 타이틀/설명 및 등록 버튼 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">
              쿠폰함
            </h1>
            <p className="mt-1 text-[13px] text-[#6B7280] tracking-[-0.2px]">
              발급된 쿠폰을 한눈에 확인하고 관리할 수 있어요.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* 등록 버튼 */}
            <button
              type="button"
              onClick={() => nav("/my-page/owner/coupons/register")}
              className="inline-flex items-center gap-1.5 h-[38px] px-4 rounded-[12px] bg-[#FF2233] text-white text-[13px] font-semibold transition hover:opacity-90"
            >
              <Icon icon="solar:add-square-bold" className="w-5 h-5" />
              <span>등록하기</span>
            </button>

            <div className="flex items-center gap-2 text-[13px] text-[#4B5563]">
              <Icon icon="solar:ticket-broken" className="w-5 h-5" />
              <span>
                등록된 쿠폰{" "}
                <span className="font-semibold text-[#111827]">
                  {registeredCount}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 메인 카드 영역 */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          {/* 상단 헤더 라인 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[14px] text-[#6B7280]">
              총{" "}
              <span className="font-semibold text-[#111827]">
                {registeredCount}
              </span>{" "}
              개의 쿠폰이 등록되어 있습니다.
            </div>
          </div>

          {/* 상태 표시 */}
          {loading && (
            <div className="py-10 text-center text-[14px] text-[#9CA3AF]">
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
                <div className="py-12 text-center text-[14px] text-[#9CA3AF]">
                  등록된 쿠폰이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
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
                      <div
                        key={coupon.id}
                        className="flex w-full min-h-[112px] rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden"
                      >
                        {/* 왼쪽: 쿠폰 카드 */}
                        <div className="flex-1 flex flex-col justify-between bg-white px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] leading-[21px] text-[#111827] font-medium truncate">
                                {coupon.couponName ||
                                  `[${CATEGORY_LABEL[coupon.category]}] 쿠폰`}
                              </p>
                              <p className="mt-1 text-[20px] font-bold leading-[30px] text-[#111827]">
                                {discountText}
                              </p>
                            </div>

                            {/* 카테고리/상태 뱃지 */}
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8]">
                                {CATEGORY_LABEL[coupon.category] ?? "쿠폰"}
                              </span>
                              <span
                                className={[
                                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                                  coupon.status === "ACTIVE"
                                    ? "bg-[#ECFDF3] text-[#15803D]"
                                    : "bg-[#F3F4F6] text-[#6B7280]",
                                ].join(" ")}
                              >
                                {coupon.status === "ACTIVE"
                                  ? "사용 가능"
                                  : "비활성"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6B7280]">
                            <div className="flex items-center gap-1">
                              <Icon
                                icon="solar:bag-3-outline"
                                className="w-3.5 h-3.5 text-[#9CA3AF]"
                              />
                              <span>
                                {coupon.couponDetail || conditionText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon
                                icon="solar:calendar-linear"
                                className="w-3.5 h-3.5 text-[#9CA3AF]"
                              />
                              <span>사용기간 : {dateRange}</span>
                            </div>
                            {coupon.currentUsageCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Icon
                                  icon="solar:users-group-two-rounded-linear"
                                  className="w-3.5 h-3.5 text-[#9CA3AF]"
                                />
                                <span>
                                  사용{" "}
                                  {coupon.currentUsageCount.toLocaleString(
                                    "ko-KR"
                                  )}
                                  회
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 오른쪽: 삭제 버튼 영역 */}
                        <div className="flex items-center justify-center w-[88px] bg-[#F3F4F6] border-l border-[#E5E7EB]">
                          <button
                            type="button"
                            onClick={() => openDeleteModal(coupon)}
                            className="flex flex-col items-center gap-1 px-3 py-2 rounded-[14px] bg:white hover:bg-[#FEF2F2] border border-[#E5E7EB] active:scale-95 transition"
                          >
                            <Icon
                              icon="solar:trash-bin-trash-outline"
                              className="w-5 h-5 text-[#111827]"
                            />
                            <span className="text-[11px] text-[#4B5563]">
                              삭제
                            </span>
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

        {/* 하단 뒤로가기 버튼 */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 h-[40px] px-4 rounded-[12px] border border-[#E5E7EB] bg-white text-[13px] text-[#4B5563]"
          >
            <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
            마이페이지로 돌아가기
          </button>
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
