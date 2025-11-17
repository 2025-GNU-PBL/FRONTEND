import React, { useState } from "react";
import { Icon } from "@iconify/react";

interface CartItem {
  id: number;
  name: string;
  options?: string;
  price: number;
  quantity: number;
}

const mockCartItems: CartItem[] = [
  {
    id: 1,
    name: "프리미엄 티셔츠",
    options: "화이트 / L",
    price: 29000,
    quantity: 1,
  },
  {
    id: 2,
    name: "데일리 팬츠",
    options: "블랙 / M",
    price: 39000,
    quantity: 2,
  },
];

const formatPrice = (value: number) =>
  value.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) + "원";

const WebView: React.FC = () => {
  const [items] = useState<CartItem[]>(mockCartItems);
  const [couponCode, setCouponCode] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<
    "card" | "naver" | "kakao"
  >("card");

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = itemsTotal > 50000 ? 0 : 3000;
  const discount = 0;
  const finalPrice = itemsTotal + shippingFee - discount;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col bg-gray-50 px-6 py-10">
      {/* 상단 타이틀 */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <Icon icon="mdi:arrow-left" className="text-xl" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">주문/결제</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Icon icon="mdi:shield-check-outline" className="text-lg" />
          <span>안전한 결제 환경이 적용됩니다.</span>
        </div>
      </header>

      {/* 본문 레이아웃 */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[2fr,1fr]">
        {/* 왼쪽: 정보 영역 */}
        <div className="space-y-6">
          {/* 배송지 정보 */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  배송지 정보
                </h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  기본 배송지
                </span>
              </div>
              <button className="text-xs font-medium text-blue-600">
                변경
              </button>
            </div>

            <div className="space-y-1 text-sm text-gray-700">
              <p className="font-semibold">홍길동</p>
              <p>서울특별시 강남구 테헤란로 123, 101동 1001호</p>
              <p>010-1234-5678</p>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <Icon icon="mdi:truck-fast-outline" className="text-lg" />
              <span>내일(익일) 도착 예정 · 로켓배송</span>
            </div>
          </section>

          {/* 주문 상품 */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                주문 상품 ({items.length})
              </h2>
              <button className="flex items-center gap-1 text-xs text-gray-500">
                <span>전체 접기</span>
                <Icon icon="mdi:chevron-up" className="text-base" />
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-4"
                >
                  <div className="flex flex-1 gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100">
                      <Icon
                        icon="mdi:image-outline"
                        className="text-2xl text-gray-400"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.name}
                      </p>
                      {item.options && (
                        <p className="mt-1 text-xs text-gray-500">
                          {item.options}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>수량 {item.quantity}개</span>
                        <span className="h-3 w-px bg-gray-200" />
                        <button className="flex items-center gap-1 hover:text-gray-700">
                          <Icon icon="mdi:pencil-outline" className="text-sm" />
                          <span>옵션 변경</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 쿠폰 / 포인트 */}
          <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">쿠폰</h2>
                <button className="text-xs text-blue-600">
                  보유 쿠폰 보기
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="h-10 flex-1 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
                  placeholder="쿠폰 코드 입력"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button className="h-10 rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-700">
                  적용
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">포인트</h2>
                <span className="text-xs text-gray-400">보유 0 P</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="h-10 flex-1 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
                  placeholder="사용할 포인트 입력"
                  disabled
                />
                <button className="h-10 rounded-xl bg-gray-100 px-3 text-xs font-medium text-gray-400">
                  사용
                </button>
              </div>
            </div>
          </section>

          {/* 결제 수단 */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">결제 수단</h2>
              <span className="text-xs text-gray-400">일시불 기준</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <button
                onClick={() => setSelectedPayment("card")}
                className={`flex flex-col items-center justify-center rounded-xl border px-3 py-4 ${
                  selectedPayment === "card"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                <Icon
                  icon="mdi:credit-card-outline"
                  className="mb-1 text-2xl"
                />
                <span>신용/체크카드</span>
              </button>
              <button
                onClick={() => setSelectedPayment("naver")}
                className={`flex flex-col items-center justify-center rounded-xl border px-3 py-4 ${
                  selectedPayment === "naver"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                <Icon icon="simple-icons:naver" className="mb-1 text-2xl" />
                <span>네이버페이</span>
              </button>
              <button
                onClick={() => setSelectedPayment("kakao")}
                className={`flex flex-col items-center justify-center rounded-xl border px-3 py-4 ${
                  selectedPayment === "kakao"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                <Icon icon="simple-icons:kakaotalk" className="mb-1 text-2xl" />
                <span>카카오페이</span>
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <p className="flex items-center gap-2">
                <Icon icon="mdi:information-outline" className="text-sm" />
                <span>
                  결제 수단에 따라 무이자/부분 무이자 혜택이 제공될 수 있습니다.
                </span>
              </p>
            </div>
          </section>
        </div>

        {/* 오른쪽: 결제 요약 박스 */}
        <aside className="sticky top-10 h-fit rounded-2xl bg-white p-5 shadow-md">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            결제 금액
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">상품 금액</span>
              <span className="font-medium text-gray-900">
                {formatPrice(itemsTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">배송비</span>
              <span className="font-medium text-gray-900">
                {shippingFee === 0 ? "무료" : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">할인 금액</span>
              <span className="font-medium text-blue-600">
                {discount > 0 ? `- ${formatPrice(discount)}` : "0원"}
              </span>
            </div>
          </div>

          <hr className="my-4 border-dashed border-gray-200" />

          <div className="mb-4 flex items-center justify-between text-base font-semibold">
            <span>총 결제 금액</span>
            <span className="text-blue-600">{formatPrice(finalPrice)}</span>
          </div>

          <button className="mb-2 flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
            {formatPrice(finalPrice)} 결제하기
          </button>

          <div className="flex items-start gap-2 text-[10px] text-gray-500">
            <input type="checkbox" className="mt-0.5 h-3 w-3" />
            <p>
              주문 내용을 확인하였으며, 정보 제공 및 결제 진행에 동의합니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WebView;
