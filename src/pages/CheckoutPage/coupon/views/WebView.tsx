import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

type CouponStatus = "usable" | "used" | "expired";

interface Coupon {
  id: number;
  title: string;
  description: string;
  expiresAt: string;
  status: CouponStatus;
  minAmount?: number;
}

const mockCoupons: Coupon[] = [
  {
    id: 1,
    title: "첫 주문 3,000원 할인",
    description: "1만원 이상 주문 시 사용 가능",
    expiresAt: "2025-12-31",
    status: "usable",
    minAmount: 10000,
  },
  {
    id: 2,
    title: "주말 전용 10% 할인",
    description: "최대 5,000원 할인",
    expiresAt: "2025-11-30",
    status: "usable",
  },
  {
    id: 3,
    title: "재구매 감사 쿠폰",
    description: "2만원 이상 구매 시 4,000원 할인",
    expiresAt: "2025-10-10",
    status: "used",
    minAmount: 20000,
  },
  {
    id: 4,
    title: "기간 한정 5,000원 할인",
    description: "일부 카테고리 제외",
    expiresAt: "2025-09-01",
    status: "expired",
  },
];

const WebView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CouponStatus | "all">("usable");
  const [onlyMinAmount, setOnlyMinAmount] = useState(false);

  const filteredCoupons = useMemo(() => {
    let list = mockCoupons;
    if (activeTab !== "all") {
      list = list.filter((c) => c.status === activeTab);
    }
    if (onlyMinAmount) {
      list = list.filter((c) => !!c.minAmount);
    }
    return list;
  }, [activeTab, onlyMinAmount]);

  const getStatusLabel = (status: CouponStatus) => {
    if (status === "usable") return "사용 가능";
    if (status === "used") return "사용 완료";
    return "기간 만료";
  };

  const getStatusBadgeClass = (status: CouponStatus) => {
    if (status === "usable") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (status === "used") {
      return "bg-slate-100 text-slate-500 border-slate-200";
    }
    return "bg-red-50 text-red-600 border-red-200";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 헤더 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900">
              <Icon icon="mdi:ticket-percent" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">쿠폰함</h1>
              <p className="text-xs text-slate-500">
                보유 중인 쿠폰을 확인하고 바로 사용해 보세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100 transition">
              <Icon icon="mdi:information-outline" className="w-4 h-4" />
              <span>쿠폰 사용 안내</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 레이아웃 */}
      <main className="mx-auto flex max-w-5xl gap-6 px-6 py-6">
        {/* 왼쪽 필터 영역 */}
        <aside className="w-64 rounded-2xl border border-slate-200 bg-white p-4 self-start shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Icon icon="mdi:tune-variant" className="w-4 h-4" />
            필터
          </h2>

          <div className="space-y-4 text-sm">
            {/* 상태 필터 */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">
                쿠폰 상태
              </p>
              <div className="flex flex-col gap-1">
                {[
                  { key: "usable" as const, label: "사용 가능" },
                  { key: "used" as const, label: "사용 완료" },
                  { key: "expired" as const, label: "기간 만료" },
                  { key: "all" as const, label: "전체 보기" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition
                    ${
                      activeTab === tab.key
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {activeTab === tab.key && (
                      <Icon icon="mdi:check" className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 최소 주문금액 필터 */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <p className="mb-2 text-xs font-medium text-slate-500">
                조건부 쿠폰만 보기
              </p>
              <button
                onClick={() => setOnlyMinAmount((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs transition
                ${
                  onlyMinAmount
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      onlyMinAmount
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    <Icon icon="mdi:check" className="w-3 h-3" />
                  </div>
                  <span>최소 주문금액 조건 있는 쿠폰</span>
                </div>
                <Icon icon="mdi:filter-variant" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* 오른쪽 쿠폰 리스트 */}
        <section className="flex-1 space-y-4">
          {/* 상단 탭 (요약) */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { key: "usable" as const, label: "사용 가능" },
                { key: "used" as const, label: "사용 완료" },
                { key: "expired" as const, label: "기간 만료" },
                { key: "all" as const, label: "전체" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition
                  ${
                    activeTab === tab.key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              총{" "}
              <span className="font-semibold text-slate-900">
                {filteredCoupons.length}
              </span>
              개 쿠폰
            </p>
          </div>

          {/* 쿠폰 그리드 */}
          {filteredCoupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
              <Icon
                icon="mdi:ticket-percent-outline"
                className="w-12 h-12 mb-4"
              />
              <p className="text-sm font-medium">
                조건에 맞는 쿠폰이 없습니다.
              </p>
              <p className="mt-1 text-xs">
                필터를 변경하거나 새로운 이벤트를 기다려 주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredCoupons.map((coupon) => {
                const isUsable = coupon.status === "usable";
                return (
                  <article
                    key={coupon.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 ${
                        isUsable ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <div className="p-4 pl-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium bg-slate-50 border-slate-200 text-slate-600 mb-1.5">
                            <Icon
                              icon={
                                isUsable
                                  ? "mdi:ticket-confirmation-outline"
                                  : coupon.status === "used"
                                  ? "mdi:check-circle-outline"
                                  : "mdi:alert-circle-outline"
                              }
                              className="w-3.5 h-3.5"
                            />
                            <span>{getStatusLabel(coupon.status)}</span>
                          </div>
                          <h2 className="text-sm font-semibold leading-snug">
                            {coupon.title}
                          </h2>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${getStatusBadgeClass(
                            coupon.status
                          )}`}
                        >
                          <Icon
                            icon="mdi:clock-outline"
                            className="w-3.5 h-3.5"
                          />
                          <span>D-{Math.max(0, 30)}</span>
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-600">
                        {coupon.description}
                      </p>

                      <div className="mt-3 flex items-end justify-between text-[11px] text-slate-500">
                        <div className="space-y-1.5">
                          {coupon.minAmount && (
                            <div className="flex items-center gap-1.5">
                              <Icon
                                icon="mdi:cash-multiple"
                                className="w-3.5 h-3.5"
                              />
                              <span>
                                {coupon.minAmount.toLocaleString()}원 이상 주문
                                시 사용 가능
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Icon
                              icon="mdi:calendar-range"
                              className="w-3.5 h-3.5"
                            />
                            <span>유효기간 {coupon.expiresAt}까지</span>
                          </div>
                        </div>

                        <button
                          disabled={!isUsable}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition
                          ${
                            isUsable
                              ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
                              : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <span>{isUsable ? "사용하기" : "사용 불가"}</span>
                          {isUsable && (
                            <Icon
                              icon="mdi:chevron-right"
                              className="w-3.5 h-3.5"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default WebView;
