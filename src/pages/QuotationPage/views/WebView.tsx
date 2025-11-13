import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

type HallType = "hotel" | "house" | "convention" | "small";
type BudgetLevel = "saving" | "normal" | "premium";
type TimeSlot = "weekday-lunch" | "weekend-day" | "weekend-night";

const PRIMARY_RED = "#FF2233";
const SOFT_BG = "#F3F4F5";

const formatPrice = (value: number) =>
  value.toLocaleString("ko-KR", { maximumFractionDigits: 0 });

const WebView: React.FC = () => {
  const [weddingDate, setWeddingDate] = useState("");
  const [region, setRegion] = useState("서울");
  const [hallType, setHallType] = useState<HallType>("hotel");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("weekend-day");
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("normal");
  const [guestCount, setGuestCount] = useState<string>("200");
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
    // 1인 기준 기본 식대
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

    const packageAdd = includePackage ? 1500000 : 0;
    const cardDiscount = includeCardBenefit ? -500000 : 0;

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

    // 실제 연동은 여기에서 API 호출 연결
    console.log("💍 Wedding quotation request:", {
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
      "견적 요청이 콘솔에만 찍히도록 임시 설정되어 있습니다.\n실제 전송 로직은 API 연동 시점에 붙여주세요 :)"
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
    <div className="min-h-screen bg-white text-black/80">
      {/* 상단 패딩 (공용 헤더 높이 맞춤) */}
      <div className="hidden h-16 md:block" />

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-6 py-10">
        {/* 히어로 영역 */}
        <section className="grid gap-6 md:grid-cols-[1.5fr_minmax(0,1.1fr)]">
          {/* 히어로 카드 */}
          <div className="relative overflow-hidden rounded-3xl bg-[#111827] px-8 py-10 text-white shadow-xl md:px-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'url("/images/pattern.svg")',
                backgroundSize: "cover",
              }}
            />
            <div className="pointer-events-none absolute -left-8 -top-10 h-40 w-40 rounded-full bg-[#FF9CA3] opacity-40 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-[#C7B3FF] opacity-40 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                  <span className="mr-1 inline-flex h-1.5 w-1.5 rounded-full bg-[#FFB4C1]" />
                  1분 만에 보는 나만의 웨딩 견적
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-[32px]">
                  <span className="mr-1 text-[#FFB4C1]">2030 신부</span>
                  <span className="mr-1">맞춤</span>
                  <span className="text-[#FDE68A]">웨딩홀 견적</span>
                </h1>
                <p className="text-sm text-white/80 md:text-[15px]">
                  예식일, 지역, 하객 수만 알려주시면
                  <br />
                  <span className="font-semibold text-[#FFDEE3]">
                    예산에 맞는 웨딩홀·스드메 패키지
                  </span>
                  를 한 번에 정리해서 보여드려요.
                </p>

                <div className="mt-3 grid gap-3 text-xs text-white/85 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/10">
                      <Icon
                        icon="solar:checklist-minimalistic-linear"
                        className="h-4 w-4"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">3단계 간단 입력</p>
                      <p className="text-[11px] text-white/70">
                        예식·예산·연락처만 순서대로
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/10">
                      <Icon
                        icon="solar:confetti-minimalistic-outline"
                        className="h-4 w-4"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">실제 가격 감각</p>
                      <p className="text-[11px] text-white/70">
                        하객 수 기준 예상 단가 반영
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/10">
                      <Icon icon="solar:chat-dots-linear" className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">전담 플래너 연결</p>
                      <p className="text-[11px] text-white/70">
                        상담 희망 시 별도 안내
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 요약 견적 박스 */}
              <div className="mt-4 rounded-2xl bg-white/7 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 text-xs text-white/85">
                    <p className="text-[10px] uppercase tracking-[0.23em] text-white/60">
                      estimated range
                    </p>
                    <p className="text-[13px]">
                      현재 조건 기준{" "}
                      <span className="font-semibold text-[#FDE68A]">
                        예식 총 예상비용
                      </span>
                    </p>
                    <p className="text-[11px] text-white/65">
                      실제 계약 시, 홀·메뉴·프로모션에 따라 달라질 수 있어요.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-white/70">예상 범위</p>
                    <p className="mt-1 text-lg font-semibold text-[#FFDEE3]">
                      {estimate.low > 0
                        ? `${formatPrice(estimate.low)} ~ ${formatPrice(
                            estimate.high
                          )}원`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 요약 카드 */}
          <div className="flex flex-col gap-4">
            <div
              className="rounded-3xl border border-[#F3D5DF] bg-[#FFF5F7] p-5 shadow-sm"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 0 0, #FFE4EA 0, transparent 60%)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#FF4B5C]">
                    내 조건으로 계산된 견적
                  </p>
                  <p className="mt-2 text-[13px] text-black/75">
                    {region} · {hallTypeLabel(hallType)} ·{" "}
                    {estimate.guest || "하객 수 미입력"}명
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow">
                  <Icon
                    icon="solar:ringing-phone-bold-duotone"
                    className="h-6 w-6 text-[#FF4B5C]"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl bg-white/70 p-3 text-xs text-black/75">
                <div className="flex items-center justify-between">
                  <span>총 예상비용 (범위)</span>
                  <span className="font-semibold text-[#E11D48]">
                    {estimate.low > 0
                      ? `${formatPrice(estimate.low)} ~ ${formatPrice(
                          estimate.high
                        )}원`
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-black/60">
                  <span>스드메 패키지 포함</span>
                  <span>{includePackage ? "포함" : "미포함"}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-black/60">
                  <span>카드 제휴 혜택 적용</span>
                  <span>
                    {includeCardBenefit && estimate.cardDiscount > 0
                      ? `최대 ${formatPrice(estimate.cardDiscount)}원 할인 가정`
                      : "미적용"}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-black/45">
                * 견적은 대략적인 가이드이며, 실제 상담 시 보다 정확한 금액을
                안내드립니다.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-[11px] text-black/70">
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                  <Icon
                    icon="solar:info-circle-linear"
                    className="h-4 w-4 text-[#6B7280]"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-black/80">
                    이런 분들께 추천해요
                  </p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    <li>
                      예산은 정해져 있는데 대략적인 그림부터 보고 싶은 신부님
                    </li>
                    <li>
                      호텔 / 하우스 / 컨벤션 중 어디가 맞을지 감이 안 오는
                      신부님
                    </li>
                    <li>스드메까지 한 번에 패키지로 보고 싶은 신부님</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 메인 폼 영역 */}
        <section className="grid gap-6 md:grid-cols-[1.7fr_minmax(0,1.1fr)]">
          {/* 왼쪽: 폼 */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
          >
            {/* Step 1 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-black/70">STEP 1</p>
                <h2 className="mt-1 text-sm font-semibold text-black">
                  예식 기본 정보
                </h2>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-3 py-1 text-[11px] text-black/60">
                <Icon icon="solar:calendar-linear" className="mr-1.5 h-4 w-4" />
                예식일 · 지역 · 하객수
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-black/70">
                  예식일
                </label>
                <input
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs text-black/80 outline-none ring-0 focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-black/70">
                  예식 지역
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs text-black/80 outline-none ring-0 focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
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
                <label className="text-xs font-medium text-black/70">
                  예상 하객 수
                </label>
                <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs focus-within:border-[#FF2233] focus-within:ring-1 focus-within:ring-[#FFCCD3]">
                  <input
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    placeholder="예: 200"
                    inputMode="numeric"
                    className="h-9 w-full bg-transparent text-xs text-black/80 outline-none"
                  />
                  <span className="ml-1 text-[11px] text-black/50">명</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs font-semibold text-black/70">STEP 2</p>
                <h2 className="mt-1 text-sm font-semibold text-black">
                  웨딩홀 타입 · 예산 스타일
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.4fr_minmax(0,1.1fr)]">
              {/* 홀 타입 */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-black/70">
                  어떤 분위기의 예식을 원하시나요?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        key: "hotel",
                        icon: "solar:buildings-2-linear",
                        label: "호텔식",
                      },
                      {
                        key: "house",
                        icon: "solar:home-2-linear",
                        label: "하우스 웨딩",
                      },
                      {
                        key: "convention",
                        icon: "solar:buildings-linear",
                        label: "컨벤션 / 예식장",
                      },
                      {
                        key: "small",
                        icon: "solar:user-heart-linear",
                        label: "스몰 / 가족 예식",
                      },
                    ] as { key: HallType; icon: string; label: string }[]
                  ).map((h) => {
                    const active = hallType === h.key;
                    return (
                      <button
                        key={h.key}
                        type="button"
                        onClick={() => setHallType(h.key)}
                        className={[
                          "flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-[11px] transition-all",
                          active
                            ? "border-[#FF2233] bg-[#FFF5F5] text-[#B91C1C] shadow-sm"
                            : "border-[#E5E7EB] bg-[#F9FAFB] text-black/70 hover:bg-[#F3F4F6]",
                        ].join(" ")}
                      >
                        <span>{h.label}</span>
                        <Icon icon={h.icon} className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 예산 & 타임 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-black/70">
                    예산 스타일
                  </p>
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
                            "flex-1 rounded-full border px-3 py-2 text-center text-[11px] transition-all",
                            active
                              ? "border-black bg-black text-white"
                              : "border-[#E5E7EB] bg-[#F9FAFB] text-black/70 hover:bg-[#F3F4F6]",
                          ].join(" ")}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-black/70">
                    희망 시간대
                  </p>
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
                            "flex-1 rounded-full border px-3 py-2 text-center text-[11px] transition-all",
                            active
                              ? "border-[#7B61D1] bg-[#F3EEFF] text-[#5C4AA8]"
                              : "border-[#E5E7EB] bg-[#F9FAFB] text-black/70 hover:bg-[#F3F4F6]",
                          ].join(" ")}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 패키지 / 카드 옵션 */}
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setIncludePackage((v) => !v)}
                className={[
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs transition-all",
                  includePackage
                    ? "border-[#FF4B5C] bg-[#FFF5F7] text-[#991B1B]"
                    : "border-[#E5E7EB] bg-[#F9FAFB] text-black/75 hover:bg-[#F3F4F6]",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Icon
                      icon="solar:confetti-minimalistic-bold-duotone"
                      className="h-5 w-5 text-[#FF4B5C]"
                    />
                  </div>
                </div>
                <div className="flex-1 pl-3">
                  <p className="text-[11px] font-semibold">
                    스튜디오 · 드레스 · 메이크업(스드메) 패키지
                  </p>
                  <p className="mt-1 text-[11px] text-black/55">
                    패키지로 함께 볼 수 있게 견적에 포함해드려요.
                  </p>
                </div>
                <div className="pl-2">
                  <Icon
                    icon={
                      includePackage
                        ? "solar:check-circle-bold"
                        : "solar:circle-linear"
                    }
                    className="h-5 w-5 text-[#FF4B5C]"
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeCardBenefit((v) => !v)}
                className={[
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs transition-all",
                  includeCardBenefit
                    ? "border-[#7B61D1] bg-[#F5F3FF] text-[#4338CA]"
                    : "border-[#E5E7EB] bg-[#F9FAFB] text-black/75 hover:bg-[#F3F4F6]",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <img
                      src="/images/credit.png"
                      alt="card"
                      className="h-5"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity =
                          "0";
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1 pl-3">
                  <p className="text-[11px] font-semibold">
                    카드 제휴 / 프로모션 할인 가정
                  </p>
                  <p className="mt-1 text-[11px] text-black/55">
                    현재 기준으로 적용 가능한 대표 할인 수준을 반영해요.
                  </p>
                </div>
                <div className="pl-2">
                  <Icon
                    icon={
                      includeCardBenefit
                        ? "solar:check-circle-bold"
                        : "solar:circle-linear"
                    }
                    className="h-5 w-5 text-[#7B61D1]"
                  />
                </div>
              </button>
            </div>

            {/* Step 3 연락처 */}
            <div className="mt-2 border-t border-[#E5E7EB] pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-black/70">STEP 3</p>
                  <h2 className="mt-1 text-sm font-semibold text-black">
                    결과 전달 받을 연락처
                  </h2>
                </div>
                <p className="text-[11px] text-black/50">
                  카카오 / 문자 중 편한 채널로만 연락드립니다.
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-black/70">
                    성함 <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 김웨딩"
                    className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-black/70">
                    연락처 (휴대폰) <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="예: 010-0000-0000"
                    className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-black/70">
                    카카오톡 ID 또는 오픈채팅 링크
                  </label>
                  <input
                    value={kakaoId}
                    onChange={(e) => setKakaoId(e.target.value)}
                    placeholder="예: kakaoID 또는 링크"
                    className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-black/70">
                    추가로 알려주고 싶은 사항
                  </label>
                  <textarea
                    rows={3}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder={`예)\n- 꼭 호텔식으로 진행하고 싶어요.\n- 시댁 / 친정 일정 때문에 날짜 옵션이 정해져 있어요.\n- 스드메는 이미 계약한 곳이 있어요.`}
                    className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs text-black/80 outline-none focus:border-[#FF2233] focus:ring-1 focus:ring-[#FFCCD3]"
                  />
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-[11px] text-black/50">
                입력하신 정보는{" "}
                <span className="font-semibold text-black/70">
                  견적 안내 및 상담 목적
                </span>
                으로만 사용되며, 요청 시 언제든지 삭제할 수 있어요.
              </p>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-red,#FF2233)] px-6 py-2.5 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(239,68,68,0.45)] transition hover:brightness-105 active:scale-[0.97]"
                style={{ backgroundColor: PRIMARY_RED }}
              >
                <span>내 조건으로 견적 받기</span>
                <Icon icon="solar:arrow-right-up-bold" className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* 오른쪽: 작은 팁 / 안내 */}
          <aside className="space-y-4">
            <div
              className="rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 text-sm text-black/75"
              style={{ backgroundColor: SOFT_BG }}
            >
              <h3 className="flex items-center text-[14px] font-semibold text-black/85">
                <Icon
                  icon="solar:chat-round-like-linear"
                  className="mr-2 h-4 w-4 text-[#FF2233]"
                />
                이런 정보까지 함께 주시면 좋아요
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[12px] text-black/70">
                <li>양가 부모님 / 직장 등 고려해야 하는 지역</li>
                <li>호텔 / 하우스 / 컨벤션 중 이미 고민 중인 후보</li>
                <li>웨딩 촬영(본식 / 스냅)까지 함께 보고 싶은지 여부</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 text-[12px] text-black/70">
              <h3 className="mb-2 flex items-center text-[13px] font-semibold text-black/85">
                <Icon
                  icon="solar:shield-keyhole-minimalistic-linear"
                  className="mr-2 h-4 w-4 text-[#6B7280]"
                />
                개인정보는 안전하게 관리돼요
              </h3>
              <p className="text-[11px] leading-relaxed text-black/55">
                웨딩PICK은 신부님의 정보를 외부에 제공하지 않으며, 상담이 종료된
                후에는 일정 기간 보관 뒤 안전하게 파기합니다.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default WebView;
