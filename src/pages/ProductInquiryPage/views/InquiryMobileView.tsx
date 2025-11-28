import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../lib/api/axios";
import MyPageHeader from "../../../components/MyPageHeader";
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

const MobileView: React.FC = () => {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const maxContentLength = 200;

  const [shopName, setShopName] = useState("");
  const [productName, setProductName] = useState("");
  const [shopImageUrl, setShopImageUrl] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");

  const [hasDraftIds, setHasDraftIds] = useState(false);

  // 상품 상세보기를 위한 상태
  const [productId, setProductId] = useState<number | null>(null);
  const [category, setCategory] = useState<
    "WEDDING_HALL" | "STUDIO" | "DRESS" | "MAKEUP" | string | null
  >(null);

  // 문의 관련 상태 초기화 함수
  const resetInquiryState = () => {
    setTitle("");
    setContent("");
    setShopName("");
    setProductName("");
    setShopImageUrl("");
    setProductImageUrl("");
    setProductId(null);
    setCategory(null);
  };

  useEffect(() => {
    const state = location.state as
      | { draftIds?: number[]; cartItemIds?: number[]; setCategory?: string }
      | undefined;

    if (!state || !state.draftIds || state.draftIds.length === 0) {
      console.warn("문의할 상품 정보가 없습니다.");
      resetInquiryState();
      nav("/cart", { replace: true, state: null });
      setHasDraftIds(false);
      return;
    }

    setHasDraftIds(true);

    if (state.setCategory) {
      setCategory(state.setCategory);
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
        setShopImageUrl(draft.ownerProfileImage || "");
        setProductId(draft.productId);

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
      productType?: string;
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
        // 남아 있는 draftIds가 있으면 다음 문의 페이지로 이동
        nav("/product-inquiry", {
          state: { draftIds: remainingDraftIds, cartItemIds, category },
        });
      } else {
        // 모든 draftIds 처리 후 장바구니 아이템 삭제 및 장바구니로 이동
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

  // 상품 상세 페이지 이동
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

  // draftIds가 없을 경우 렌더링하지 않음
  if (!hasDraftIds) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-white">
        <MyPageHeader title="문의하기" onBack={onBack} showMenu={false} />
      </div>

      {/* 내용 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 샵 / 상품 정보 영역 */}
        <section className="border-b border-[#F3F4F5] bg-white px-5 pt-4 pb-3">
          {/* 샵 정보 */}
          <div className="flex items-center">
            <div className="w-[46px] h-[46px] rounded-full bg-[#F5F5F5] overflow-hidden mr-4">
              {shopImageUrl ? (
                <img
                  src={shopImageUrl}
                  alt="샵 프로필"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-col">
              <p className="text-[16px] leading-[1.6] font-semibold tracking-[-0.2px] text-[#1E2124]">
                {shopName || "-"}
              </p>
              <p className="text-[14px] leading-[1.5] tracking-[-0.2px] text-[#999999]">
                프리미엄 드레스샵
              </p>
            </div>
          </div>

          {/* 상품 정보 + 상품 상세보기 버튼 */}
          <div className="mt-5 flex">
            <div className="w-[68px] h-[68px] rounded-[6px] border border-[#F5F5F5] overflow-hidden mr-4 bg-[#F5F5F5]">
              {productImageUrl ? (
                <img
                  src={productImageUrl}
                  alt="상품 썸네일"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[14px] leading-[1.5] tracking-[-0.2px] text-black/40">
                {shopName || "-"}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-[14px] leading-[1.5] tracking-[-0.2px] text-[#1E2124] line-clamp-2">
                  {productName || "-"}
                </p>
                <button
                  type="button"
                  onClick={handleGoToProductDetail}
                  className="shrink-0 ml-2 rounded-[6px] px-4 py-1.5 bg-[#F5F7FA] text-[12px] leading-[1.5] font-medium tracking-[-0.2px] text-[#1E2124] shadow-sm active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  상품 상세보기
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 회색 구분선 */}
        <div className="w-full h-2 bg-[#F7F9FA]" />

        {/* 문의 입력 영역 */}
        <section className="flex-1 px-5 pt-6 pb-4 flex flex-col gap-4">
          {/* 제목 입력 */}
          <div>
            <div className="w-full h-[49px] border border-black/10 rounded-[8px] flex items-center px-4">
              <input
                type="text"
                className="w-full text-[14px] leading-[17px] text-[#1E2124] placeholder:text-[14px] placeholder:text-[#ADB3B6]/80 outline-none"
                placeholder="문의 제목을 입력해주세요"
                value={title}
                onChange={handleTitleChange}
              />
            </div>
          </div>

          {/* 내용 입력 */}
          <div className="flex-1 flex flex-col">
            <div className="w-full border border-black/10 rounded-[8px] px-4 pt-3 pb-10 relative flex-1">
              <textarea
                className="w-full h-full resize-none outline-none text-[14px] leading-[1.5] tracking-[-0.2px] text-[#1E2124] placeholder:text-[14px] placeholder:leading-[1.5] placeholder:tracking-[-0.2px] placeholder:text-[#ADB3B6]/80"
                placeholder="문의 내용을 입력해주세요"
                value={content}
                onChange={handleContentChange}
              />
              <p className="absolute right-3 bottom-2 text-[12px] leading-[1.5] tracking-[-0.1px] text-[#ADB3B6]/80">
                {content.length}/{maxContentLength}자
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="px-5 pb-6 pt-3 bg-white border-t border-[#F3F4F5]">
        <button
          type="button"
          onClick={handleSubmitInquiry}
          disabled={!isSubmitButtonEnabled}
          className={`w-full h-[56px] rounded-[12px] flex items-center justify-center text-[16px] font-semibold tracking-[-0.2px] ${
            isSubmitButtonEnabled
              ? "bg-[#FF2233] text-white"
              : "bg-[#F6F6F6] text-[#ADB3B6]"
          }`}
        >
          문의하기
        </button>
      </div>
    </div>
  );
};

export default MobileView;
