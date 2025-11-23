import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../../../../lib/api/axios";

/* -------------------------------------------------------------------------- */
/*  타입 정의                                                                 */
/* -------------------------------------------------------------------------- */

type RefundRequestPageState = {
  paymentKey: string;
  shopName: string;
  productName: string;
  amount: number; // 상품 금액
  couponDiscount?: number; // 쿠폰 할인 금액
  expectedRefundAmount?: number; // 환불 예상 금액
  payMethodLabel?: string; // "토스 페이먼츠 / 299,700 원" 같은 문구
  thumbnailUrl?: string;
};

type ReasonType = "CHANGE_MIND" | "DESC_MISMATCH" | "OUT_OF_STOCK" | "OTHER";

/* -------------------------------------------------------------------------- */
/*  유틸                                                                      */
/* -------------------------------------------------------------------------- */

const formatMoney = (n: number) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

/* -------------------------------------------------------------------------- */
/*  메인 컴포넌트                                                             */
/* -------------------------------------------------------------------------- */

export default function RefundRequestWebView() {
  const nav = useNavigate();
  const location = useLocation();
  const params = useParams<{ paymentKey?: string }>();

  const state = location.state as RefundRequestPageState | undefined;

  // paymentKey: state 우선, 없으면 URL 파라미터 사용
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

  // 최종 서버로 보낼 cancelReason
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
      console.error("[RefundRequestWebView] cancel-request error:", e);
      window.alert("환불 요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mt-15 w-full min-h-screen bg-[#F6F7FB]">
      <div className="mx-auto max-w-[1040px] px-6 py-8">
        {/* 페이지 타이틀 영역 */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.3px] text-[#111827]">
              환불 요청
            </h1>
            <p className="mt-1 text-[13px] text-[#6B7280] tracking-[-0.2px]">
              결제하신 상품의 환불 사유를 선택하고, 환불 정보를 확인한 뒤 신청해
              주세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => nav(-1)}
            className="hidden items-center gap-1 rounded-full border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#4B5563] hover:bg-white md:inline-flex"
          >
            돌아가기
          </button>
        </header>

        {/* 메인 콘텐츠: 2단 레이아웃 (좌: 상품/사유, 우: 요약) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          {/* 좌측 컬럼 */}
          <div className="space-y-6">
            {/* 상품 정보 카드 */}
            <section className="rounded-3xl border border-[#E5E7EB] bg-white px-6 py-5 shadow-sm">
              <h2 className="mb-4 text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                상품정보
              </h2>

              <div className="flex gap-5">
                <div className="flex h-[92px] w-[92px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#F3F4F6] bg-[#F5F6F8]">
                  {state?.thumbnailUrl ? (
                    <img
                      src={state.thumbnailUrl}
                      alt={state.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="text-[13px] leading-[19px] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                      {state?.shopName ?? "-"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[15px] leading-[22px] tracking-[-0.2px] text-[#1E2124]">
                      {state?.productName ?? "-"}
                    </p>
                  </div>
                  <p className="mt-2 text-right text-[18px] font-semibold leading-[26px] tracking-[-0.3px] text-[#111827]">
                    {formatMoney(productAmount)}
                  </p>
                </div>
              </div>
            </section>

            {/* 환불 사유 선택 */}
            <section className="rounded-3xl border border-[#E5E7EB] bg-white px-6 py-6 shadow-sm">
              <h2 className="mb-4 text-[18px] font-semibold leading-[29px] tracking-[-0.2px] text-[#1E2124]">
                환불 사유 선택
              </h2>

              <div className="space-y-5 text-[14px]">
                {/* 단순 변심 */}
                <div className="space-y-3">
                  <p className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                    단순 변심
                  </p>

                  <ReasonRadio
                    label="상품이 마음에 들지 않음"
                    selected={selectedReason === "CHANGE_MIND"}
                    onSelect={() => setSelectedReason("CHANGE_MIND")}
                  />
                </div>

                <div className="h-px w-full bg-[#EEEEEE]" />

                {/* 상품 문제 */}
                <div className="space-y-3">
                  <p className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                    상품 문제
                  </p>

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

                <div className="h-px w-full bg-[#EEEEEE]" />

                {/* 기타 */}
                <div className="space-y-3">
                  <p className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
                    기타
                  </p>

                  <ReasonRadio
                    label="사유를 입력해주세요"
                    selected={selectedReason === "OTHER"}
                    onSelect={() => setSelectedReason("OTHER")}
                    highlight
                  />

                  <div className="relative mt-1">
                    <textarea
                      className={[
                        "h-[160px] w-full resize-none rounded-[12px] border px-4 py-3 text-[14px] leading-[21px] outline-none",
                        selectedReason === "OTHER"
                          ? "border-[rgba(0,0,0,0.1)] bg-white focus:border-[#FF2233] focus:ring-1 focus:ring-[#FF2233]"
                          : "border-[rgba(0,0,0,0.06)] bg-[#F9FAFB] text-[rgba(0,0,0,0.35)]",
                      ].join(" ")}
                      placeholder="문의 내용을 입력해주세요"
                      value={reasonText}
                      onChange={(e) =>
                        setReasonText(e.target.value.slice(0, 200))
                      }
                      disabled={selectedReason !== "OTHER"}
                    />
                    <div className="pointer-events-none absolute bottom-2 right-3 text-[12px] leading-[18px] text-[rgba(173,179,182,0.8)]">
                      {reasonText.length} / 200자
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 우측 컬럼: 환불 정보 + 신청 버튼 */}
          <aside className="flex flex-col gap-4">
            {/* 환불 정보 카드 */}
            <section className="rounded-3xl border border-[#E5E7EB] bg-white px-6 py-6 shadow-sm">
              <h2 className="mb-4 text-[16px] font-semibold tracking-[-0.2px] text-[#1E2124]">
                환불 정보를 확인해주세요
              </h2>

              <div className="space-y-4">
                {/* 환불 안내 */}
                <div className="space-y-3">
                  <p className="text-[15px] font-semibold text-[#1E2124]">
                    환불안내
                  </p>

                  <div className="space-y-2 text-[13px] leading-[19px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#1E2124]">상품 금액</span>
                      <span className="text-[#1E2124]">
                        {formatMoney(productAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#1E2124]">쿠폰 할인</span>
                      <span className="text-[#1E2124]">
                        {couponDiscount
                          ? `-${formatMoney(couponDiscount)}`
                          : "0원"}
                      </span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-[#EEEEEE]" />
                </div>

                {/* 예상 금액 / 수단 */}
                <div className="space-y-2 text-[13px] leading-[19px]">
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

            {/* 신청하기 버튼 카드 */}
            <section className="rounded-3xl border border-[#F3F4F6] bg-white px-6 py-5 shadow-sm">
              <p className="mb-3 text-[12px] text-[#9CA3AF] tracking-[-0.2px]">
                환불 사유와 환불 정보를 확인한 뒤, 아래 버튼을 눌러 환불을
                신청해 주세요.
              </p>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className={[
                  "flex h-[48px] w-full items-center justify-center rounded-[12px] text-[15px] font-semibold tracking-[-0.2px]",
                  isValid && !submitting
                    ? "bg-[#FF2233] text-white shadow-[0_12px_30px_rgba(255,34,51,0.28)] hover:brightness-105 active:scale-95"
                    : "bg-[#FFD5DA] text-white cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "신청 중..." : "신청하기"}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  서브 컴포넌트: 라디오 버튼                                                */
/* -------------------------------------------------------------------------- */

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
      className="flex h-[22px] w-full max-w-[280px] items-center gap-3"
    >
      {/* 바깥 원 */}
      <span
        className={[
          "flex h-5 w-5 items-center justify-center rounded-full border bg-white",
          selected ? "border-[#FF2233]" : "border-[#D9D9D9]",
        ].join(" ")}
      >
        {/* 안쪽 점 */}
        <span
          className={[
            "h-2.5 w-2.5 rounded-full",
            selected ? "bg-[#FF2233]" : "bg-[#F3F4F5]",
          ].join(" ")}
        />
      </span>

      {/* 라벨 텍스트  */}
      <span
        className={[
          "text-[14px] leading-[21px] tracking-[-0.2px]",
          selected && highlight ? "text-[#FF2233]" : "text-[#1E2124]",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}
