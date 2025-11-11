import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation 임포트
import api from '../../../lib/api/axios'; // axios 인스턴스 임포트
import '../InquiryPage.css'; // Updated CSS import path

interface InquiryDraft {
  prefillId: number;
  productId: number;
  productName: string;
  price: number;
  thumbnailUrl: string;
  quantity: number;
  desiredDate: string;
}

const WebView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // useLocation 훅 초기화
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // shopName과 shopImageUrl은 현재 API 응답에 없으므로, productName을 사용하고 기본 이미지를 유지
  const [shopName, setShopName] = useState('루이즈블랑'); // 기본값 유지
  const [productName, setProductName] = useState('[촬영] 신부신랑 헤어메이크업 (부원장)');
  const [shopImageUrl, setShopImageUrl] = useState('/images/dress.png'); // public 제거
  const [productImageUrl, setProductImageUrl] = useState('/images/makeup.png'); // public 제거
  const maxContentLength = 200;

  const [hasDraftIds, setHasDraftIds] = useState(false); // 새로운 상태 추가

  // draftIds가 없을 경우 /cart로 리다이렉트
  useEffect(() => {
    if (!location.state || !(location.state as { draftIds?: number[] }).draftIds) {
      alert("문의할 상품 정보가 없습니다.");
      navigate('/cart');
      setHasDraftIds(false); // draftIds 없음을 표시
      return;
    }
    setHasDraftIds(true); // draftIds 있음을 표시
  }, [location.state, navigate]);

  useEffect(() => {
    const fetchDraftData = async (draftId: number) => {
      try {
        const response = await api.get<InquiryDraft>(`/api/v1/inquiries/drafts/${draftId}`);
        const draft = response.data;
        // API 응답에는 title, content가 없으므로 비워둠
        // setTitle(draft.title || '');
        // setContent(draft.content || '');

        setProductName(draft.productName);
        setProductImageUrl(draft.thumbnailUrl.replace("/public", ""));

        // shopName은 현재 응답에 없으므로, productName을 임시로 사용하거나 고정값을 유지
        setShopName(draft.productName); // 예시: productName을 shopName으로 사용
        setShopImageUrl(draft.thumbnailUrl.replace("/public", "")); // 예시: product thumbnail을 shop image로 사용

      } catch (error) {
        console.error(`Failed to fetch inquiry draft ${draftId}:`, error);
      }
    };

    if (location.state && (location.state as { draftIds?: number[] }).draftIds) {
      const { draftIds } = location.state as { draftIds: number[] };
      if (draftIds.length > 0) {
        fetchDraftData(draftIds[0]);
      }
    }
  }, [location.state]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxContentLength) {
      setContent(e.target.value);
    }
  };

  const handleSubmitInquiry = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    const { draftIds, cartItemIds } = (location.state as { draftIds?: number[]; cartItemIds?: number[] }) || {};
    if (!draftIds || draftIds.length === 0) {
      alert("문의 초안 정보가 없습니다.");
      navigate(-1);
      return;
    }
    const prefillId = draftIds[0];

    try {
      // TODO: 로딩 상태 관리 추가
      await api.post('/api/v1/inquiries/from-draft', {
        prefillId,
        title,
        content,
      });
      alert('문의가 성공적으로 접수되었습니다.');

      const remainingDraftIds = draftIds.slice(1);
      if (remainingDraftIds.length > 0) {
        // 남아있는 draftIds가 있으면 다음 문의 페이지로 이동
        navigate('/inquiry', { state: { draftIds: remainingDraftIds, cartItemIds } });
      } else {
        // 모든 draftIds가 처리되었으면 장바구니 아이템 삭제 후 장바구니 페이지로 이동
        alert('모든 문의가 완료되었습니다.');
        if (cartItemIds && cartItemIds.length > 0) {
          try {
            await api.post('/api/v1/cart/items/bulk-delete', { cartItemIds });
            alert("장바구니에서 모든 구매 상품이 삭제되었습니다.");
          } catch (deleteError) {
            console.error("장바구니 아이템 삭제 실패:", deleteError);
            alert("장바구니 아이템 삭제에 실패했습니다.");
          }
        }
        navigate('/cart');
      }
    } catch (error) {
      console.error("문의 접수 중 오류:", error);
      alert('문의 접수에 실패했습니다.');
    }
  };

  const isSubmitButtonEnabled = title.trim() !== '' && content.trim() !== '';

  // draftIds가 없을 경우 렌더링하지 않음
  if (!hasDraftIds) {
    return null;
  }

  return (
    <div className="inquiry-page-container"> {/* Using same container for now, adjust CSS later */}
      {/* Header */}
      <div className="inquiry-header">
        <Icon
          icon="solar:alt-arrow-left-linear"
          className="inquiry-header-back-arrow"
          onClick={() => navigate(-1)}
        />
        <h1 className="inquiry-header-title">문의하기</h1>
        {/* Placeholder for right-side icon if any */}
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Shop and Product Info Section */}
      <div className="inquiry-shop-product-section">
        <div className="inquiry-shop-info">
          <div className="inquiry-shop-avatar">
            <img src={shopImageUrl.replace("/public", "")} alt="Shop Avatar" />
          </div>
          <div className="inquiry-shop-text-group">
            <p className="inquiry-shop-name">{shopName}</p>
            <p className="inquiry-shop-description">프리미엄 드레스샵</p>
          </div>
          <button className="inquiry-store-button">스토어 보기</button>
        </div>

        <div className="inquiry-product-info">
          <div className="inquiry-product-thumbnail">
            <img src={productImageUrl} alt="Product Thumbnail" />
          </div>
          <div className="inquiry-product-text-group">
            <p className="inquiry-product-shop-name">{shopName}</p> {/* productName 대신 shopName 사용 예시 */}
            <p className="inquiry-product-description">{productName}</p>
          </div>
        </div>
      </div>

      <div className="separator-gray-8px"></div>

      {/* Inquiry Input Section */}
      <div className="inquiry-input-section">
        <div className="inquiry-title-input-wrapper">
          <input
            type="text"
            className="inquiry-title-input"
            placeholder="문의 제목을 입력해주세요"
            value={title}
            onChange={handleTitleChange}
          />
        </div>

        <div className="inquiry-content-input-wrapper">
          <textarea
            className="inquiry-content-textarea"
            placeholder="문의 내용을 입력해주세요"
            value={content}
            onChange={handleContentChange}
          ></textarea>
          <p className="inquiry-char-count">{content.length}/{maxContentLength}자</p>
        </div>
      </div>

      {/* Inquiry Button Section */}
      <div className="inquiry-button-section">
        <button
          className="inquiry-submit-button"
          onClick={handleSubmitInquiry}
          disabled={!isSubmitButtonEnabled}
          style={isSubmitButtonEnabled ? { backgroundColor: '#1E2124', cursor: 'pointer' } : {}}
        >
          <span className="inquiry-submit-button-text"
                style={isSubmitButtonEnabled ? { color: '#FFFFFF' } : {}}>
            문의하기
          </span>
        </button>
      </div>
    </div>
  );
};

export default WebView;
