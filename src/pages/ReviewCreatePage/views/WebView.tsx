// 예: src/pages/views/WebView.tsx

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import { multipartApi } from "../../../lib/api/multipartApi";
import { toast } from "react-toastify"; // ✅ toast 추가

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

// 만족도 매핑 (백엔드 enum 매핑용)
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

const WebView: React.FC = () => {
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

  const handleStarClick = (index: number) => {
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
      toast.error("상품 정보가 없습니다. 다시 시도해주세요.");
      return;
    }

    // ✅ MobileView와 동일하게 필드 분리
    const timeSatisfaction = mapSatisfaction(q1Answer);
    const picSatisfaction = mapSatisfaction(q2Answer);

    const requestBody = {
      title: productName,
      star: rating,
      comment: review.trim(),
      timeSatisfaction,
      picSatisfaction,
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

    console.group("[리뷰 작성/Web] FormData 디버그");
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
      toast.success("리뷰가 등록되었습니다.");
      navigate(-1);
    } catch (err) {
      console.error("리뷰 작성 실패:", err);
      toast.error(
        "리뷰 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] mt-15">
      {/* 메인 컨텐츠 */}
      <main className="max-w-[1040px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1.1fr] gap-8">
          {/* 좌측: 리뷰 폼 */}
          <section className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm px-6 py-6">
            {/* 상품 정보 영역 */}
            <div className="flex items-center gap-4 pb-5 border-b border-[#F3F4F5]">
              <div className="w-[76px] h-[76px] rounded-[8px] border border-[#F3F4F5] bg-[#F9FAFB] overflow-hidden flex-shrink-0">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="상품 썸네일"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon
                      icon="solar:image-linear"
                      className="w-8 h-8 text-[#D1D5DB]"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[13px] text-[rgba(0,0,0,0.45)] truncate">
                  {shopName ?? "상점명"}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-[#111827] line-clamp-2">
                  {productName ?? "상품명"}
                </p>
              </div>
            </div>

            {/* 메인 별점 질문 */}
            <div className="pt-5 pb-4 border-b border-[#F3F4F5]">
              <p className="text-[14px] font-semibold text-[#1E2124] mb-3">
                이 상품은 전반적으로 만족스러웠나요?
              </p>
              <div className="flex items-center gap-3">
                {Array.from({ length: 5 }).map((_, index) => {
                  const isActive = index < rating;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleStarClick(index)}
                      className="w-9 h-9 flex items-center justify-center"
                    >
                      <img
                        src={
                          isActive ? "/images/star4.png" : "/images/star3.png"
                        }
                        className="w-8 h-8"
                        alt="별점"
                      />
                    </button>
                  );
                })}
                <span className="ml-1 text-[13px] text-[#9CA3AF]">
                  {rating > 0 ? `${rating}점 / 5점` : "점수를 선택해주세요"}
                </span>
              </div>
            </div>

            {/* 질문 1 */}
            <div className="pt-5">
              <p className="mb-3 text-[14px] font-semibold text-[#1E2124]">
                일정 관리가 편했나요?
              </p>
              <div className="flex flex-wrap gap-2">
                {["만족해요", "보통이에요", "별로에요"].map((label) => {
                  const selected = q1Answer === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSelectQ1(label)}
                      className={`h-[36px] px-4 rounded-full border text-[13px] ${
                        selected
                          ? "border-[#111827] bg-[#111827] text-white"
                          : "border-[#D1D5DB] bg-white text-[#6B7280]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 질문 2 */}
            <div className="pt-5">
              <p className="mb-3 text-[14px] font-semibold text-[#1E2124]">
                전반적인 서비스는 어땠나요?
              </p>
              <div className="flex flex-wrap gap-2">
                {["만족해요", "보통이에요", "별로에요"].map((label) => {
                  const selected = q2Answer === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSelectQ2(label)}
                      className={`h-[36px] px-4 rounded-full border text-[13px] ${
                        selected
                          ? "border-[#111827] bg-[#111827] text-white"
                          : "border-[#D1D5DB] bg-white text-[#6B7280]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 후기 작성 */}
            <div className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[14px] font-semibold text-[#1E2124]">
                  후기 작성
                </p>
                <span className="text-[12px] text-[#9CA3AF]">
                  {review.length}/{MAX_REVIEW_LENGTH}자
                </span>
              </div>

              <div className="relative w-full rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB]">
                <textarea
                  value={review}
                  onChange={handleChangeReview}
                  maxLength={MAX_REVIEW_LENGTH}
                  placeholder="다른 고객님께 도움이 되도록 상품에 대한 솔직한 후기를 남겨주세요."
                  className="w-full min-h-[160px] resize-none bg-transparent outline-none border-none px-4 py-3 text-[14px] leading-[1.6] text-[#1E2124] placeholder:text-[rgba(156,163,175,0.9)]"
                />
              </div>
            </div>
          </section>

          {/* 우측: 이미지 업로드 + 요약/버튼 */}
          <section className="flex flex-col gap-4">
            {/* 이미지 업로드 카드 */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm px-5 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-semibold text-[#111827]">
                  리뷰 사진 첨부
                </p>
                <span className="text-[12px] text-[#9CA3AF]">
                  선택 사항 · 최대 {MAX_IMAGES}장
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* 업로드 버튼 */}
                <button
                  type="button"
                  onClick={handleClickUpload}
                  disabled={images.length >= MAX_IMAGES || submitting}
                  className={`flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[#E5E7EB] bg-[#F9FAFB] h-[96px] ${
                    images.length >= MAX_IMAGES
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:border-[#D1D5DB]"
                  }`}
                >
                  {images.length < MAX_IMAGES ? (
                    <>
                      <Icon
                        icon="iconoir:plus"
                        className="w-6 h-6 text-[#374151]"
                      />
                      <span className="mt-1 text-[12px] text-[#9CA3AF]">
                        {images.length}/{MAX_IMAGES}
                      </span>
                    </>
                  ) : (
                    <>
                      <Icon
                        icon="solar:camera-bold"
                        className="w-6 h-6 text-[#9CA3AF]"
                      />
                      <span className="mt-1 text-[12px] text-[#9CA3AF]">
                        최대 장수 도달
                      </span>
                    </>
                  )}
                </button>

                {/* 업로드된 이미지 썸네일 */}
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-[96px] rounded-[10px] border border-[#E5E7EB] overflow-hidden bg-white"
                  >
                    <img
                      src={image.url}
                      alt="업로드 이미지"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-1.5 right-1.5 w-[20px] h-[20px] rounded-full border border-[#F3F4F6] bg-white flex items-center justify-center shadow-sm"
                    >
                      <Icon
                        icon="meteor-icons:xmark"
                        className="w-3.5 h-3.5 text-[#4B5563]"
                      />
                    </button>
                  </div>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleChangeFiles}
              />
            </div>

            {/* 안내 & 제출 버튼 카드 */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm px-5 py-5 flex flex-col justify-between h-full">
              <div className="mb-4 space-y-1">
                <p className="text-[14px] font-semibold text-[#111827]">
                  리뷰 작성 전 확인해주세요
                </p>
                <ul className="mt-2 space-y-1.5 text-[12px] text-[#6B7280] list-disc list-inside">
                  <li>구체적인 이용 경험을 작성해주시면 더 도움이 돼요.</li>
                  <li>
                    욕설, 비방, 개인정보 등이 포함된 경우 노출이 제한될 수
                    있어요.
                  </li>
                  <li>등록한 리뷰는 관리자 검수 후 노출됩니다.</li>
                </ul>
              </div>

              <button
                type="button"
                disabled={!isFormValid || submitting}
                onClick={handleSubmit}
                className={`w-full h-12 rounded-[999px] flex items-center justify-center text-[14px] font-semibold transition ${
                  isFormValid && !submitting
                    ? "bg-[#FF2233] text-white hover:bg-[#e01e2d]"
                    : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                }`}
              >
                {submitting ? "작성 중..." : "리뷰 등록하기"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default WebView;
