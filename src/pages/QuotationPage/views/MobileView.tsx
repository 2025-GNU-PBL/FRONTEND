import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

type HallType = "hotel" | "house" | "convention" | "small";
type BudgetLevel = "saving" | "normal" | "premium";
type TimeSlot = "weekday-lunch" | "weekend-day" | "weekend-night";

const EASE_OUT: [number, number, number, number] = [0.18, 1, 0.3, 1];

const formatPrice = (value: number) =>
  value.toLocaleString("ko-KR", { maximumFractionDigits: 0 });

const MobileView: React.FC = () => {
  const [weddingDate, setWeddingDate] = useState("");
  const [region, setRegion] = useState("서울");
  const [hallType, setHallType] = useState<HallType>("hotel");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("weekend-day");
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("normal");
  const [guestCount, setGuestCount] = useState<string>("150");
  const [includePackage, setIncludePackage] = useState(true);
  const [includeCardBenefit, setIncludeCardBenefit] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [kakaoId, setKakaoId] = useState("");
  const [memo, setMemo] = useState("");

  const numericGuest = useMemo(() => {
    const n = parseInt(guestCount.replace(/[^0-9]/g, ""), 10);
    return Number.isNaN(n) ? 0 : n;
  }, [guestCount]);

  const estimate = useMemo(() => {
    const basePerGuest = 80000;

    const hallMultiplier: Record<HallType, number> = {
      hotel: 1.35,
      house: 1.2,
      convention: 1.1,
      small: 0.9,
    };

    const budgetMultiplier: Record<BudgetLevel, number> = {
      saving: 0.9,
      normal: 1,
      premium: 1.18,
    };

    const timeMultiplier: Record<TimeSlot, number> = {
      "weekday-lunch": 0.9,
      "weekend-day": 1,
      "weekend-night": 1.08,
    };

    const guest = Math.max(0, numericGuest);
    const hallBase = guest * basePerGuest * hallMultiplier[hallType];
    const withBudget = hallBase * budgetMultiplier[budgetLevel];
    const withTime = withBudget * timeMultiplier[timeSlot];

    const packageAdd = includePackage ? 1200000 : 0;
    const cardDiscount = includeCardBenefit ? -400000 : 0;

    const subtotal = Math.max(0, withTime + packageAdd + cardDiscount);
    const low = Math.round(subtotal * 0.9);
    const high = Math.round(subtotal * 1.15);

    return {
      guest,
      low,
      high,
      subtotal,
      cardDiscount: Math.abs(cardDiscount),
    };
  }, [
    numericGuest,
    hallType,
    budgetLevel,
    timeSlot,
    includePackage,
    includeCardBenefit,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📱 Mobile wedding quotation request:", {
      weddingDate,
      region,
      hallType,
      timeSlot,
      budgetLevel,
      guestCount: numericGuest,
      includePackage,
      includeCardBenefit,
      name,
      phone,
      kakaoId,
      memo,
    });

    alert(
      "모바일 견적 요청도 아직은 콘솔에만 찍히도록 되어 있어요.\n실제 전송은 API 연동 시점에 연결해주세요 :)"
    );
  };

  const hallTypeLabel = (t: HallType) =>
    t === "hotel"
      ? "호텔식"
      : t === "house"
      ? "하우스 웨딩"
      : t === "convention"
      ? "컨벤션 / 예식장"
      : "스몰웨딩";

  return (
    <motion.div
      className="relative flex min-h-screen flex-col bg-white text-[13px] text-black/80"
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: EASE_OUT },
      }}
    >
      {/* 상단 여백 (앱바 높이 보정) */}
      <div className="h-4" />

      {/* 헤더 */}
      <header className="px-5 pb-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#FF2233]">
              나의 조건으로 보는
            </p>
            <h1 className="mt-1 text-xl font-semibold text-black">
              웨딩홀 견적 요청
            </h1>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF1F2]">
            <Icon
              icon="solar:ringing-phone-bold-duotone"
              className="h-5 w-5 text-[#FB7185]"
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-black/60">
          예식일 · 지역 · 하객 수만 입력해도 대략적인{" "}
          <span className="font-semibold text-black/80">예산 범위</span>를 먼저
          보여드려요.
        </p>
      </header>

      {/* 요약 카드 */}
      <section className="px-5 pb-4">
        <motion.div
          className="rounded-2xl bg-[#111827] px-4 py-4 text-white"
          initial={{ opacity: 0, y: 6 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.25, ease: EASE_OUT },
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">
                estimated range
              </p>
              <p className="text-[12px] text-white/80">
                현재 조건 기준{" "}
                <span className="font-semibold text-[#FDE68A]">
                  예상 총 예식비
                </span>
              </p>
              <p className="text-[11px] text-white/60">
                실제 상담 시, 홀·메뉴·프로모션에 따라 조정될 수 있어요.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/70">예상 범위</p>
              <p className="mt-1 text-[16px] font-semibold text-[#FFDEE3] leading-tight">
                {estimate.low > 0
                  ? `${formatPrice(estimate.low)} ~ ${formatPrice(
                      estimate.high
                    )}원`
                  : "-"}
              </p>
              <p className="mt-1 text-[10px] text-white/60">
                {region} · {hallTypeLabel(hallType)} ·{" "}
                {estimate.guest ? `${estimate.guest}명` : "하객 수 미입력"}
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 본문 스크롤 영역 */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-5 pb-32"
      >
        {/* STEP 1 */}
        <section className="mb-5 rounded-[16px] bg-[#F3F4F5] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-black/55">STEP 1</p>
              <p className="text-sm font-semibold text-black">예식 기본 정보</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] text-black/60">
              예식일 · 지역 · 하객 수
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-black/70">
                예식일
              </label>
              <input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="h-9 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-black/70">
                예식 지역
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-9 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
              >
                {[
                  "서울",
                  "경기 / 인천",
                  "부산",
                  "대구",
                  "대전",
                  "광주",
                  "그 외 지역",
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-black/70">
                예상 하객 수
              </label>
              <div className="flex items-center rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] focus-within:border-[#FF2233] focus-within:ring-1 focus-within:ring-[#FFCCD3]">
                <input
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="예: 150"
                  inputMode="numeric"
                  className="h-8 w-full bg-transparent text-[12px] text-black/80 outline-none"
                />
                <span className="ml-1 text-[11px] text-black/50">명</span>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 2 - 홀 타입 / 예산 / 시간대 */}
        <section className="mb-5 rounded-[16px] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-black/55">STEP 2</p>
              <p className="text-sm font-semibold text-black">
                웨딩홀 타입 · 예산 스타일
              </p>
            </div>
          </div>

          {/* 홀 타입 */}
          <div className="mb-4 space-y-2">
            <p className="text-[11px] font-medium text-black/70">
              어떤 분위기의 예식을 원하세요?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    key: "hotel",
                    label: "호텔식",
                    icon: "solar:buildings-2-linear",
                  },
                  {
                    key: "house",
                    label: "하우스",
                    icon: "solar:home-2-linear",
                  },
                  {
                    key: "convention",
                    label: "컨벤션 / 예식장",
                    icon: "solar:buildings-linear",
                  },
                  {
                    key: "small",
                    label: "스몰 / 가족",
                    icon: "solar:user-heart-linear",
                  },
                ] as { key: HallType; label: string; icon: string }[]
              ).map((h) => {
                const active = hallType === h.key;
                return (
                  <button
                    key={h.key}
                    type="button"
                    onClick={() => setHallType(h.key)}
                    className={[
                      "flex items-center justify-between rounded-[12px] border px-3 py-2 text-left text-[11px] transition-all",
                      active
                        ? "border-[#FF2233] bg-[#FFF5F5] text-[#B91C1C]"
                        : "border-[#E5E7EB] bg-[#F9FAFB] text-black/70",
                    ].join(" ")}
                  >
                    <span className="mr-2 line-clamp-1">{h.label}</span>
                    <Icon icon={h.icon} className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 예산 스타일 */}
          <div className="mb-4 space-y-2">
            <p className="text-[11px] font-medium text-black/70">예산 스타일</p>
            <div className="flex gap-2">
              {(
                [
                  { key: "saving", label: "알뜰하게" },
                  { key: "normal", label: "균형 있게" },
                  { key: "premium", label: "프리미엄" },
                ] as { key: BudgetLevel; label: string }[]
              ).map((b) => {
                const active = budgetLevel === b.key;
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => setBudgetLevel(b.key)}
                    className={[
                      "flex-1 rounded-full border px-3 py-1.5 text-[11px] transition-all",
                      active
                        ? "border-black bg-black text-white"
                        : "border-[#E5E7EB] bg-[#F9FAFB] text-black/70",
                    ].join(" ")}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 시간대 */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-black/70">희망 시간대</p>
            <div className="flex gap-2">
              {(
                [
                  { key: "weekday-lunch", label: "평일 점심" },
                  { key: "weekend-day", label: "주말 낮" },
                  { key: "weekend-night", label: "주말 저녁" },
                ] as { key: TimeSlot; label: string }[]
              ).map((t) => {
                const active = timeSlot === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTimeSlot(t.key)}
                    className={[
                      "flex-1 rounded-full border px-3 py-1.5 text-[11px] transition-all",
                      active
                        ? "border-[#7B61D1] bg-[#F3EEFF] text-[#5C4AA8]"
                        : "border-[#E5E7EB] bg-[#F9FAFB] text-black/70",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* STEP 2.5 - 패키지 / 카드 옵션 */}
        <section className="mb-5 space-y-3">
          <button
            type="button"
            onClick={() => setIncludePackage((v) => !v)}
            className={[
              "flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left text-[11px] transition-all",
              includePackage
                ? "border-[#FF4B5C] bg-[#FFF5F7] text-[#991B1B]"
                : "border-[#E5E7EB] bg-white text-black/75",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Icon
                  icon="solar:confetti-minimalistic-bold-duotone"
                  className="h-5 w-5 text-[#FB7185]"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold">
                  스튜디오 · 드레스 · 메이크업(스드메) 패키지 같이 보기
                </p>
                <p className="mt-1 text-[11px] text-black/55">
                  패키지까지 포함된 예산 그림을 먼저 보고 싶다면 선택해주세요.
                </p>
              </div>
            </div>
            <Icon
              icon={
                includePackage
                  ? "solar:check-circle-bold"
                  : "solar:circle-linear"
              }
              className="h-5 w-5 text-[#FB7185]"
            />
          </button>

          <button
            type="button"
            onClick={() => setIncludeCardBenefit((v) => !v)}
            className={[
              "flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left text-[11px] transition-all",
              includeCardBenefit
                ? "border-[#7B61D1] bg-[#F5F3FF] text-[#4338CA]"
                : "border-[#E5E7EB] bg-white text-black/75",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white shadow-sm">
                <img
                  src="/images/credit.png"
                  alt="card"
                  className="h-5"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = "0";
                  }}
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold">
                  카드 제휴 / 프로모션 할인 가정
                </p>
                <p className="mt-1 text-[11px] text-black/55">
                  현재 기준으로 적용 가능한 카드 혜택 수준을 견적에 반영해요.
                </p>
              </div>
            </div>
            <Icon
              icon={
                includeCardBenefit
                  ? "solar:check-circle-bold"
                  : "solar:circle-linear"
              }
              className="h-5 w-5 text-[#7B61D1]"
            />
          </button>
        </section>

        {/* STEP 3 - 연락처 */}
        <section className="mb-6 rounded-[16px] bg-[#F9FAFB] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-black/55">STEP 3</p>
              <p className="text-sm font-semibold text-black">
                결과 받으실 연락처
              </p>
            </div>
            <p className="text-[10px] text-black/45">
              카카오 / 문자로만 1회 안내
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-black/70">
                성함 <span className="text-[#EF4444]">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 김웨딩"
                className="h-9 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-black/70">
                연락처 (휴대폰) <span className="text-[#EF4444]">*</span>
              </label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="예: 010-0000-0000"
                className="h-9 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-black/70">
                카카오톡 ID 또는 오픈채팅 링크
              </label>
              <input
                value={kakaoId}
                onChange={(e) => setKakaoId(e.target.value)}
                placeholder="예: kakaoID 또는 링크"
                className="h-9 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-black/70">
                추가로 알려주고 싶은 사항
              </label>
              <textarea
                rows={3}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder={`예)\n- 호텔/하우스 중 고민 중인 곳이 있어요.\n- 특정 날짜/시간에만 가능한 사정이 있어요.\n- 이미 계약한 업체(스드메 등)가 있어요.`}
                className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
              />
            </div>
          </div>
        </section>

        <p className="mb-4 text-[10px] text-black/45">
          입력해주신 정보는 웨딩 견적 안내를 위한 용도로만 사용되며, 상담 종료
          후 일정 기간 뒤 안전하게 삭제됩니다.
        </p>

        {/* 폼 내부 보조 버튼 (스크롤 맨 아래용) */}
        <button
          type="submit"
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-[999px] bg-[#FF2233] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_28px_rgba(248,113,113,0.6)] active:scale-[0.98]"
        >
          <span>내 조건으로 웨딩홀 견적 받기</span>
          <Icon icon="solar:arrow-right-up-bold" className="h-4 w-4" />
        </button>
      </form>

      {/* 하단 고정 요약 바 */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="text-[11px] text-black/60">
            <p className="text-[10px] uppercase tracking-[0.22em] text-black/40">
              estimated total
            </p>
            <p className="mt-1 text-[12px] font-semibold text-black">
              {estimate.low > 0
                ? `${formatPrice(estimate.low)} ~ ${formatPrice(
                    estimate.high
                  )}원`
                : "조건을 입력하면 견적이 보여져요"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const form = document.querySelector("form");
              if (!form) return;
              form.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true })
              );
            }}
            className="inline-flex items-center gap-2 rounded-[999px] bg-[#FF2233] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_26px_rgba(248,113,113,0.6)] active:scale-[0.97]"
          >
            <span>견적 요청</span>
            <Icon icon="solar:paper-plane-bold-duotone" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileView;
