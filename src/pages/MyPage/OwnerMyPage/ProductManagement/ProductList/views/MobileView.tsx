import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../../components/MyPageHeader";
import api from "../../../../../../lib/api/axios";

/** ====== 타입 ====== */
type ProductCategory =
  | "WEDDING"
  | "STUDIO"
  | "DRESS"
  | "MAKEUP"
  | "WEDDING_HALL";

type OwnerProduct = {
  id: number;
  name: string; // 카드 타이틀 (응답 detail)
  brandName: string; // 업체명 (응답 name)
  price: number; // 원 단위
  thumbnailUrl?: string; // 썸네일 (응답 thumbnail)
  category: ProductCategory;
  createdAt: string; // ISO (YYYY-MM-DDTHH:mm:ss)
};

/** 백엔드 실제 응답 DTO 타입 */
type ApiOwnerProduct = {
  id: number;
  name: string; // 업체명
  detail: string; // 상품명
  price: number;
  thumbnail: string | null;
  category: string;
  createdAt: string;
};

type PageMeta = {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
};

type ApiOwnerProductPageResponse = {
  content: ApiOwnerProduct[];
  page: PageMeta;
};

const DELETE_ENDPOINT_MAP: Record<ProductCategory, string> = {
  WEDDING_HALL: "/api/v1/wedding-hall",
  WEDDING: "/api/v1/wedding-hall", // 목록에서 WEDDING 으로 올 수도 있으니 같이 맵핑
  STUDIO: "/api/v1/studio",
  DRESS: "/api/v1/dress",
  MAKEUP: "/api/v1/makeup",
};

/** ====== 유틸 ====== */
const formatDateYMD = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};

