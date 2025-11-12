// src/pages/Owner/Coupon/Register/WebView.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../../lib/api/axios";

/** ====== 타입 / DTO ====== */
type DiscountType = "AMOUNT" | "RATE";
type Category = "WEDDING" | "STUDIO" | "DRESS" | "MAKEUP";

type CouponCreateRequest = {
  productId: number; // 없으면 0 (카테고리 쿠폰)
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

/** ====== 웹뷰 컴포넌트 (예약 WebView 디자인 가이드 반영) ====== */
export default function RegisterWebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  // 폼 상태
  const [couponCode, setCouponCode] = useState(generateCouponCode());
  const [couponName, setCouponName] = useState("");
  const [couponDetail, setCouponDetail] = useState("");
  const [category, setCategory] = useState<Category>("DRESS");
  const [discountType, setDiscountType] = useState<DiscountType>("AMOUNT");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>("");
  const [productId, setProductId] = useState<string>("0");

  const [startDate, setStartDate] = useState<string>(() => toYMD(today()));
  const [expirationDate, setExpirationDate] = useState<string>(() =>
    toYMD(addDays(today(), 30))
  );

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 페이지 진입 시 쿠폰 코드 리프레시
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
      const res = await api.post<CouponCreateResponse>(
        "/api/v1/owner/coupon",
        body,
        accessorParam ? { params: { accessor: accessorParam } } : undefined
      );
      alert("쿠폰이 등록되었습니다.");
      nav(-1);
      return res.data;
    } catch (e) {
      console.error("[Coupon/RegisterWebView] create error:", e);
      alert("쿠폰 등록 중 오류가 발생했습니다. 입력값을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  /** ====== 뷰  ====== */
  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 콘텐츠 영역 */}
      <main className="max-w-[1200px] mx-auto px-6 pt-22 pb-10">
        {/* 상단 타이틀 바 (좌측 제목/건수 영역 톤 들고 오되, 여기선 설명으로 대체) */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-semibold text-black">
              쿠폰 정보 입력
            </span>
            <span className="text-[13px] text-[#999999]">
              필수 항목을 모두 입력해 주세요
            </span>
          </div>
        </div>

        {/* 폼 카드 */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E5E6EB]">
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F5]">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:document-linear"
                className="w-5 h-5 text-[#9CA3AF]"
              />
              <span className="text-[15px] font-semibold text-[#111827]">
                기본 정보
              </span>
            </div>
            <span className="text-[12px] text-[#9CA3AF]">* 은 필수</span>
          </div>

          {/* 폼 바디: 2열 그리드 */}
          <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 쿠폰 코드 (비활성) */}
            <FieldWeb label="쿠폰 코드">
              <input
                className={inputClsDisabled()}
                value={couponCode}
                disabled
                readOnly
              />
            </FieldWeb>

            {/* 카테고리 */}
            <FieldWeb label="카테고리 *">
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={category === "WEDDING"}
                  onClick={() => setCategory("WEDDING")}
                >
                  웨딩홀
                </Chip>
                <Chip
                  active={category === "STUDIO"}
                  onClick={() => setCategory("STUDIO")}
                >
                  스튜디오
                </Chip>
                <Chip
                  active={category === "DRESS"}
                  onClick={() => setCategory("DRESS")}
                >
                  드레스
                </Chip>
                <Chip
                  active={category === "MAKEUP"}
                  onClick={() => setCategory("MAKEUP")}
                >
                  메이크업
                </Chip>
              </div>
            </FieldWeb>

            {/* 쿠폰 이름 */}
            <FieldWeb label="쿠폰 이름 *" error={errors.couponName}>
              <input
                className={inputCls()}
                placeholder="예) 11월 신규회원 1만 원 할인"
                value={couponName}
                onChange={(e) => setCouponName(e.target.value)}
              />
            </FieldWeb>

            {/* 쿠폰 상세 설명 */}
            <FieldWeb label="쿠폰 상세 설명 *" error={errors.couponDetail}>
              <input
                className={inputCls()}
                placeholder="예) 드레스 대여 시 사용 가능"
                value={couponDetail}
                onChange={(e) => setCouponDetail(e.target.value)}
              />
            </FieldWeb>

            {/* 할인 유형 */}
            <FieldWeb label="할인 유형 *">
              <div className="flex gap-2">
                <Chip
                  active={discountType === "AMOUNT"}
                  onClick={() => setDiscountType("AMOUNT")}
                >
                  정액
                </Chip>
                <Chip
                  active={discountType === "RATE"}
                  onClick={() => setDiscountType("RATE")}
                >
                  정률
                </Chip>
              </div>
            </FieldWeb>

            {/* 할인 값 */}
            <FieldWeb label="할인 값 *" error={errors.discountValue}>
              <div className="flex items-center gap-2">
                <input
                  className={inputCls()}
                  placeholder={
                    discountType === "RATE"
                      ? "예) 10 (% 단위)"
                      : "예) 10000 (원 단위)"
                  }
                  inputMode="numeric"
                  value={discountValue}
                  onChange={(e) =>
                    setDiscountValue(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </div>
            </FieldWeb>

            {/* 최대 할인 금액 (정률 시 권장) */}
            <FieldWeb
              label="최대 할인 금액"
              hint={
                discountType === "RATE" ? "정률 쿠폰에 권장됩니다." : undefined
              }
              error={errors.maxDiscountAmount}
            >
              <input
                className={inputCls()}
                placeholder="예) 10000"
                inputMode="numeric"
                value={maxDiscountAmount}
                onChange={(e) =>
                  setMaxDiscountAmount(e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </FieldWeb>

            {/* 최소 구매 금액 */}
            <FieldWeb label="최소 구매 금액" error={errors.minPurchaseAmount}>
              <input
                className={inputCls()}
                placeholder="예) 30000"
                inputMode="numeric"
                value={minPurchaseAmount}
                onChange={(e) =>
                  setMinPurchaseAmount(e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </FieldWeb>

            {/* 쿠폰 기간 */}
            <FieldWeb
              label="쿠폰 기간 *"
              error={errors.startDate || errors.expirationDate}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </FieldWeb>
          </div>

          {/* 섹션 푸터: 우측 정렬 버튼 (예약 WebView의 툴바 톤) */}
          <div className="px-6 py-4 border-t border-[#F3F4F5] flex items-center justify-end">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className={[
                "inline-flex items-center gap-2 px-5 h-[44px] rounded-[12px] text-white text-[14px] font-semibold",
                submitting
                  ? "bg-[#FF8891] cursor-not-allowed"
                  : "bg-[#FF2233] hover:opacity-90 active:scale-95",
              ].join(" ")}
            >
              <Icon
                icon="solar:checklist-minimalistic-linear"
                className="w-5 h-5"
              />
              {submitting ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

/** ====== 공통 서브 컴포넌트 (웹 디자인 컴포넌트화) ====== */

function FieldWeb({
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-medium text-[#1E2124]">{label}</div>
        {hint && (
          <div className="text-[12px] text-[#999999] leading-[18px]">
            {hint}
          </div>
        )}
      </div>
      {children}
      {error && (
        <p className="text-[12px] leading-[18px] text-[#EB5147]">{error}</p>
      )}
    </div>
  );
}

function Chip({
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
        "h-[36px] px-4 rounded-[999px] text-[14px] transition border",
        active
          ? "border-black bg-white font-semibold"
          : "border-[#E5E6EB] bg-white text-[#333333] hover:bg-[#F9FAFB]",
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
    <div className="flex items-center gap-2 h-[44px] px-3 rounded-[10px] border border-[#E5E6EB] bg-white">
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
  return "w-full h-[44px] px-3 rounded-[10px] border border-[#E5E6EB] bg-white text-[14px] outline-none placeholder:text-[#C1C1C1]";
}
function inputClsDisabled() {
  return "w-full h-[44px] px-3 rounded-[10px] border border-[#E5E6EB] bg-[#F6F7FB] text-[14px] text-[#999999] outline-none";
}
