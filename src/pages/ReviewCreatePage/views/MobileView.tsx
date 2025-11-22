import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import { multipartApi } from "../../../lib/api/multipartApi";

const MAX_REVIEW_LENGTH = 200;
const MAX_IMAGES = 5;

interface ReviewLocationState {
  productId?: number;
  shopName?: string;
  productName?: string;
  thumbnailUrl?: string;
}

type ImageStateItem = { id: number; url: string; file: File };

const JSON_PART_KEY = "request";
const FILE_PART_KEY = "images";

// 만족도 매핑 (필요하면 백엔드 enum에 맞춰 여기만 수정하면 됨)
function mapSatisfaction(answer: string | null): string {
  switch (answer) {
    case "만족해요":
      return "SATISFIED";
    case "보통이에요":
      return "NEUTRAL";
    case "별로에요":
      return "UNSATISFIED";
    default:
      return "SATISFIED";
  }
}

const MobileView: React.FC = () => {
  const [rating, setRating] = useState<number>(0);

  const [q1Answer, setQ1Answer] = useState<string | null>(null);
  const [q2Answer, setQ2Answer] = useState<string | null>(null);

  const [review, setReview] = useState<string>("");

  const [images, setImages] = useState<ImageStateItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageIdRef = useRef<number>(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { productId, shopName, productName, thumbnailUrl } =
    (location.state as ReviewLocationState) || {};

  // 이미지 URL 정리
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleStarClick = (index: number) => {
    // 별 클릭하면 해당 인덱스까지 선택 (1~5)
    setRating(index + 1);
  };

  const handleSelectQ1 = (value: string) => {
    setQ1Answer((prev) => (prev === value ? null : value));
  };

  const handleSelectQ2 = (value: string) => {
    setQ2Answer((prev) => (prev === value ? null : value));
  };

  const handleChangeReview = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_REVIEW_LENGTH);
    setReview(value);
  };

  const handleClickUpload = () => {
    if (images.length >= MAX_IMAGES) return;
    fileInputRef.current?.click();
  };

  const handleChangeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files = Array.from(fileList);
    const remaining = MAX_IMAGES - images.length;
    const sliced = files.slice(0, remaining);

    const newImages = sliced.map((file) => {
      const url = URL.createObjectURL(file);
      const id = imageIdRef.current++;
      return { id, url, file };
    });

    setImages((prev) => [...prev, ...newImages]);
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = "";
  };

  const handleRemoveImage = (id: number) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const isFormValid =
    rating > 0 && !!q1Answer && !!q2Answer && review.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;

    if (!productId) {
      alert("상품 정보가 없습니다. 다시 시도해주세요.");
      return;
    }

    const satisfaction = mapSatisfaction(q1Answer);

    const requestBody = {
      title: productName,
      star: rating,
      comment: review.trim(),
      satisfaction,
    };

    const jsonBlob = new Blob([JSON.stringify(requestBody)], {
      type: "application/json",
    });

    const formData = new FormData();
    formData.append(JSON_PART_KEY, jsonBlob, "request.json");

    images.forEach((image) => {
      if (image.file) {
        formData.append(FILE_PART_KEY, image.file, image.file.name);
      }
    });

    // 디버그용 로그
    console.group("[리뷰 작성] FormData 디버그");
    console.log("endpoint:", `/api/v1/products/${productId}/reviews`);
    console.log("JSON:", requestBody);
    console.log(
      "images:",
      images.map((i) => i.file?.name)
    );
    console.groupEnd();

    try {
      setSubmitting(true);
      const res = await multipartApi.post(
        `/api/v1/products/${productId}/reviews`,
        formData
      );
      console.log("리뷰 작성 성공:", res.data);
      alert("리뷰가 등록되었습니다.");
      navigate(-1);
    } catch (err) {
      console.error("리뷰 작성 실패:", err);
      alert("리뷰 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 헤더 */}
      <header className="h-[60px] flex items-center justify-between px-5">
        <button
          type="button"
          className="flex items-center justify-center w-6 h-6"
          onClick={handleGoBack}
        >
          <Icon
            icon="solar:alt-arrow-left-linear"
            className="w-6 h-6 text-[#1E2124]"
          />
        </button>

        <h1 className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
          리뷰 작성
        </h1>

        {/* 가운데 정렬 위해 더미 버튼 */}
        <div className="w-6 h-6" />
      </header>

      {/* 스크롤 영역 */}
      <main className="px-5 pb-32">
        {/* 상품 정보 영역 */}
        <section className="mt-4 flex gap-3">
          <div className="w-[68px] h-[68px] rounded-[6px] border border-[#F5F5F5] bg-gray-100 overflow-hidden">
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="상품 썸네일"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[14px] leading-[1.5] tracking-[-0.2px] text-[rgba(0,0,0,0.4)] text-left">
              {shopName ?? "상점명"}
            </p>
            <p className="mt-1 text-[14px] leading-[1.5] tracking-[-0.2px] text-[#1E2124]">
              {productName ?? "상품명"}
            </p>
          </div>
        </section>

        {/* 상단 구분선 */}
        <div className="mt-6 h-2 w-[calc(100%+40px)] -mx-5 bg-[#F7F9FA]" />

        {/* 메인 별점 질문 */}
        <section className="mt-6 flex flex-col items-center">
          <p className="text-[14px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124] text-center">
            아 상품 어땠나요?
          </p>

          {/* 별점 */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const isActive = index < rating;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleStarClick(index)}
                  className="w-8 h-8 rounded-[1px] flex items-center justify-center"
                >
                  <img
                    src={isActive ? "/images/star4.png" : "/images/star3.png"}
                    className="w-8 h-8"
                    alt="별점"
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* 하단 구분선 */}
        <div className="mt-6 h-2 w-[calc(100%+40px)] -mx-5 bg-[#F7F9FA]" />

        {/* 질문 1: 일정이 관리가 편했나요? */}
        <section className="mt-6">
          <p className="mb-3 text-[14px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
            일정이 관리가 편했나요?
          </p>

          <div className="flex gap-2">
            {/* 만족해요 */}
            <button
              type="button"
              onClick={() => handleSelectQ1("만족해요")}
              className={`h-[37px] px-3 flex items-center justify-center rounded-full border bg-white ${
                q1Answer === "만족해요"
                  ? "border-[#1E2124]"
                  : "border-[#D9D9D9]"
              }`}
            >
              <span
                className={`text-[14px] leading-[1.5] tracking-[-0.2px] ${
                  q1Answer === "만족해요" ? "text-[#1E2124]" : "text-[#999999]"
                }`}
              >
                만족해요
              </span>
            </button>

            {/* 보통이에요 */}
            <button
              type="button"
              onClick={() => handleSelectQ1("보통이에요")}
              className={`h-[37px] px-3 flex items-center justify-center rounded-full border bg-white ${
                q1Answer === "보통이에요"
                  ? "border-[#1E2124]"
                  : "border-[#D9D9D9]"
              }`}
            >
              <span
                className={`text-[14px] leading-[1.5] tracking-[-0.2px] ${
                  q1Answer === "보통이에요"
                    ? "text-[#1E2124]"
                    : "text-[#999999]"
                }`}
              >
                보통이에요
              </span>
            </button>

            {/* 별로에요 */}
            <button
              type="button"
              onClick={() => handleSelectQ1("별로에요")}
              className={`h-[37px] px-3 flex items-center justify-center rounded-full border bg-white ${
                q1Answer === "별로에요"
                  ? "border-[#1E2124]"
                  : "border-[#D9D9D9]"
              }`}
            >
              <span
                className={`text-[14px] leading-[1.5] tracking-[-0.2px] ${
                  q1Answer === "별로에요" ? "text-[#1E2124]" : "text-[#999999]"
                }`}
              >
                별로에요
              </span>
            </button>
          </div>
        </section>

        {/* 질문 2 */}
        <section className="mt-6">
          <p className="mb-3 text-[14px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
            일정이 관리가 편했나요?
          </p>

          <div className="flex gap-2">
            {/* 만족해요 */}
            <button
              type="button"
              onClick={() => handleSelectQ2("만족해요")}
              className={`h-[37px] px-3 flex items-center justify-center rounded-full border bg-white ${
                q2Answer === "만족해요"
                  ? "border-[#1E2124]"
                  : "border-[#D9D9D9]"
              }`}
            >
              <span
                className={`text-[14px] leading-[1.5] tracking-[-0.2px] ${
                  q2Answer === "만족해요" ? "text-[#1E2124]" : "text-[#999999]"
                }`}
              >
                만족해요
              </span>
            </button>

            {/* 보통이에요 */}
            <button
              type="button"
              onClick={() => handleSelectQ2("보통이에요")}
              className={`h-[37px] px-3 flex items-center justify-center rounded-full border bg-white ${
                q2Answer === "보통이에요"
                  ? "border-[#1E2124]"
                  : "border-[#D9D9D9]"
              }`}
            >
              <span
                className={`text-[14px] leading-[1.5] tracking-[-0.2px] ${
                  q2Answer === "보통이에요"
                    ? "text-[#1E2124]"
                    : "text-[#999999]"
                }`}
              >
                보통이에요
              </span>
            </button>

            {/* 별로에요 */}
            <button
              type="button"
              onClick={() => handleSelectQ2("별로에요")}
              className={`h-[37px] px-3 flex items-center justify-center rounded-full border bg-white ${
                q2Answer === "별로에요"
                  ? "border-[#1E2124]"
                  : "border-[#D9D9D9]"
              }`}
            >
              <span
                className={`text-[14px] leading-[1.5] tracking-[-0.2px] ${
                  q2Answer === "별로에요" ? "text-[#1E2124]" : "text-[#999999]"
                }`}
              >
                별로에요
              </span>
            </button>
          </div>
        </section>

        {/* 후기 작성 타이틀 */}
        <section className="mt-8">
          <p className="mb-3 text-[14px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
            후기 작성
          </p>

          {/* 텍스트 영역 박스 */}
          <div className="relative w-full h-[185px] rounded-[8px] border border-[rgba(0,0,0,0.1)] px-4 py-3">
            <textarea
              value={review}
              onChange={handleChangeReview}
              maxLength={MAX_REVIEW_LENGTH}
              placeholder="다른 고객님에게 도움이 되도록 상품에 대한 솔직한 평가를 남겨주세요."
              className="w-full h-full resize-none bg-transparent outline-none border-none text-[14px] leading-[1.5] tracking-[-0.2px] text-[#1E2124] placeholder:text-[rgba(173,179,182,0.8)]"
            />
            <span className="absolute right-3 bottom-3 text-[12px] leading-[1.5] tracking-[-0.1px] text-[rgba(173,179,182,0.8)]">
              최대 {MAX_REVIEW_LENGTH}자
            </span>
          </div>
        </section>

        {/* 이미지 업로드 영역 */}
        <section className="mt-4">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 w-max">
              {/* 업로드 버튼 */}
              <button
                type="button"
                onClick={handleClickUpload}
                disabled={images.length >= MAX_IMAGES || submitting}
                className="inline-flex flex-shrink-0 items-center justify-center px-[27px] py-4 gap-2 w-[82px] h-[82px] border border-dashed border-[#E1E4E6] rounded-[8px] bg-white"
              >
                <div className="flex flex-col items-center">
                  {images.length < MAX_IMAGES ? (
                    <>
                      <Icon
                        icon="iconoir:plus"
                        className="w-6 h-6 text-[#3C4144]"
                      />
                      <span className="mt-1 text-[14px] leading-[1.5] tracking-[-0.2px] text-[rgba(173,179,182,0.8)]">
                        {images.length}/{MAX_IMAGES}
                      </span>
                    </>
                  ) : (
                    <>
                      <Icon
                        icon="solar:camera-bold"
                        className="w-6 h-6 text-[#999999]"
                      />
                      <span className="mt-1 text-[14px] leading-[1.5] tracking-[-0.2px] text-[rgba(173,179,182,0.8)]">
                        5/5
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* 업로드된 이미지 썸네일들 */}
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative w-[82px] h-[82px] rounded-[8px] border border-[#E1E4E6] overflow-hidden bg-white flex-shrink-0"
                >
                  <img
                    src={image.url}
                    alt="업로드 이미지"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full border border-[#F2F2F2] bg-white flex items-center justify-center"
                  >
                    <Icon
                      icon="meteor-icons:xmark"
                      className="w-3 h-3 text-[#3C4144]"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleChangeFiles}
          />
        </section>
      </main>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 w-full bg-white">
        <div className="w-full h-[34px]" />
        <div className="px-5 pb-5">
          <button
            type="button"
            disabled={!isFormValid || submitting}
            onClick={handleSubmit}
            className={`w-full h-14 rounded-[12px] flex items-center justify-center ${
              isFormValid && !submitting ? "bg-[#FF2233]" : "bg-[#F6F6F6]"
            }`}
          >
            <span
              className={`text-[16px] font-semibold leading-[1.5] tracking-[-0.2px] ${
                isFormValid && !submitting ? "text-white" : "text-[#ADB3B6]"
              }`}
            >
              {submitting ? "작성 중..." : "작성 완료"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