const formatPrice = (n: number) => (n ?? 0).toLocaleString("ko-KR") + "원";

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OwnerProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 페이지네이션 파라미터
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  // pageMeta는 일단 백엔드 메타만 저장하고, 현재는 직접 사용하지 않음
  const [, setPageMeta] = useState<PageMeta | null>(null);

  /** 목록 조회 */
  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<ApiOwnerProductPageResponse>(
          "/api/v1/product",
          {
            params: {
              pageNumber,
              pageSize,
            },
          }
        );

        const mapped: OwnerProduct[] = (data?.content ?? []).map((p) => ({
          id: p.id,
          name: p.detail,
          brandName: p.name,
          price: p.price,
          thumbnailUrl: p.thumbnail ?? undefined,
          category: p.category as ProductCategory,
          createdAt: p.createdAt,
        }));

        // 페이지별로 append
        setItems((prev) => (pageNumber === 1 ? mapped : [...prev, ...mapped]));

        setPageMeta(data?.page ?? null);

        // hasMore 계산 (총 개수 기준으로)
        if (data?.page) {
          const total = data.page.totalElements;
          const loaded = pageNumber * pageSize;
          setHasMore(loaded < total);
        } else {
          // page 정보 없으면 pageSize 기반으로만 추정
          setHasMore(mapped.length === pageSize);
        }
      } catch (e) {
        console.error("[ProductManageMobileView] fetch error:", e);
        setError("상품을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [pageNumber, pageSize]);

  /** 최신순 정렬 */
  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
      ),
    [items]
  );

  /** ====== 삭제 ====== */
  const onDelete = async (productId: number, category: ProductCategory) => {
    if (!confirm("이 상품을 삭제하시겠어요?")) return;

    const endpoint = DELETE_ENDPOINT_MAP[category];
    if (!endpoint) {
      alert("삭제할 수 없는 카테고리입니다.");
      return;
    }

    try {
      await api.delete(`${endpoint}/${productId}`);

      setItems((prev) => prev.filter((p) => p.id !== productId));
      setPageMeta((prev) =>
        prev
          ? {
              ...prev,
              totalElements: Math.max(prev.totalElements - 1, 0),
            }
          : prev
      );
    } catch (e) {
      console.error("[delete product] error:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  /** ====== 상세보기 (상세 페이지 이동) ====== */
  const onViewDetail = (product: OwnerProduct) => {
    // 상세 페이지에서 다시 쓰기 편하도록 state 로 전체 상품 정보 전달
    nav(`/my-page/owner/products/management/${product.id}`, {
      state: { product },
    });
  };

  const onRegisterProduct = () => {
    nav("/my-page/owner/product/create");
  };

  const onRegisterCoupon = (productId: number, category: ProductCategory) => {
    nav(
      `/my-page/owner/coupons/register?productId=${productId}&category=${category}`
    );
  };

  /** 스크롤 핸들러 (무한 스크롤) */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // 바닥 근처(+여유 80px) && 로딩 중이 아니고 && 더 불러올 게 있을 때
      if (!loading && hasMore && scrollHeight - scrollTop - clientHeight < 80) {
        setPageNumber((prev) => prev + 1);
      }
    },
    [loading, hasMore]
  );

  /** ====== 뷰 ====== */
  const isInitialLoading = loading && items.length === 0;
  const isEmpty = !loading && items.length === 0 && !error;

  return (
    <div className="w-full min-h-screen bg-white flex flex-col mt-15">
      <MyPageHeader title="상품 관리" onBack={onBack} showMenu={false} />

      {/* 콘텐츠 영역: 화면 전체에서 헤더를 제외한 나머지 높이를 사용 */}
      <div className="flex-1 bg-white overflow-y-auto" onScroll={handleScroll}>
        {/* 초기 로딩 */}
        {isInitialLoading && (
          <div className="px-5 py-10 text-[14px] text-[#6B7280]">
            불러오는 중...
          </div>
        )}

        {/* 에러 (초기) */}
        {error && items.length === 0 && (
          <div className="px-5 py-10 text-[14px] text-[#EB5147]">{error}</div>
        )}

        {/* 비어 있을 때 */}
        {isEmpty && (
          <div className="px-5 py-16 text-center text-[14px] text-[#9CA3AF]">
            등록된 상품이 없습니다.
          </div>
        )}

        {/* 리스트 */}
        {sortedItems.length > 0 && (
          <div className="pb-3">
            {sortedItems.map((p, i) => (
              <React.Fragment key={p.id}>
                <article className="px-5 pt-4 pb-5">
                  {/* 날짜 + 삭제 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-semibold tracking-[-0.2px] text-[#1E2124]">
                      {formatDateYMD(p.createdAt)}
                    </span>
                    <button
                      type="button"
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      aria-label="delete-card"
                      onClick={() => onDelete(p.id, p.category)}
                    >
                      <Icon
                        icon="meteor-icons:xmark"
                        className="w-5 h-5 text-[#999999]"
                      />
                    </button>
                  </div>

                  {/* 카드 */}
                  <div className="flex gap-4">
                    {/* 썸네일 */}
                    <div className="w-[84px] h-[84px] rounded-[4px] border border-[#F5F5F5] overflow-hidden flex-shrink-0 bg-[#F6F7FB]">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon
                            icon="solar:image-broken-linear"
                            className="w-7 h-7 text-[#C1C1C1]"
                          />
                        </div>
                      )}
                    </div>

                    {/* 텍스트 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-3">
                          <div className="text-[12px] text-[rgba(0,0,0,0.45)] tracking-[-0.2px]">
                            {p.brandName}
                          </div>
                          <div className="mt-1 text-[14px] leading-[20px] tracking-[-0.2px] text-[#1E2124] line-clamp-2 break-words">
                            {p.name}
                          </div>
                        </div>

                        <div className="pt-1 text-[15px] font-semibold text-[#1E2124] whitespace-nowrap">
                          {formatPrice(p.price)}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          {/* 🔹 여기: 상세보기 버튼으로 변경 */}
                          <ActionButton
                            onClick={() => onViewDetail(p)}
                            className="flex-1"
                          >
                            상세보기
                          </ActionButton>
                          <ActionButton
                            onClick={() => onRegisterCoupon(p.id, p.category)}
                            className="flex-1"
                          >
                            쿠폰등록
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                {/* ===== 새로운 구분선 ===== */}
                {i < sortedItems.length - 1 && (
                  <div className="w-full h-2 bg-[#F7F9FA]" />
                )}
              </React.Fragment>
            ))}

            {/* 추가 로딩 표시 (더 불러오는 중일 때) */}
            {loading && items.length > 0 && (
              <div className="py-3 text-center text-[12px] text-[#6B7280]">
                불러오는 중...
              </div>
            )}

            {/* 더 이상 불러올 게 없을 때 표시 (선택) */}
            {!hasMore && !loading && (
              <div className="py-3 text-center text-[12px] text-[#9CA3AF]">
                마지막 상품입니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 우측 하단 플로팅 버튼 (화면 기준 고정) */}
      <button
        type="button"
        onClick={onRegisterProduct}
        className="fixed right-5 bottom-7.5 w-[56px] h-[56px] rounded-full bg-white border border-[#F3F4F5] shadow-[0_4px_4px_rgba(51,51,51,0.12)] flex items-center justify-center active:scale-95 z-30"
        aria-label="add-product"
      >
        <Icon icon="mdi:plus" className="w-7 h-7" />
      </button>
    </div>
  );
}

/** ====== 서브 컴포넌트 ====== */
function ActionButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-[8px] border border-[#E4E4E4] bg-white text-[14px] text-[#333333] flex items-center justify-center ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}
