// views/WebView.tsx
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/api/axios";
import { toast } from "react-toastify";

// ==== API 응답 타입 ====
interface CartItem {
  cartItemId: number;
  productId: number;
  productName: string;
  bzName: string;
  price: number;
  quantity: number;
  selected: boolean;
  thumbnailUrl: string;
  desireDate: string;
}

interface CartData {
  items: CartItem[];
  totalProductAmount: number;
  totalDiscountAmount: number;
  paymentAmount: number;
}

const WebView: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [cartData, setCartData] = useState<CartData | null>(null);

  // ✅ 처음 진입 로딩용
  const [initialLoading, setInitialLoading] = useState(true);

  // ✅ 체크박스/수량/삭제/문의 같은 동작 중인지 (전체 화면 로딩 X)
  const [isMutating, setIsMutating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isAllChecked, setIsAllChecked] = useState(false);

  const navigate = useNavigate();

  const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;

  // 장바구니 데이터 조회
  const fetchCartData = async (isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      }
      const response = await api.get<CartData>("/api/v1/cart");
      setCartData(response.data);

      const allSelected =
        response.data.items.length > 0 &&
        response.data.items.every((item) => item.selected);
      setIsAllChecked(allSelected);

      setError(null);
    } catch (err) {
      console.error("Failed to fetch cart data:", err);
      setError("장바구니 데이터를 불러오는데 실패했습니다.");
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCartData(true); // ✅ 처음에만 initialLoading 사용
  }, []);

  const togglePopup = () => {
    setIsPopupOpen((prev) => !prev);
  };

  // ✅ 문의하기 모달 열기 (선택 없으면 막기)
  const handleOpenPopup = () => {
    if (!cartData) return;
    const hasSelected = cartData.items.some((item) => item.selected);
    if (!hasSelected) {
      toast.error("문의할 상품을 선택해주세요.");
      return;
    }
    setIsPopupOpen(true);
  };

  // 전체 선택/해제
  const toggleAllCheckboxes = async () => {
    if (!cartData) return;
    const newCheckedState = !isAllChecked;

    try {
      setIsMutating(true);
      await api.post(`/api/v1/cart/select-all?selected=${newCheckedState}`);
      await fetchCartData(false);
    } catch (err) {
      console.error("Failed to update all item selection:", err);
      setError("상품 전체 선택/해제에 실패했습니다.");
    } finally {
      setIsMutating(false);
    }
  };

  // 개별 아이템 업데이트
  const updateCartItem = async (
    cartItemId: number,
    quantity: number,
    selected: boolean
  ) => {
    try {
      setIsMutating(true);
      await api.patch(`/api/v1/cart/items/${cartItemId}`, {
        quantity,
        selected,
      });
      await fetchCartData(false);
    } catch (err) {
      console.error("Failed to update cart item:", err);
      setError("장바구니 아이템 업데이트에 실패했습니다.");
    } finally {
      setIsMutating(false);
    }
  };

  // 개별 체크박스 토글
  const toggleItemCheckbox = async (
    cartItemId: number,
    currentQuantity: number,
    currentSelected: boolean
  ) => {
    await updateCartItem(cartItemId, currentQuantity, !currentSelected);
  };

  // 수량 증가
  const increaseQuantity = async (
    cartItemId: number,
    currentQuantity: number,
    selected: boolean
  ) => {
    await updateCartItem(cartItemId, currentQuantity + 1, selected);
  };

  // 수량 감소 (최소 1)
  const decreaseQuantity = async (
    cartItemId: number,
    currentQuantity: number,
    selected: boolean
  ) => {
    if (currentQuantity > 1) {
      await updateCartItem(cartItemId, currentQuantity - 1, selected);
    }
  };

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (!cartData || cartData.items.length === 0) return;

    const selectedCartItemIds = cartData.items
      .filter((item) => item.selected)
      .map((item) => item.cartItemId);

    if (selectedCartItemIds.length === 0) {
      toast.error("삭제할 상품을 선택해주세요.");
      return;
    }

    try {
      setIsMutating(true);
      await api.post("/api/v1/cart/items/bulk-delete", {
        cartItemIds: selectedCartItemIds,
      });
      toast.success("선택된 상품이 삭제되었습니다.");
      await fetchCartData(false);
    } catch (err) {
      console.error("Failed to delete selected items:", err);
      setError("선택된 상품 삭제에 실패했습니다.");
      toast.error("선택된 상품 삭제에 실패했습니다.");
    } finally {
      setIsMutating(false);
    }
  };

  // 문의하기(체크된 장바구니 상품 기반 초안 생성)
  const handlePurchase = async () => {
    if (
      !cartData ||
      cartData.items.filter((item) => item.selected).length === 0
    ) {
      toast.error("구매할 상품을 선택해주세요.");
      return;
    }

    try {
      setIsMutating(true);
      const response = await api.post<{ draftIds: number[] }>(
        "/api/v1/cart/checkout/inquiry-drafts"
      );
      const { draftIds } = response.data;

      const selectedCartItemIds = cartData.items
        .filter((item) => item.selected)
        .map((item) => item.cartItemId);

      togglePopup();
      navigate("/product-inquiry", {
        state: { draftIds, cartItemIds: selectedCartItemIds },
      });
    } catch (err) {
      console.error("Failed to create inquiry drafts:", err);
      setError("문의 초안 생성에 실패했습니다.");
      toast.error("문의 초안 생성에 실패했습니다.");
    } finally {
      setIsMutating(false);
    }
  };

  // ====== 상태별 화면 처리 ======

  // ✅ 처음 진입 로딩일 때만 전체 로딩 화면
  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] text-sm text-[#1E2124]">
        로딩 중...
      </div>
    );
  }

  if (error && !cartData) {
    // 초기 로딩에서 완전히 실패한 경우
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-5 text-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  // ✅ 장바구니 비었을 때 (디자인 리뉴얼)
  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <div className="mx-auto max-w-6xl px-8 py-12">
          {/* 상단 헤더 */}
          <header className="flex flex-col gap-2 border-b border-[#E5E7EB] pb-6">
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm border border-[#E5E7EB]">
                <Icon icon="mdi:cart-outline" className="h-3.5 w-3.5" />
                <span>장바구니</span>
              </span>
            </div>
            <div className="mt-1 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[#111827]">
                  담아둔 상품이 없어요
                </h1>
                <p className="mt-2 text-sm text-[#6B7280]">
                  마음에 드는 상품을 담아두면 한 번에 비교하고 문의할 수 있어요.
                </p>
              </div>
            </div>
          </header>

          {/* 비어있는 상태 컨텐츠 */}
          <main className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
            {/* 좌측 일러스트 카드 */}
            <div className="rounded-3xl border border-[#E5E7EB] bg-white px-10 py-12 shadow-sm">
              <div className="flex items-center gap-8">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-b from-[#FFE5E7] to-[#FFF5F6]">
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF2233] text-[10px] font-semibold text-white shadow-md">
                    0 개
                  </div>
                  <Icon
                    icon="mdi:cart-outline"
                    className="h-12 w-12 text-[#FF2233]"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#111827]">
                    지금 장바구니에 담긴 상품이 없어요.
                  </p>
                  <p className="text-xs leading-relaxed text-[#6B7280]">
                    자주 비교해서 보는 상품이나 고민 중인 상품이 있다면
                    <br />
                    장바구니에 담아두고 한 번에 문의를 남겨보세요.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-[#6B7280]">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[#D1D5DB]" />
                      여러 업체 상품을 한 번에 문의 가능
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[#D1D5DB]" />
                      수량/옵션을 미리 담아두고 편하게 수정
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[#D1D5DB]" />
                      나중에 다시 들어와도 담아둔 내역 유지
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 우측 액션 카드 */}
            <div className="rounded-3xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-8 py-10">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                START SHOPPING
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#111827]">
                지금 상품을 둘러보고
                <br />
                장바구니를 채워볼까요?
              </h2>
              <p className="mt-3 text-sm text-[#6B7280]">
                원하는 카테고리의 상품을 선택해서 장바구니에 담아두면
                <br />
                나중에 한 번에 문의/구매 요청을 보낼 수 있어요.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[#4B5563] shadow-sm">
                  인기 상품
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[#4B5563] shadow-sm">
                  신규 등록
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[#4B5563] shadow-sm">
                  맞춤 견적
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#FF2233] text-sm font-semibold text-white shadow-sm transition hover:bg-[#e11b2a]"
                  onClick={() => navigate("/")}
                >
                  <Icon
                    icon="mdi:storefront-outline"
                    className="mr-2 h-4 w-4"
                  />
                  상품 보러가기
                </button>
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-xs font-medium text-[#4B5563] hover:border-[#D1D5DB]"
                  onClick={() => navigate(-1)}
                >
                  이전 페이지로 돌아가기
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ 선택된 상품들 & 첫 선택 상품
  const selectedItems = cartData.items.filter((item) => item.selected);
  const selectedCount = selectedItems.length;
  const firstSelectedItem = selectedItems[0] ?? null;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="mx-auto max-w-6xl px-8 py-10">
        {/* 상단 헤더 */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[#111827]">
              장바구니
            </h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              선택한 상품을 확인하고 문의 또는 구매를 진행해 보세요.
            </p>
          </div>
        </header>

        {/* 에러 메시지 (부분 에러) */}
        {error && cartData && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            <Icon icon="mdi:alert-circle-outline" className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* 메인 콘텐츠: 좌측 장바구니 / 우측 요약 */}
        <div className="grid grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] gap-8">
          {/* 왼쪽: 장바구니 리스트 */}
          <section className="space-y-4">
            {/* 상단: 모두선택 / 선택삭제 */}
            <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
              <button
                type="button"
                className="flex items-center gap-2"
                onClick={toggleAllCheckboxes}
                disabled={isMutating}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    isAllChecked
                      ? "border-[#FF2233] bg-[#FF2233]"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  {isAllChecked && (
                    <Icon icon="ion:checkmark" className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-[#111827]">
                  전체 선택
                </span>
                <span className="text-xs text-[#9CA3AF]">
                  ({selectedCount} / {cartData.items.length})
                </span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#111827]"
                onClick={handleDeleteSelected}
                disabled={isMutating}
              >
                <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
                <span>선택 삭제</span>
              </button>
            </div>

            {/* 장바구니 아이템 리스트 */}
            <div className="space-y-4">
              {cartData.items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  {/* 체크박스 */}
                  <div className="flex items-start pt-1">
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center"
                      onClick={() =>
                        toggleItemCheckbox(
                          item.cartItemId,
                          item.quantity,
                          item.selected
                        )
                      }
                      disabled={isMutating}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded ${
                          item.selected
                            ? "bg-[#FF2233]"
                            : "border border-[#D1D5DB] bg-white"
                        }`}
                      >
                        {item.selected && (
                          <Icon
                            icon="ion:checkmark"
                            className="h-4 w-4 text-white"
                          />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* 썸네일 */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                    <img
                      src={item.thumbnailUrl || "/images/placeholder.png"}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* 상품 정보 + 하단 영역 */}
                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-[#9CA3AF]">
                        {item.bzName}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-[#111827]">
                        {item.productName}
                      </p>
                      {item.desireDate && (
                        <p className="mt-1 text-xs text-[#6B7280]">
                          희망 납기일: {item.desireDate}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      {/* 수량 조절 */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#6B7280]">수량</span>
                        <div className="flex items-center gap-3 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1">
                          <button
                            type="button"
                            className="flex h-5 w-5 items-center justify-center"
                            onClick={() =>
                              decreaseQuantity(
                                item.cartItemId,
                                item.quantity,
                                item.selected
                              )
                            }
                            disabled={isMutating}
                          >
                            <Icon
                              icon="mynaui:minus"
                              className="h-4 w-4 text-[#4B5563]"
                            />
                          </button>
                          <span className="min-w-[24px] text-center text-sm text-[#111827]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="flex h-5 w-5 items-center justify-center"
                            onClick={() =>
                              increaseQuantity(
                                item.cartItemId,
                                item.quantity,
                                item.selected
                              )
                            }
                            disabled={isMutating}
                          >
                            <Icon
                              icon="mynaui:plus"
                              className="h-4 w-4 text-[#4B5563]"
                            />
                          </button>
                        </div>
                      </div>

                      {/* 가격 */}
                      <div className="text-right">
                        <div className="text-xs text-[#9CA3AF] line-through">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-[#111827]">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 오른쪽: 합계 & CTA */}
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="mb-4 text-base font-semibold text-[#111827]">
              주문 요약
            </h2>

            <div className="space-y-3 border-b border-[#E5E7EB] pb-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">총 상품금액</span>
                <span className="font-medium text-[#111827]">
                  {formatPrice(cartData.totalProductAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">총 할인금액</span>
                <span className="font-medium text-[#111827]">
                  {formatPrice(cartData.totalDiscountAmount)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-base">
              <span className="font-semibold text-[#111827]">
                결제 예상 금액
              </span>
              <span className="text-xl font-semibold text-[#111827]">
                {formatPrice(cartData.paymentAmount)}
              </span>
            </div>

            <p className="mt-2 text-xs text-[#9CA3AF]">
              실제 결제금액은 쿠폰 및 추가 할인 적용에 따라 변경될 수 있어요.
            </p>

            <button
              type="button"
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#FF2233] text-sm font-semibold text-white shadow-sm transition hover:bg-[#e11b2a] disabled:opacity-60"
              onClick={handleOpenPopup}
              disabled={isMutating}
            >
              <Icon
                icon="mdi:chat-processing-outline"
                className="mr-2 h-4 w-4"
              />
              선택 상품 문의하기
            </button>

            <button
              type="button"
              className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-xs font-medium text-[#4B5563] hover:border-[#D1D5DB]"
              onClick={() => navigate("/")}
            >
              계속 쇼핑하기
            </button>
          </aside>
        </div>
      </div>

      {/* 문의하기 팝업 (모달) */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={togglePopup}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#111827]">
                  문의하기 전 확인해주세요
                </h3>
                <p className="mt-1 text-xs text-[#6B7280]">
                  선택된 상품을 기반으로 문의 초안을 생성할게요.
                </p>
              </div>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
                onClick={togglePopup}
              >
                <Icon
                  icon="meteor-icons:xmark"
                  className="h-4 w-4 text-[#9CA3AF]"
                />
              </button>
            </div>

            {/* 상단 상품 정보 - ✅ 선택된 상품 있을 때만 노출 */}
            {firstSelectedItem && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl bg-[#F9FAFB] p-4">
                <div className="h-14 w-14 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F3F4F6]">
                  <img
                    src={
                      firstSelectedItem.thumbnailUrl ||
                      "/images/placeholder.png"
                    }
                    alt={firstSelectedItem.productName || "상품"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="text-[11px] font-medium text-[#9CA3AF]">
                    {firstSelectedItem.bzName}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#111827] line-clamp-2">
                    {firstSelectedItem.productName}
                  </p>
                  {selectedCount > 1 && (
                    <p className="mt-1 text-[11px] text-[#6B7280]">
                      외 {selectedCount - 1}개 상품 포함
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 금액 요약 */}
            <div className="space-y-2 rounded-2xl bg-[#F7F9FA] p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">상품 금액</span>
                <span className="font-semibold text-[#111827]">
                  {formatPrice(cartData.totalProductAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">쿠폰 / 할인</span>
                <span className="font-semibold text-[#111827]">
                  {formatPrice(cartData.totalDiscountAmount)}
                </span>
              </div>

              <div className="my-2 h-px w-full bg-[#E5E7EB]" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111827]">
                  예상 결제금액
                </span>
                <span className="text-lg font-semibold text-[#111827]">
                  {formatPrice(cartData.paymentAmount)}
                </span>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#4B5563] hover:border-[#D1D5DB]"
                onClick={togglePopup}
              >
                장바구니로 돌아가기
              </button>
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#FF2233] text-sm font-semibold text-white hover:bg-[#e11b2a] disabled:opacity-60"
                onClick={handlePurchase}
                disabled={isMutating}
              >
                문의하기 진행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebView;
