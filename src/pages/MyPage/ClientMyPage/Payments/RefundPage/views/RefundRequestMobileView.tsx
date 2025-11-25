// src/pages/Customer/Payments/RefundRequestMobileView.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MyPageHeader from "../../../../../../components/MyPageHeader";
import api from "../../../../../../lib/api/axios";

type RefundRequestPageState = {
  paymentKey: string;
  shopName: string;
  productName: string;
  amount: number;
  couponDiscount?: number;
  expectedRefundAmount?: number;
  payMethodLabel?: string;
  thumbnailUrl?: string;
};

type ReasonType = "CHANGE_MIND" | "DESC_MISMATCH" | "OUT_OF_STOCK" | "OTHER";

export default function RefundRequestMobileView() {
  const nav = useNavigate();
  const location = useLocation();
  const params = useParams<{ paymentKey?: string }>();

  const state = location.state as RefundRequestPageState | undefined;

  const paymentKey = state?.paymentKey ?? params.paymentKey ?? "";
  const productAmount = state?.amount ?? 0;
  const couponDiscount = state?.couponDiscount ?? 0;
  const expectedRefundAmount =
    state?.expectedRefundAmount ?? productAmount - couponDiscount;
  const payMethodLabel =
    state?.payMethodLabel ?? "토스 페이먼츠 / 결제 금액 전액 환불";

  const [selectedReason, setSelectedReason] = useState<ReasonType>("OTHER");
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finalReason = useMemo(() => {
    switch (selectedReason) {
      case "CHANGE_MIND":
        return "상품이 마음에 들지 않음";
      case "DESC_MISMATCH":
        return "상품이 설명과 다름";
      case "OUT_OF_STOCK":
        return "판매자로부터 품절 안내 받음";
      case "OTHER":
      default:
        return reasonText.trim();
    }
  }, [selectedReason, reasonText]);

  const isValid =
    !!paymentKey &&
    !!finalReason &&
    finalReason.length > 0 &&
    finalReason.length <= 200;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    try {
      setSubmitting(true);

      await api.post("/api/v1/payments/cancel-request", {
        paymentKey,
        cancelReason: finalReason,
      });

      window.alert("환불(결제 취소) 요청이 접수되었습니다.");
      nav(-1);
    } catch (e) {
      console.error("[RefundRequestMobileView] cancel-request error:", e);
      window.alert("환불 요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (n: number) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F5F6F8]">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-white">
        <MyPageHeader
          title="환불 요청"
          onBack={() => nav(-1)}
          showMenu={false}
        />
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-20 w-full mx-auto max-w-screen-sm">
        {/* 상품 정보 카드 */}
        <section className="mb-6">
          <div className="relative w-full rounded-[12px] border border-[#F3F4F5] bg-white p-4">
            <div className="text-[16px] font-semibold text-[#1E2124] mb-4">
              상품정보
            </div>

            <div className="flex gap-4">
              {/* 썸네일 */}
              <div className="h-[80px] w-[80px] rounded-[4px] overflow-hidden border bg-[#F5F5F5]">
                {state?.thumbnailUrl && (
                  <img
                    src={state.thumbnailUrl}
                    alt={state.productName}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <p className="text-[14px] text-[rgba(0,0,0,0.4)]">
                    {state?.shopName ?? "-"}
                  </p>
                  <p className="text-[14px] text-[#1E2124] line-clamp-2">
                    {state?.productName ?? "-"}
                  </p>
                </div>

                <div className="text-[16px] font-semibold text-[#1E2124]">
                  {formatMoney(productAmount)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 환불 사유 선택 */}
        <section className="mb-3">
          <h2 className="text-[18px] font-semibold text-[#1E2124]">
            환불 사유 선택
          </h2>
        </section>

        <section className="mb-6 w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-5">
          {/* 단순 변심 */}
          <div className="mb-4 flex flex-col gap-3">
            <p className="text-[12px] text-[#999999]">단순 변심</p>
            <ReasonRadio
              label="상품이 마음에 들지 않음"
              selected={selectedReason === "CHANGE_MIND"}
              onSelect={() => setSelectedReason("CHANGE_MIND")}
            />
          </div>

          <div className="mb-4 h-px bg-[#EEEEEE]" />

          {/* 상품 문제 */}
          <div className="mb-4 flex flex-col gap-3">
            <p className="text-[12px] text-[#999999]">상품 문제</p>

            <ReasonRadio
              label="상품이 설명과 다름"
              selected={selectedReason === "DESC_MISMATCH"}
              onSelect={() => setSelectedReason("DESC_MISMATCH")}
            />
            <ReasonRadio
              label="판매자로부터 품절 안내 받음"
              selected={selectedReason === "OUT_OF_STOCK"}
              onSelect={() => setSelectedReason("OUT_OF_STOCK")}
            />
          </div>

          <div className="mb-4 h-px bg-[#EEEEEE]" />

          {/* 기타 */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#999999]">기타</p>

            <ReasonRadio
              label="사유를 입력해주세요"
              selected={selectedReason === "OTHER"}
              onSelect={() => setSelectedReason("OTHER")}
              highlight
            />

            {/* 기타 입력 */}
            <div className="relative mt-1">
              <textarea
                className={[
                  "w-full h-[185px] rounded-[8px] border px-4 py-3 text-[14px] resize-none outline-none",
                  selectedReason === "OTHER"
                    ? "border-[rgba(0,0,0,0.1)] bg-white focus:border-[#FF2233] focus:ring-1 focus:ring-[#FF2233]"
                    : "border-[rgba(0,0,0,0.06)] bg-[#F9FAFB] text-[rgba(0,0,0,0.35)]",
                ].join(" ")}
                placeholder="문의 내용을 입력해주세요"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value.slice(0, 200))}
                disabled={selectedReason !== "OTHER"}
              />
              <div className="pointer-events-none absolute bottom-2 right-3 text-[12px] text-[rgba(173,179,182,0.8)]">
                {reasonText.length} / 200자
              </div>
            </div>
          </div>
        </section>

        {/* 환불 정보 */}
        <section className="mb-3">
          <h2 className="text-[18px] font-semibold text-[#1E2124]">
            환불 정보를 확인해주세요
          </h2>
        </section>

        <section className="mb-6 w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* 상단 */}
            <div className="flex flex-col gap-3">
              <p className="text-[16px] font-semibold text-[#1E2124]">
                환불안내
              </p>

              <div className="flex flex-col gap-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#1E2124]">상품 금액</span>
                  <span className="text-[#1E2124]">
                    {formatMoney(productAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#1E2124]">쿠폰 할인</span>
                  <span className="text-[#1E2124]">
                    {couponDiscount ? `-${formatMoney(couponDiscount)}` : "0원"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#EEEEEE]" />
            </div>

            {/* 하단 */}
            <div className="flex flex-col gap-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#1E2124]">
                  환불 예상 금액
                </span>
                <span className="text-[14px] font-semibold text-[#1E2124]">
                  {formatMoney(expectedRefundAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#1E2124]">환불 수단</span>
                <span className="text-right text-[#999999]">
                  {payMethodLabel}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 신청 버튼 */}
        <section className="mt-4 mb-15 w-full">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={[
              "flex h-[56px] w-full items-center justify-center rounded-[12px]",
              "text-[16px] font-semibold",
              isValid && !submitting
                ? "bg-[#FF2233] text-[#F6F6F6] active:scale-95"
                : "bg-[#FFD5DA] text-[#FFFFFF] cursor-not-allowed",
            ].join(" ")}
          >
            {submitting ? "신청 중..." : "신청하기"}
          </button>
        </section>
      </div>
    </div>
  );
}

/* 라디오 컴포넌트 */
interface ReasonRadioProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  highlight?: boolean;
}

function ReasonRadio({
  label,
  selected,
  onSelect,
  highlight,
}: ReasonRadioProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3"
    >
      <span
        className={[
          "flex h-5 w-5 items-center justify-center rounded-full border bg-white",
          selected ? "border-[#FF2233]" : "border-[#D9D9D9]",
        ].join(" ")}
      >
        <span
          className={[
            "h-2.5 w-2.5 rounded-full",
            selected ? "bg-[#FF2233]" : "bg-[#F3F4F5]",
          ].join(" ")}
        />
      </span>

      <span
        className={[
          "text-[14px]",
          selected && highlight ? "text-[#FF2233]" : "text-[#1E2124]",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}
