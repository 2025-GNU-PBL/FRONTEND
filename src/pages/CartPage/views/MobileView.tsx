import { useEffect, useState } from 'react';
import './MobileView.css'; // Changed CSS import path
import { Icon } from '@iconify/react';
import api from '../../../lib/api/axios'; // axios 인스턴스 임포트
import { useNavigate } from 'react-router-dom'; // useNavigate 임포트

// API 응답 데이터 타입 정의
interface CartItem {
  cartItemId: number;
  productId: number;
  productName: string;
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

const MobileView = () => {
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

  const toggleItemCheckbox = (cartItemId: number) => {
    if (!cartData) return;
    const updatedItems = cartData.items.map(item =>
      item.cartItemId === cartItemId ? { ...item, selected: !item.selected } : item
    );
    const allSelected = updatedItems.every(item => item.selected);
    // TODO: 백엔드에 특정 아이템의 선택 상태 변경 요청 (필요 시)
    setCartData({ ...cartData, items: updatedItems });
    setIsAllChecked(allSelected);
  };

  const handleDeleteSelected = async () => {
    if (!cartData || cartData.items.length === 0) return;

    const selectedCartItemIds = cartData.items
      .filter(item => item.selected)
      .map(item => item.cartItemId);

    if (selectedCartItemIds.length === 0) {
      alert("삭제할 상품을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/v1/cart/items/bulk-delete', { cartItemIds: selectedCartItemIds });
      alert("선택된 상품이 삭제되었습니다.");
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
      alert("구매할 상품을 선택해주세요.");
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
      navigate('/inquiry', { state: { draftIds, cartItemIds: selectedCartItemIds } });
    } catch (err) {
      console.error("Failed to create inquiry drafts:", err);
      setError("문의 초안 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="cart-page-container">로딩 중...</div>;
  }

  if (error) {
    return <div className="cart-page-container error-message">{error}</div>;
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="cart-page-container">
        <div className="cart-header">
          <Icon icon="solar:alt-arrow-left-linear" className="header-back-arrow" onClick={() => navigate(-1)} /> {/* 뒤로가기 기능 추가 */}
          <h1 className="header-title">장바구니</h1>
          <div className="header-menu-icon"></div>
        </div>
        <div className="empty-cart-view">
          <div className="empty-cart-icon-wrapper">
            <Icon icon="mdi:cart-outline" className="empty-cart-icon" />
          </div>
          <p className="empty-cart-text">장바구니에 담긴 상품이 없어요.</p>
          <button className="go-to-products-button" onClick={() => navigate('/')}>상품 보러가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      {/* Header */}
      <div className="cart-header">
        <Icon icon="solar:alt-arrow-left-linear" className="header-back-arrow" onClick={() => navigate(-1)} />
        <h1 className="header-title">장바구니</h1>
        <div className="header-menu-icon"></div>
      </div>

      <div className="separator-gray-8px"></div> {/* Separator below header */}

      {/* Select All / Delete Selected */}
      <div className="select-delete-section">
        <div className="select-all-group">
          <button
            className={`product-item-checkbox ${isAllChecked ? 'product-item-checkbox-checked' : 'product-item-checkbox-unchecked'}`}
            onClick={toggleAllCheckboxes}
            aria-checked={isAllChecked}
            role="checkbox"
          >
            {isAllChecked && <Icon icon="ion:checkmark" />} {/* Checkmark icon for checked state */}
          </button>
          <span className="select-all-text">모두선택</span>
        </div>
        <span className="delete-selected-text" onClick={handleDeleteSelected}>선택삭제</span>
      </div>

      {/* Product Items */}
      {cartData.items.map(item => (
        <div className="product-item-wrapper" key={item.cartItemId}>
          <button
            className={`product-item-checkbox ${item.selected ? 'product-item-checkbox-checked' : 'product-item-checkbox-unchecked'}`}
            onClick={() => toggleItemCheckbox(item.cartItemId)}
            aria-checked={item.selected}
            role="checkbox"
          >
            {item.selected && <Icon icon="ion:checkmark" />} {/* Checkmark icon for checked state */}
          </button>
          <img src={item.thumbnailUrl || "/images/placeholder.png"} alt={item.productName} className="product-item-image" />
          <div className="product-details">
            <p className="product-item-shop-name">제이바이로이스타</p> {/* TODO: 실제 상점 이름으로 대체 */}
            <p className="product-item-description">{item.productName}<br />(수량: {item.quantity})</p>
            <div className="product-price-section">
              <p className="product-item-original-price">{(item.price * item.quantity).toLocaleString()}원</p>
              <p className="product-item-discounted-price">{(item.price * item.quantity).toLocaleString()}원</p> {/* TODO: 할인 금액 계산 */}
            </div>
            <div className="product-item-quantity-control">
              <Icon icon="mynaui:minus" className="quantity-minus-icon" />
              <span className="quantity-display">{item.quantity}</span>
              <Icon icon="mynaui:plus" className="quantity-plus-icon" />
            </div>
          </div>
        </div>
      ))}

      {/* Summary Section */}
      <div className="summary-section">
        <div className="summary-item">
          <p className="summary-item-label">총 상품금액</p>
          <p className="summary-item-value">{cartData.totalProductAmount.toLocaleString()}원</p>
        </div>
        <div className="summary-item">
          <p className="summary-item-label">총 할인금액</p>
          <p className="summary-item-value">{cartData.totalDiscountAmount.toLocaleString()}원</p>
        </div>
        <div className="summary-item">
          <p className="summary-item-payment-amount">결제금액</p>
          <p className="summary-payment-value">{cartData.paymentAmount.toLocaleString()}원</p>
        </div>
      </div>

      {/* Purchase Bar */}
      <div className="purchase-bar-container">
        <button className="purchase-button" onClick={togglePopup}>
          <span className="purchase-button-text">{cartData.paymentAmount.toLocaleString()}원 구매하기</span>
        </button>
      </div>

      {/* Dimmed Overlay and Pop-up */}
      {isPopupOpen && (
        <div className="dimmed-overlay" onClick={togglePopup}>
          <div className={`popup-container ${isPopupOpen ? '' : 'hidden'}`} onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <div className="popup-product-info">
                <img src={cartData.items[0]?.thumbnailUrl || "/images/placeholder.png"} alt="Product" className="popup-product-image" />
                <div className="popup-product-text-group">
                  <p className="popup-product-shop-name">제이바이로이스타</p>
                  <p className="popup-product-description">{cartData.items[0]?.productName}<br />(부원장)</p>
                </div>
              </div>
              <Icon icon="meteor-icons:xmark" className="popup-close-icon" onClick={togglePopup} />
            </div>

            <div className="popup-summary-section">
              <div className="popup-total-price-row">
                <p className="popup-total-price-label">상품 금액</p>
                <p className="popup-total-price-value">{cartData.totalProductAmount.toLocaleString()}원</p>
              </div>
              <div className="popup-coupon-discount-row">
                <p className="popup-coupon-discount-label">쿠폰 할인</p>
                <p className="popup-coupon-discount-value">{cartData.totalDiscountAmount.toLocaleString()}원</p>
              </div>

              <div className="popup-summary-line"></div>

              <div className="popup-expected-payment-row">
                <p className="popup-expected-payment-label">예상 결제금액</p>
                <p className="popup-expected-payment-value">{cartData.paymentAmount.toLocaleString()}원</p>
              </div>
            </div>

            <div className="popup-buttons-container">
              <button className="popup-cart-button">
                <span className="popup-cart-button-text">장바구니</span>
              </button>
              <button className="popup-purchase-button" onClick={handlePurchase}>
                <span className="popup-purchase-button-text">구매하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileView;
