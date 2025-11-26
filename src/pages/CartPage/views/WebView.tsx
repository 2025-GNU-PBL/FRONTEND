import { useEffect, useState } from 'react';
import './WebView.css'; // Changed CSS import path
import './CommonView.css';
import { Icon } from '@iconify/react';
import api from '../../../lib/api/axios'; // axios 인스턴스 임포트
import { useNavigate } from 'react-router-dom'; // useNavigate 임포트
import { makeItems } from '../../../data/dumyData';

// API 응답 데이터 타입 정의
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

const WebView = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAllChecked, setIsAllChecked] = useState(false); // All items checked
  const navigate = useNavigate(); // useNavigate 훅 초기화

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await api.get<CartData>('/api/v1/cart');
      setCartData(response.data);
      const allSelected = response.data.items.every(item => item.selected);
      setIsAllChecked(allSelected);
    } catch (err) {
      console.error("Failed to fetch cart data:", err);
      setError("장바구니 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const toggleAllCheckboxes = async () => {
    if (!cartData) return;
    const newCheckedState = !isAllChecked;

    try {
      setLoading(true);
      await api.post(`/api/v1/cart/select-all?selected=${newCheckedState}`);
      await fetchCartData(); // 장바구니 데이터 새로고침
    } catch (err) {
      console.error("Failed to update all item selection:", err);
      setError("상품 전체 선택/해제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (cartItemId: number, quantity: number, selected: boolean) => {
    try {
      setLoading(true);
      await api.patch(`/api/v1/cart/items/${cartItemId}`, { quantity, selected });
      await fetchCartData(); // Refresh cart data
    } catch (err) {
      console.error("Failed to update cart item:", err);
      setError("장바구니 아이템 업데이트에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemCheckbox = async (cartItemId: number, currentQuantity: number, currentSelected: boolean) => {
    await updateCartItem(cartItemId, currentQuantity, !currentSelected); // 수량은 현재 값을 유지하고 selected 상태만 변경
  };

  const increaseQuantity = async (cartItemId: number, currentQuantity: number, selected: boolean) => {
    await updateCartItem(cartItemId, currentQuantity + 1, selected);
  };

  const decreaseQuantity = async (cartItemId: number, currentQuantity: number, selected: boolean) => {
    if (currentQuantity > 1) {
      await updateCartItem(cartItemId, currentQuantity - 1, selected);
    }
  };

  const handleDeleteSelected = async () => {
    if (!cartData || cartData.items.length === 0) return;

    const selectedCartItemIds = cartData.items
      .filter(item => item.selected)
      .map(item => item.cartItemId);

    if (selectedCartItemIds.length === 0) {
      console.warn("삭제할 상품을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/v1/cart/items/bulk-delete', { cartItemIds: selectedCartItemIds });
      console.info("선택된 상품이 삭제되었습니다.");
      await fetchCartData(); // 장바구니 데이터 새로고침
    } catch (err) {
      console.error("Failed to delete selected items:", err);
      setError("선택된 상품 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!cartData || cartData.items.filter(item => item.selected).length === 0) {
      console.warn("구매할 상품을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post<{ draftIds: number[] }>('/api/v1/cart/checkout/inquiry-drafts');
      const { draftIds } = response.data;

      // 선택된 장바구니 아이템의 ID를 수집
      const selectedCartItemIds = cartData.items
        .filter(item => item.selected)
        .map(item => item.cartItemId);

      togglePopup(); // 팝업 닫기
      navigate('/product-inquiry', { state: { draftIds, cartItemIds: selectedCartItemIds } });
    } catch (err) {
      console.error("Failed to create inquiry drafts:", err);
      setError("문의 초안 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="web-cart-container">로딩 중...</div>;
  }

  if (error) {
    return <div className="web-cart-container web-error-message">{error}</div>;
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="web-cart-container">
        <div className="web-cart-header">
          <Icon icon="solar:alt-arrow-left-linear" className="web-header-back-arrow" onClick={() => navigate(-1)} />
          <h1 className="web-header-title">장바구니</h1>
          <div className="web-header-menu-icon"></div>
        </div>
        <div className="web-empty-cart-view">
          <div className="web-empty-cart-icon-wrapper">
            <Icon icon="mdi:cart-outline" className="web-empty-cart-icon" />
          </div>
          <p className="web-empty-cart-text">장바구니에 담긴 상품이 없어요.</p>
          <button className="web-go-to-products-button" onClick={() => navigate('/')}>상품 보러가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="web-cart-container">
      {/* Header */}
      <div className="web-cart-header">
        <Icon icon="solar:alt-arrow-left-linear" className="web-header-back-arrow" onClick={() => navigate(-1)} />
        <h1 className="web-header-title">장바구니</h1>
        <div className="web-header-menu-icon"></div>
      </div>

      {/* Main Content Wrapper */}
      <div className="web-content-wrapper">
        <div className="web-separator-gray-8px"></div> {/* Separator below header */}

        <div className="flex flex-col lg:flex-row lg:space-x-8 p-4">
          <div className="flex-1">
            {/* Select All / Delete Selected */}
            <div className="web-select-delete-section">
              <div className="web-select-all-group">
                <button
                  className={`web-product-item-checkbox ${isAllChecked ? 'web-product-item-checkbox-checked' : 'web-product-item-checkbox-unchecked'}`}
                  onClick={toggleAllCheckboxes}
                  aria-checked={isAllChecked}
                  role="checkbox"
                >
                  {isAllChecked && <Icon icon="ion:checkmark" />} {/* Checkmark icon for checked state */}
                </button>
                <span className="web-select-all-text">모두선택</span>
              </div>
              <span className="web-delete-selected-text" onClick={handleDeleteSelected}>선택삭제</span>
            </div>

            {/* Product Items */}
            <div className="web-product-list-container">
              {cartData.items.map(item => (
                <div className="web-product-item-wrapper" key={item.cartItemId}>
                  <button
                    className={`web-product-item-checkbox ${item.selected ? 'web-product-item-checkbox-checked' : 'web-product-item-checkbox-unchecked'}`}
                    onClick={() => toggleItemCheckbox(item.cartItemId, item.quantity, item.selected)}
                    aria-checked={item.selected}
                    role="checkbox"
                  >
                    {item.selected && <Icon icon="ion:checkmark" />} {/* Checkmark icon for checked state */}
                  </button>
                  <img src={item.thumbnailUrl || "/images/placeholder.png"} alt={item.productName} className="web-product-item-image" />
                  <div className="web-product-details">
                    <p className="web-product-item-shop-name">{item.bzName}</p> {/* TODO: 실제 상점 이름으로 대체 */}
                    <p className="web-product-item-description">{item.productName}</p>
                    <div className="web-product-item-info-row">
                      <div className="web-product-price-section">
                        {/* <p className="web-product-item-original-price">{(item.price * item.quantity).toLocaleString()}원</p> */}
                        <p className="web-product-item-discounted-price">{(item.price * item.quantity).toLocaleString()}원</p>
                      </div>
                      <div className="web-product-item-quantity-control">
                        <Icon icon="mynaui:minus" className="web-quantity-minus-icon" onClick={() => decreaseQuantity(item.cartItemId, item.quantity, item.selected)} />
                        <span className="web-quantity-display">{item.quantity}</span>
                        <Icon icon="mynaui:plus" className="web-quantity-plus-icon" onClick={() => increaseQuantity(item.cartItemId, item.quantity, item.selected)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="web-summary-panel">
            {/* Summary Section */}
            <div className="web-summary-section">
              <h2 className="web-summary-title">결제 상세</h2>
              <div className="web-summary-item">
                <p className="web-summary-item-label">총 상품금액</p>
                <p className="web-summary-item-value">{cartData.totalProductAmount.toLocaleString()}원</p>
              </div>
              <div className="web-summary-item">
                <p className="web-summary-item-label">총 할인금액</p>
                <p className="web-summary-item-value">{cartData.totalDiscountAmount.toLocaleString()}원</p>
              </div>
              <div className="web-summary-item web-summary-item-border-top">
                <p className="web-summary-item-payment-amount">총 결제금액</p>
                <p className="web-summary-payment-value">{cartData.paymentAmount.toLocaleString()}원</p>
              </div>
            </div>

            {/* Purchase Bar */}
            <div className="web-purchase-bar-container">
              <button className="web-purchase-button" onClick={togglePopup}>
                <span className="web-purchase-button-text">{cartData.paymentAmount.toLocaleString()}원 구매하기</span>
              </button>
            </div>
          </div>
        </div>
      </div> {/* End of web-content-wrapper */}

      {/* Dimmed Overlay and Pop-up */}
      {isPopupOpen && (
        <div className="web-dimmed-overlay" onClick={togglePopup}>
          <div className={`web-popup-container ${isPopupOpen ? '' : 'hidden'}`} onClick={(e) => e.stopPropagation()}>
            <div className="web-popup-header">
              <div className="web-popup-product-info">
                <img src={cartData.items[0]?.thumbnailUrl || "/images/placeholder.png"} alt="Product" className="web-popup-product-image" />
                <div className="web-popup-product-text-group">
                  <p className="web-popup-product-shop-name">{cartData.items[0]?.bzName}</p>
                  <p className="web-popup-product-description">{cartData.items[0]?.productName}<br /></p>
                </div>
              </div>
              <Icon icon="meteor-icons:xmark" className="web-popup-close-icon" onClick={togglePopup} />
            </div>

            <div className="web-popup-summary-section">
              <div className="web-popup-total-price-row">
                <p className="web-popup-total-price-label">상품 금액</p>
                <p className="web-popup-total-price-value">{cartData.totalProductAmount.toLocaleString()}원</p>
              </div>
              <div className="web-popup-coupon-discount-row">
                <p className="web-popup-coupon-discount-label">쿠폰 할인</p>
                <p className="web-popup-coupon-discount-value">{cartData.totalDiscountAmount.toLocaleString()}원</p>
              </div>

              <div className="web-popup-summary-line"></div>

              <div className="web-popup-expected-payment-row">
                <p className="web-popup-expected-payment-label">예상 결제금액</p>
                <p className="web-popup-expected-payment-value">{cartData.paymentAmount.toLocaleString()}원</p>
              </div>
            </div>

            <div className="web-popup-buttons-container">
              <button className="web-popup-cart-button">
                <span className="web-popup-cart-button-text">장바구니</span>
              </button>
              <button className="web-popup-purchase-button" onClick={handlePurchase}>
                <span className="web-popup-purchase-button-text">문의하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebView;
