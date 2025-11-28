import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../lib/api/axios";
import { toast } from "react-toastify";

interface InquiryDraft {
  prefillId: number;
  productId: number;
  productName: string;
  bzName: string;
  ownerProfileImage: string;
  price: number;
  thumbnailUrl: string;
  quantity: number;
  desiredDate: string;
  category: "WEDDING_HALL" | "STUDIO" | "DRESS" | "MAKEUP" | string;
}

const WebView: React.FC = () => {
  const nav = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const maxContentLength = 200;

  const [shopName, setShopName] = useState("");
  const [productName, setProductName] = useState("");

  const [productImageUrl, setProductImageUrl] = useState("");

  const [hasDraftIds, setHasDraftIds] = useState(false);

  const [productId, setProductId] = useState<number | null>(null);
  const [category, setCategory] = useState<
    "WEDDING_HALL" | "STUDIO" | "DRESS" | "MAKEUP" | string | null
  >(null);

  const resetInquiryState = () => {
    setTitle("");
    setContent("");
    setShopName("");
    setProductName("");
    setProductImageUrl("");
    setProductId(null);
    setCategory(null);
  };

  useEffect(() => {
    const state = location.state as
      | { draftIds?: number[]; cartItemIds?: number[]; category?: string }
      | undefined;

    if (!state || !state.draftIds || state.draftIds.length === 0) {
      console.warn("문의할 상품 정보가 없습니다.");
      resetInquiryState();
      nav("/cart", { replace: true, state: null });
      setHasDraftIds(false);
      return;
    }

    setHasDraftIds(true);

    if (state.category) {
      setCategory(state.category);
    }
  }, [location.state, nav]);

  // draft 데이터 조회
  useEffect(() => {
    const state = location.state as
      | { draftIds?: number[]; cartItemIds?: number[]; category?: string }
      | undefined;

    const fetchDraftData = async (draftId: number) => {
      try {
        const response = await api.get<InquiryDraft>(
          `/api/v1/inquiries/drafts/${draftId}`
        );
        const draft = response.data;

        setProductName(draft.productName);
        setProductImageUrl(draft.thumbnailUrl || "");
        setShopName(draft.bzName);
        setProductId(draft.productId);

        // state에 category이 없고, draft에서 내려오면 사용
        if (!category && draft.category) {
          setCategory(draft.category);
        }
      } catch (error) {
        console.error(`Failed to fetch inquiry draft ${draftId}:`, error);
        toast.error("문의 상품 정보를 불러오지 못했어요.");
      }
    };

    if (state?.draftIds && state.draftIds.length > 0) {
      fetchDraftData(state.draftIds[0]);
    }
  }, [location.state, category]);

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
      console.warn("제목과 내용을 모두 입력해주세요.");
      toast.error("제목과 내용을 모두 입력해주세요.");
      return;
    }

    const state = (location.state as {
      draftIds?: number[];
      cartItemIds?: number[];
      category?: string;
    }) || { draftIds: [], cartItemIds: [] };

    const { draftIds, cartItemIds } = state;

    if (!draftIds || draftIds.length === 0) {
      toast.error("문의 초안 정보가 없습니다.");
      nav(-1);
      return;
    }

    const prefillId = draftIds[0];

    try {
      await api.post("/api/v1/inquiries/from-draft", {
        prefillId,
        title,
        content,
      });
      console.info("문의가 성공적으로 접수되었습니다.");
      toast.success("문의가 성공적으로 접수되었어요.");

      const remainingDraftIds = draftIds.slice(1);
      if (remainingDraftIds.length > 0) {
        nav("/product-inquiry", {
          state: { draftIds: remainingDraftIds, cartItemIds, category },
        });
      } else {
        console.info("모든 문의가 완료되었습니다.");
        if (cartItemIds && cartItemIds.length > 0) {
          try {
            await api.post("/api/v1/cart/items/bulk-delete", { cartItemIds });
            console.info("장바구니에서 모든 구매 상품이 삭제되었습니다.");
          } catch (deleteError) {
            console.error("장바구니 아이템 삭제 실패:", deleteError);
            toast.error("장바구니 상품 삭제에 실패했어요.");
          }
        }
        nav("/cart", { state: null });
      }
    } catch (error) {
      console.error("문의 접수 중 오류:", error);
      toast.error("문의 접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleGoToProductDetail = () => {
    if (!productId) {
      console.warn("상품 ID가 없습니다.");
      toast.error("상품 정보를 찾을 수 없어요.");
      return;
    }

    let basePath = "";

    switch (category) {
      case "WEDDING_HALL":
        basePath = "/wedding";
        break;
      case "STUDIO":
        basePath = "/studio";
        break;
      case "DRESS":
        basePath = "/dress";
        break;
      case "MAKEUP":
        basePath = "/makeup";
        break;
      default:
        basePath = "/wedding";
        console.warn("category 없어 기본 경로(/wedding)를 사용합니다.");
        break;
    }
    nav(`${basePath}/${productId}`);
  };

  const isSubmitButtonEnabled = title.trim() !== "" && content.trim() !== "";

  if (!hasDraftIds) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] mt-17">
      <div className="max-w-[960px] mx-auto px-6 py-8">
        {/* 상단 타이틀 영역 */}
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-[#111827]">
            상품 문의 작성
          </h1>
          <p className="mt-2 text-[13px] text-[#6B7280]">
            선택한 상품에 대해 스토어와 1:1로 문의를 남길 수 있어요.
          </p>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-8 py-7">
          {/* 상품 정보 */}
          <section className="flex flex-col gap-6 border-b border-[#F3F4F6] pb-6">
            {/* 상품 정보 + 상품 상세보기 버튼 */}
            <div className="flex items-center gap-5">
              <div className="w-[80px] h-[80px] rounded-[10px] border border-[#F3F4F6] overflow-hidden bg-[#F5F5F5]">
                {productImageUrl ? (
                  <img
                    src={productImageUrl}
                    alt="상품 썸네일"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <p className="text-[13px] leading-[1.5] tracking-[-0.2px] text-black/40">
                  {shopName || "-"}
                </p>
                <p className="text-[15px] leading-[1.5] tracking-[-0.2px] text-[#111827] line-clamp-2">
                  {productName || "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToProductDetail}
                className="shrink-0 ml-4 px-5 py-2 rounded-full bg-[#F5F7FA] text-[13px] leading-[1.5] font-medium tracking-[-0.2px] text-[#111827] shadow-sm hover:bg-[#E9ECF3] active:scale-[0.98] transition-all whitespace-nowrap"
              >
                상품 상세보기
              </button>
            </div>
          </section>

          {/*  문의 입력 폼 */}
          <section className="pt-6 flex flex-col gap-5">
            {/* 제목 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#374151]">
                문의 제목
              </label>
              <div className="w-full h-[48px] border border-[#E5E7EB] rounded-[10px] flex items-center px-4 bg-[#F9FAFB] focus-within:border-[#111827] focus-within:bg-white transition-colors">
                <input
                  type="text"
                  className="w-full bg-transparent text-[14px] leading-[17px] text-[#111827] placeholder:text-[14px] placeholder:text-[#ADB3B6]/80 outline-none"
                  placeholder="문의 제목을 입력해주세요"
                  value={title}
                  onChange={handleTitleChange}
                />
              </div>
            </div>

            {/* 내용 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#374151]">
                문의 내용
              </label>
              <div className="w-full border border-[#E5E7EB] rounded-[10px] px-4 pt-3 pb-9 bg-[#F9FAFB] focus-within:border-[#111827] focus-within:bg-white transition-colors relative">
                <textarea
                  className="w-full h-[180px] resize-none outline-none bg-transparent text-[14px] leading-[1.5] tracking-[-0.2px] text-[#111827] placeholder:text-[14px] placeholder:leading-[1.5] placeholder:tracking-[-0.2px] placeholder:text-[#ADB3B6]/80"
                  placeholder="문의 내용을 입력해주세요"
                  value={content}
                  onChange={handleContentChange}
                />
                <p className="absolute right-3 bottom-2 text-[12px] leading-[1.5] tracking-[-0.1px] text-[#9CA3AF]">
                  {content.length}/{maxContentLength}자
                </p>
              </div>
            </div>
          </section>

          {/*  하단 버튼 */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSubmitInquiry}
              disabled={!isSubmitButtonEnabled}
              className={`min-w-[180px] h-[48px] rounded-[999px] text-[15px] font-semibold tracking-[-0.2px] flex items-center justify-center ${
                isSubmitButtonEnabled
                  ? "bg-[#FF2233] text-white shadow-sm hover:bg-[#E61E2E]"
                  : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
              } transition-colors`}
            >
              문의 보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebView;
