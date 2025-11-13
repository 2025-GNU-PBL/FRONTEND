import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MyPageHeader from "../../../../../../components/MyPageHeader";
import api from "../../../../../../lib/api/axios";

/** ====== DTO ====== */
type DiscountType = "AMOUNT" | "RATE";
type Category = "WEDDING" | "STUDIO" | "DRESS" | "MAKEUP" | "WEDDING_HALL";

type CouponCreateRequest = {
  productId: number; // 없으면 0으로 처리 (카테고리 쿠폰)
  couponCode: string; // 자동 생성, 비활성화
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

type CouponCreateResponse = {
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
const today = () => new Date();
const addDays = (d: Date, days: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const generateCouponCode = (len = 16) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

const CATEGORY_LABEL: Record<Category, string> = {
  WEDDING: "웨딩홀",
  WEDDING_HALL: "웨딩홀",
  STUDIO: "스튜디오",
  DRESS: "드레스",
  MAKEUP: "메이크업",
};

/** ====== 컴포넌트 ====== */
export default function RegisterMobile() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);
  const [searchParams] = useSearchParams();

  /** ✅ URL 쿼리에서 productId, category 가져오기 */
  const productIdFromUrl = searchParams.get("productId");
  const categoryFromUrl = searchParams.get("category") as Category | null;

  // 폼 상태
  const [couponCode, setCouponCode] = useState(generateCouponCode());
  const [couponName, setCouponName] = useState("");
  const [couponDetail, setCouponDetail] = useState("");

  // 👉 이제 category, productId 는 URL 기준으로만 정해지고, 화면에서 수정 안 함
  const [category] = useState<Category>(
    categoryFromUrl ?? ("DRESS" as Category)
  );
  const [productId] = useState<string>(productIdFromUrl ?? "0");

  const [discountType, setDiscountType] = useState<DiscountType>("AMOUNT");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>("");

  const [startDate, setStartDate] = useState<string>(() => toYMD(today()));
  const [expirationDate, setExpirationDate] = useState<string>(() =>
    toYMD(addDays(today(), 30))
  );

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 화면 진입 시 코드 새로 생성(새 페이지마다)
  useEffect(() => {
    setCouponCode(generateCouponCode());
  }, []);

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

  /** 제출 */
  const onSubmit = async () => {
    if (submitting) return;
    if (!validate()) return;

    /** ✅ productId, category 를 URL 기반 값으로 body 에 넣어서 전송 */
    const body: CouponCreateRequest = {
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

      const res = await api.post<CouponCreateResponse>(
        "/api/v1/owner/coupon",
        body,
        config
      );

      alert("쿠폰이 등록되었습니다.");
      nav(-1);
      return res.data;
    } catch (e: any) {
      console.error("[Coupon/RegisterMobile] create error:", e);
      alert("쿠폰 등록 중 오류가 발생했습니다. 입력값을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  /** 뷰 */
  return (
    <div className="w-full bg-white">
      {/* 모바일 프레임 390×844 */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader title="쿠폰 등록" onBack={onBack} showMenu={false} />
        </div>

        {/* 스크롤 영역 */}
        <div className="relative flex-1 overflow-y-auto">
          <div className="px-5 pt-20 pb-28">
            {/* 쿠폰 코드 */}
            <Field label="쿠폰 코드">
              <input
                className="w-full h-[48px] px-3 rounded-[10px] border border-[#E8E8E8] bg-[#F6F7FB] text-[14px] text-[#999999] outline-none"
                value={couponCode}
                disabled
                readOnly
              />
            </Field>

            {/* 쿠폰 이름 */}
            <Field label="쿠폰 이름" error={errors.couponName}>
              <input
                className={inputCls()}
                placeholder="쿠폰 이름을 입력해 주세요"
                value={couponName}
                onChange={(e) => setCouponName(e.target.value)}
              />
            </Field>

            {/* 쿠폰 상세 설명 */}
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

            {/* 할인 값 */}
            <Field label="할인 값" error={errors.discountValue}>
              <input
                className={inputCls()}
                placeholder={
                  discountType === "RATE" ? "ex) 10 (퍼센트)" : "ex) 10000 (원)"
                }
                inputMode="numeric"
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </Field>

            {/* 최대 할인 금액 (정률일 때 권장/노출) */}
            <Field
              label="최대 할인 금액"
              error={errors.maxDiscountAmount}
              hint={
                discountType === "RATE" ? "정률 쿠폰에 권장됩니다." : undefined
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

            {/* 최소 구매 금액 */}
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

            {/* ✅ 카테고리(선택 UI 제거, 읽기 전용 표시만) */}
            <Field label="카테고리">
              <input
                className="w-full h-[48px] px-3 rounded-[10px] border border-[#E8E8E8] bg-[#F6F7FB] text-[14px] text-[#555555] outline-none"
                value={CATEGORY_LABEL[category] ?? category}
                readOnly
                disabled
              />
            </Field>

            {/* 쿠폰 기간 */}
            <div className="mb-2 text-[14px] font-medium text-[#1E2124]">
              쿠폰 기간
            </div>
            <div className="grid grid-cols-2 gap-2 mb-15">
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
          </div>

          {/* 하단 고정 등록 버튼 */}
          <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-[390px] bg-white px-5 pb-18 pt-3 border-t border-[#E8E8E8]">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className={[
                "w-full h-[52px] rounded-[12px] text-white text-[16px] font-semibold",
                submitting ? "bg-[#FF8891]" : "bg-[#FF2233] active:scale-95",
              ].join(" ")}
            >
              {submitting ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex items-center gap-2 h-[48px] px-3 rounded-[10px] border border-[#E8E8E8] bg-white">
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
  return "w-full h-[48px] px-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none placeholder:text-[#C1C1C1]";
}
