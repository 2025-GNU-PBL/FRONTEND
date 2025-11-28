// views/MobileView.tsx
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

const MobileView: React.FC = () => {
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

  // ✅ 문의하기 팝업 열기 (선택 없으면 막기)
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
      <div className="flex min-h-screen w-full items-center justify-center bg-white text-sm text-[#1E2124]">
        로딩 중...
      </div>
    );
  }

  if (error && !cartData) {
    // 초기 로딩에서 완전히 실패한 경우
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white px-5 text-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  // 장바구니 비었을 때
  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-white">
        {/* 헤더 */}
        <header className="flex h-[60px] items-center justify-between border-b border-[#EAEDEF] px-5">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center"
            onClick={() => navigate(-1)}
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="h-6 w-6 text-[#1E2124]"
            />
          </button>
          <h1 className="text-center text-[18px] font-semibold leading-[160%] tracking-[-0.2px] text-[#1E2124]">
            장바구니
          </h1>
          <div className="flex h-9 w-9 items-center justify-center" />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-5">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#EAEDEF]">
            <Icon icon="mdi:cart-outline" className="h-8 w-8 text-[#9CA3AF]" />
          </div>
          <p className="mb-4 text-[14px] leading-[150%] tracking-[-0.2px] text-[#4B5563]">
            장바구니에 담긴 상품이 없어요.
          </p>
          <button
            type="button"
            className="h-11 rounded-[12px] bg-[#FF2233] px-6 text-[14px] font-semibold leading-[150%] tracking-[-0.2px] text-white"
            onClick={() => navigate("/")}
          >
            상품 보러가기
          </button>
        </div>
      </div>
    );
  }

  // ✅ 선택된 상품들 & 첫 선택 상품
  const selectedItems = cartData.items.filter((item) => item.selected);
  const firstSelectedItem = selectedItems[0] ?? null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* 헤더 */}
      <header className="flex h-[60px] items-center justify-between border-b border-[#EAEDEF] px-5">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center"
          onClick={() => navigate(-1)}
        >
          <Icon
            icon="solar:alt-arrow-left-linear"
            className="h-6 w-6 text-[#1E2124]"
          />
        </button>
        <h1 className="text-center text-[18px] font-semibold leading-[160%] tracking-[-0.2px] text-[#1E2124]">
          장바구니
        </h1>
        <div className="flex h-9 w-9 items-center justify-center"></div>
      </header>

      {/* 모두선택 / 선택삭제 */}
      <div className="flex items-center justify-between px-5 py-3">
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
                : "border-[#EAEDEF] bg-white"
            }`}
          >
            {isAllChecked && (
              <Icon icon="ion:checkmark" className="h-4 w-4 text-white" />
            )}
          </div>
          <span className="text-[14px] font-normal leading-[150%] tracking-[-0.2px] text-[#1E2124]">
            모두선택
          </span>
        </button>

        <button
          type="button"
          className="text-[14px] font-normal leading-[150%] tracking-[-0.2px] text-[#1E2124]"
          onClick={handleDeleteSelected}
          disabled={isMutating}
        >
          선택삭제
        </button>
      </div>

      {/* 상단 회색 바 */}
      <div className="h-2 w-full bg-[#F7F9FA]" />

      {/* 리스트 + 합계 영역 */}
      <div className="flex-1 overflow-y-auto pb-40">
        {/* 장바구니 아이템 리스트 */}
        {cartData.items.map((item, index) => (
          <React.Fragment key={item.cartItemId}>
            <div className="px-5 py-4">
              {/* 1줄: 체크박스 + 이미지 + 텍스트 */}
              <div className="flex gap-3">
                {/* 체크박스 */}
                <button
                  type="button"
                  className="mt-1 flex h-5 w-5 items-center justify-center"
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
                        : "border border-[#EAEDEF] bg-white"
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

                {/* 이미지 + 우측 텍스트 */}
                <div className="flex flex-1 gap-3">
                  {/* 썸네일 */}
                  <div className="h-20 w-20 overflow-hidden rounded border border-[#F5F5F5] bg-[#FAFAFA]">
                    <img
                      src={item.thumbnailUrl || "/images/placeholder.png"}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* 텍스트 영역 */}
                  <div className="flex flex-1 flex-col justify-center">
                    <span className="text-[14px] font-normal leading-[150%] tracking-[-0.2px] text-black/40">
                      {item.bzName}
                    </span>
                    <p className="mt-1 text-[14px] font-normal leading-[150%] tracking-[-0.2px] text-[#1E2124]">
                      {item.productName}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2줄: 이미지 아래 수량 조절 + 가격 */}
              <div className="mt-3 flex items-center justify-between pl-[48px]">
                {/* 수량 조절 (- 1 +) */}
                <div className="flex items-center">
                  <div className="flex items-center gap-2 rounded border border-[#EAEDEF] px-2 py-[2px]">
                    <button
                      type="button"
                      className="flex h-4 w-4 items-center justify-center"
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
                        className="h-4 w-4 text-[#1E2124]"
                      />
                    </button>
                    <span className="text-[14px] leading-[150%] tracking-[-0.2px] text-[#1E2124]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-4 w-4 items-center justify-center"
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
                        className="h-4 w-4 text-[#1E2124]"
                      />
                    </button>
                  </div>
                </div>

                {/* 가격 */}
                <div className="text-right">
                  <div className="text-[12px] font-normal leading-[150%] tracking-[-0.1px] text-black/40 line-through">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <div className="text-[16px] font-semibold leading-[160%] tracking-[-0.2px] text-[#1E2124]">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            </div>

            {/* 첫 번째 아이템 뒤에 회색 바 하나 (디자인 맞추기용) */}
            {index === 0 && <div className="h-2 w-full bg-[#F7F9FA]" />}
          </React.Fragment>
        ))}

        {/* 합계 위쪽 회색 바 */}
        <div className="h-2 w-full bg-[#F7F9FA]" />

        {/* 합계 영역 */}
        <section className="space-y-2 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-normal leading-[160%] tracking-[-0.2px] textblack/80">
              총 상품금액
            </span>
            <span className="text-[16px] font-semibold leading-[160%] tracking-[-0.2px] textblack/80">
              {formatPrice(cartData.totalProductAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-normal leading-[160%] tracking-[-0.2px] textblack/80">
              총 할인금액
            </span>
            <span className="text-[16px] font-semibold leading-[160%] tracking-[-0.2px] textblack/80">
              {formatPrice(cartData.totalDiscountAmount)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[16px] font-semibold leading-[160%] tracking-[-0.2px] textblack/80">
              결제금액
            </span>
            <span className="text-[20px] font-semibold leading-[160%] tracking-[-0.2px] textblack/80">
              {formatPrice(cartData.paymentAmount)}
            </span>
          </div>
        </section>
      </div>

      {/* 하단 고정 CTA - 전체 폭 사용 */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#EAEDEF] bg-white px-5 py-4">
        <button
          type="button"
          className="flex h-14 w-full items-center justify-center rounded-[12px] bg-[#FF2233]"
          onClick={handleOpenPopup}
          disabled={isMutating}
        >
          <span className="text-[16px] font-semibold leading-[150%] tracking-[-0.2px] text-white">
            문의하기
          </span>
        </button>
      </div>

      {/* 문의하기 팝업 */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={togglePopup}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 상품 정보 - ✅ 선택된 상품 있을 때만 노출 */}
            {firstSelectedItem && (
              <div className="mb-4 flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded border border-[#F5F5F5] bg-[#FAFAFA]">
                    <img
                      src={
                        firstSelectedItem.thumbnailUrl ||
                        "/images/placeholder.png"
                      }
                      alt={firstSelectedItem.productName || "상품"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[13px] leading-[150%] tracking-[-0.2px] textblack/40">
                      {firstSelectedItem.bzName}
                    </p>
                    <p className="mt-1 text-[14px] leading-[150%] tracking-[-0.2px] text-[#1E2124]">
                      {firstSelectedItem.productName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center"
                  onClick={togglePopup}
                >
                  <Icon
                    icon="meteor-icons:xmark"
                    className="h-5 w-5 text-[#9CA3AF]"
                  />
                </button>
              </div>
            )}

            {/* 금액 요약 */}
            <div className="space-y-2 rounded-[12px] bg-[#F7F9FA] p-4 text-[14px]">
              <div className="flex items-center justify-between">
                <span className="text-[#4B5563]">상품 금액</span>
                <span className="font-semibold text-[#1E2124]">
                  {formatPrice(cartData.totalProductAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4B5563]">쿠폰 할인</span>
                <span className="font-semibold text-[#1E2124]">
                  {formatPrice(cartData.totalDiscountAmount)}
                </span>
              </div>

              <div className="my-1 h-px w-full bg-[#E5E7EB]" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1E2124]">
                  예상 결제금액
                </span>
                <span className="text-[16px] font-semibold text-[#1E2124]">
                  {formatPrice(cartData.paymentAmount)}
                </span>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex h-12 flex-1 items-center justify-center rounded-[12px] border border-[#EAEDEF] bg-white text-[14px] font-semibold text-[#1E2124]"
                onClick={togglePopup}
              >
                장바구니
              </button>
              <button
                type="button"
                className="flex h-12 flex-1 items-center justify-center rounded-[12px] bg-[#FF2233] text-[14px] font-semibold text-white"
                onClick={handlePurchase}
                disabled={isMutating}
              >
                문의하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileView;
