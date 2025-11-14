import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";

/** ====== DTO ====== */
type DiscountType = "AMOUNT" | "RATE";
type Category = "WEDDING" | "STUDIO" | "DRESS" | "MAKEUP" | "WEDDING_HALL";

type CouponUpdateRequest = {
  productId: number; // 없으면 0으로 처리 (카테고리 쿠폰)
  couponCode: string;
  couponName: string;
  couponDetail: string;
  discountType: DiscountType; // AMOUNT | RATE
  discountValue: number; // 정액(원) 또는 정률(%)
  maxDiscountAmount: number; // RATE일 때 상한
  minPurchaseAmount: number; // 최소 구매 금액
  category: Category;
  startDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
};

type CouponUpdateResponse = {
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
  status: "ACTIVE" | "INACTIVE";
};

/** ====== 유틸 ====== */
const CATEGORY_LABEL: Record<Category, string> = {
  WEDDING: "웨딩홀",
  WEDDING_HALL: "웨딩홀",
  STUDIO: "스튜디오",
  DRESS: "드레스",
  MAKEUP: "메이크업",
};

/** ====== 웹뷰 컴포넌트 (쿠폰 수정) ====== */
export default function RegisterWebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);
  const [searchParams] = useSearchParams();
  const { couponId: couponIdFromPath } = useParams<{ couponId: string }>();

  /** URL 쿼리에서 productId, category, couponId 가져오기 */
  const productIdFromUrl = searchParams.get("productId");
  const categoryFromUrl = searchParams.get("category") as Category | null;
  const couponIdFromQuery = searchParams.get("couponId");

  const couponId = useMemo(
    () => couponIdFromPath || couponIdFromQuery || "",
    [couponIdFromPath, couponIdFromQuery]
  );

  // 폼 상태
  const [couponCode, setCouponCode] = useState("");
  const [couponName, setCouponName] = useState("");
  const [couponDetail, setCouponDetail] = useState("");

  // category, productId 는 서버/URL 기준으로, UI에서는 읽기 전용 표시
  const [category, setCategory] = useState<Category>(
    categoryFromUrl ?? ("DRESS" as Category)
  );
  const [productId, setProductId] = useState<string>(productIdFromUrl ?? "0");

  const [discountType, setDiscountType] = useState<DiscountType>("AMOUNT");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>("");

  const [startDate, setStartDate] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // accessor (localStorage)
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

  /** 진입 시 기존 쿠폰 정보 조회 */
  useEffect(() => {
    if (!couponId) return;

    const fetchCoupon = async () => {
      try {
        setLoading(true);

        const config = {
          params: {
            accessor: accessorParam ?? {},
          },
        };

        const res = await api.get<CouponUpdateResponse>(
          `/api/v1/owner/coupon/${couponId}`,
          config
        );

        const c = res.data;
        setCouponCode(c.couponCode);
        setCouponName(c.couponName);
        setCouponDetail(c.couponDetail);
        setDiscountType(c.discountType);
        setDiscountValue(String(c.discountValue ?? ""));
        setMaxDiscountAmount(String(c.maxDiscountAmount ?? ""));
        setMinPurchaseAmount(String(c.minPurchaseAmount ?? ""));
        setCategory(c.category);
        setProductId(String(c.productId ?? 0));
        setStartDate(c.startDate);
        setExpirationDate(c.expirationDate);
      } catch (e) {
        console.error("[Coupon/RegisterWebView] fetch error:", e);
        alert("쿠폰 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupon();
  }, [couponId, accessorParam]);

  /** 유효성 검사 */
  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!couponName.trim()) next.couponName = "쿠폰 이름을 입력해 주세요.";
    if (!couponDetail.trim())
      next.couponDetail = "쿠폰 상세 설명을 입력해 주세요.";

    const dv = Number(discountValue);
    if (isNaN(dv)) next.discountValue = "숫자만 입력해 주세요.";
    else {
      if (discountType === "AMOUNT" && dv <= 0) {
        next.discountValue = "정액 할인은 0원 초과여야 합니다.";
      }
      if (discountType === "RATE") {
        if (dv <= 0 || dv > 100) {
          next.discountValue = "정률 할인은 1~100 사이여야 합니다.";
        }
        const mda = Number(maxDiscountAmount || "0");
        if (isNaN(mda) || mda <= 0) {
          next.maxDiscountAmount = "정률 할인 시 최대 할인 금액을 입력하세요.";
        }
      }
    }

    const minAmt = Number(minPurchaseAmount || "0");
    if (isNaN(minAmt) || minAmt < 0) {
      next.minPurchaseAmount = "최소 구매 금액은 0 이상이어야 합니다.";
    }

    const sd = new Date(startDate);
    const ed = new Date(expirationDate);
    if (!(sd instanceof Date) || isNaN(+sd))
      next.startDate = "시작일 형식이 올바르지 않습니다.";
    if (!(ed instanceof Date) || isNaN(+ed))
      next.expirationDate = "종료일 형식이 올바르지 않습니다.";
    if (!next.startDate && !next.expirationDate && sd > ed) {
      next.expirationDate = "종료일은 시작일 이후여야 합니다.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** 제출 (PATCH /api/v1/owner/coupon/{couponId}) */
  const onSubmit = async () => {
    if (submitting || loading) return;

    if (!couponId) {
      alert("쿠폰 ID가 없습니다. 다시 시도해 주세요.");
      return;
    }

    if (!validate()) return;

    const body: CouponUpdateRequest = {
      productId: Number(productId || "0") || 0,
      couponCode,
      couponName: couponName.trim(),
      couponDetail: couponDetail.trim(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: Number(maxDiscountAmount || "0"),
      minPurchaseAmount: Number(minPurchaseAmount || "0"),
      category,
      startDate,
      expirationDate,
    };

    try {
      setSubmitting(true);

      const config = {
        params: {
          accessor: accessorParam ?? {},
        },
      };

      const res = await api.patch<CouponUpdateResponse>(
        `/api/v1/owner/coupon/${couponId}`,
        body,
        config
      );

      console.log("[Coupon/RegisterWebView] patch result:", res.data);
      alert("쿠폰이 수정되었습니다.");
      nav(-1);
      return res.data;
    } catch (e: any) {
      console.error("[Coupon/RegisterWebView] update error:", e);
      alert("쿠폰 수정 중 오류가 발생했습니다. 입력값을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  /** 뷰 */
  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 상단 공통 헤더 영역 */}
      <div className="w-full bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1040px] mx-auto">
          <MyPageHeader title="쿠폰 수정" onBack={onBack} showMenu={false} />
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-[1040px] mt-20 mx-auto px-6 py-8">
        {/* 상단 타이틀/설명 */}
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">
            쿠폰 정보를 수정해 보세요
          </h1>
          <p className="mt-1 text-[13px] text-[#6B7280] tracking-[-0.2px]">
            특정 상품 또는 카테고리에 적용된 할인 쿠폰 내용을 변경할 수 있어요.
          </p>
        </div>

        {/* 메인 카드 영역 */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
          <div className="grid grid-cols-2 gap-8">
            {/* 왼쪽 컬럼: 기본 정보 */}
            <div>
              <Field label="쿠폰 코드">
                <input
                  className="w-full h-[44px] px-3 rounded-[10px] border border-[#E8E8E8] bg-[#F6F7FB] text-[14px] text-[#999999] outline-none"
                  value={couponCode}
                  disabled
                  readOnly
                />
              </Field>

              <Field label="쿠폰 이름" error={errors.couponName}>
                <input
                  className={inputCls()}
                  placeholder="쿠폰 이름을 입력해 주세요"
                  value={couponName}
                  onChange={(e) => setCouponName(e.target.value)}
                />
              </Field>

              <Field label="쿠폰 상세 설명" error={errors.couponDetail}>
                <input
                  className={inputCls()}
                  placeholder="설명을 입력해 주세요"
                  value={couponDetail}
                  onChange={(e) => setCouponDetail(e.target.value)}
                />
              </Field>

              {/* 할인 유형 */}
              <div className="mb-4">
                <div className="mb-2 text-[14px] font-medium text-[#1E2124]">
                  할인 유형
                </div>
                <div className="flex gap-2">
                  <Segment
                    active={discountType === "AMOUNT"}
                    onClick={() => setDiscountType("AMOUNT")}
                  >
                    정액
                  </Segment>
                  <Segment
                    active={discountType === "RATE"}
                    onClick={() => setDiscountType("RATE")}
                  >
                    정률
                  </Segment>
                </div>
              </div>

              <Field label="할인 값" error={errors.discountValue}>
                <input
                  className={inputCls()}
                  placeholder={
                    discountType === "RATE"
                      ? "ex) 10 (퍼센트)"
                      : "ex) 10000 (원)"
                  }
                  inputMode="numeric"
                  value={discountValue}
                  onChange={(e) =>
                    setDiscountValue(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </Field>
            </div>

            {/* 오른쪽 컬럼: 조건/기간/요약 */}
            <div>
              <Field
                label="최대 할인 금액"
                error={errors.maxDiscountAmount}
                hint={
                  discountType === "RATE"
                    ? "정률 쿠폰에 권장됩니다."
                    : undefined
                }
              >
                <input
                  className={inputCls()}
                  placeholder="ex) 10000"
                  inputMode="numeric"
                  value={maxDiscountAmount}
                  onChange={(e) =>
                    setMaxDiscountAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </Field>

              <Field label="최소 구매 금액" error={errors.minPurchaseAmount}>
                <input
                  className={inputCls()}
                  placeholder="ex) 30000"
                  inputMode="numeric"
                  value={minPurchaseAmount}
                  onChange={(e) =>
                    setMinPurchaseAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </Field>

              {/* 카테고리 (읽기 전용) */}
              <Field label="카테고리">
                <input
                  className="w-full h-[44px] px-3 rounded-[10px] border border-[#E8E8E8] bg-[#F6F7FB] text-[14px] text-[#555555] outline-none"
                  value={CATEGORY_LABEL[category] ?? category}
                  readOnly
                  disabled
                />
              </Field>

              {/* 쿠폰 기간 */}
              <div className="mb-2 text-[14px] font-medium text-[#1E2124]">
                쿠폰 기간
              </div>
              <div className="grid grid-cols-2 gap-3 mb-1">
                <DateInput
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="시작일"
                />
                <DateInput
                  value={expirationDate}
                  onChange={setExpirationDate}
                  placeholder="종료일"
                />
              </div>
              {(errors.startDate || errors.expirationDate) && (
                <p className="text-[12px] text-[#EB5147] mt-1">
                  {errors.startDate || errors.expirationDate}
                </p>
              )}

              {/* 우측 하단 요약 박스 */}
              <div className="mt-6 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-[13px] font-semibold text-[#111827] mb-2">
                  쿠폰 요약
                </p>
                <ul className="text-[12px] text-[#6B7280] space-y-1">
                  <li>
                    적용 카테고리:{" "}
                    <span className="font-medium text-[#111827]">
                      {CATEGORY_LABEL[category] ?? category}
                    </span>
                  </li>
                  <li>
                    할인 유형:{" "}
                    <span className="font-medium text-[#111827]">
                      {discountType === "AMOUNT" ? "정액 할인" : "정률 할인"}
                    </span>
                  </li>
                  {discountValue && (
                    <li>
                      할인 값:{" "}
                      <span className="font-medium text-[#111827]">
                        {discountType === "AMOUNT"
                          ? `${Number(discountValue).toLocaleString()}원`
                          : `${discountValue}%`}
                      </span>
                    </li>
                  )}
                  <li>
                    사용 기간:{" "}
                    <span className="font-medium text-[#111827]">
                      {startDate} ~ {expirationDate}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="h-[44px] px-5 rounded-[12px] border border-[#E5E7EB] bg-white text-[14px] text-[#4B5563] tracking-[-0.2px]"
              disabled={submitting || loading}
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || loading}
              className={[
                "h-[44px] px-6 rounded-[12px] text-white text-[14px] font-semibold tracking-[-0.2px]",
                submitting || loading
                  ? "bg-[#FF8891]"
                  : "bg-[#FF2233] active:scale-95",
              ].join(" ")}
            >
              {submitting || loading ? "수정 중..." : "쿠폰 수정하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ====== 공통 서브 컴포넌트 ====== */

function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[14px] font-medium text-[#1E2124]">{label}</div>
        {hint && (
          <div className="text-[12px] text-[#999999] leading-[18px]">
            {hint}
          </div>
        )}
      </div>
      {children}
      {error && (
        <p className="mt-1 text-[12px] leading-[18px] text-[#EB5147]">
          {error}
        </p>
      )}
    </div>
  );
}

function Segment({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-[40px] px-4 rounded-[12px] text-[14px]",
        "border",
        active
          ? "border-black bg-white font-semibold"
          : "border-[#E8E8E8] bg-white text-[#333333]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function DateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 h-[44px] px-3 rounded-[10px] border border-[#E8E8E8] bg-white">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 outline-none text-[14px] text-[#1E2124] bg-transparent"
        placeholder={placeholder}
      />
      <Icon icon="solar:calendar-linear" className="w-5 h-5 text-[#999999]" />
    </div>
  );
}

function inputCls() {
  return "w-full h-[44px] px-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none placeholder:text-[#C1C1C1]";
}
