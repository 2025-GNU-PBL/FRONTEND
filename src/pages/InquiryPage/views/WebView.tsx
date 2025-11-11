import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import '../InquiryPage.css'; // Updated CSS import path

const WebView: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const maxContentLength = 200;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxContentLength) {
      setContent(e.target.value);
    }
  };

  const handleSubmitInquiry = () => {
    // TODO: 문의하기 API 호출 로직 구현
    alert('문의가 접수되었습니다.');
    navigate(-1); // 이전 페이지로 돌아가기
  };

  const isSubmitButtonEnabled = title.trim() !== '' && content.trim() !== '';

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
            <img src="/public/images/dress.png" alt="Shop Avatar" />
          </div>
          <div className="inquiry-shop-text-group">
            <p className="inquiry-shop-name">루이즈블랑</p>
            <p className="inquiry-shop-description">프리미엄 드레스샵</p>
          </div>
          <button className="inquiry-store-button">스토어 보기</button>
        </div>

        <div className="inquiry-product-info">
          <div className="inquiry-product-thumbnail">
            <img src="/public/images/makeup.png" alt="Product Thumbnail" />
          </div>
          <div className="inquiry-product-text-group">
            <p className="inquiry-product-shop-name">제이바이로이스타</p>
            <p className="inquiry-product-description">[촬영] 신부신랑 헤어메이크업 (부원장)</p>
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
