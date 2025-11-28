// src/pages/MyPage/OwnerMyPage/ProductManagement/ProductList/views/WebView.tsx

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../../lib/api/axios";
import { toast } from "react-toastify"; // ⭐ 추가

/** ====== 타입 ====== */
type ProductCategory =
  | "WEDDING"
  | "STUDIO"
  | "DRESS"
  | "MAKEUP"
  | "WEDDING_HALL";

type OwnerProduct = {
  id: number;
  name: string;
  brandName: string;
  price: number;
  thumbnailUrl?: string;
  category: ProductCategory;
  createdAt: string;
};

type ApiOwnerProduct = {
  id: number;
  name: string;
  detail: string;
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

const CATEGORY_SLUG_MAP: Record<ProductCategory, string> = {
  WEDDING_HALL: "wedding-hall",
  WEDDING: "wedding-hall",
  STUDIO: "studio",
  DRESS: "dress",
  MAKEUP: "makeup",
};

const DELETE_ENDPOINT_MAP: Record<ProductCategory, string> = {
  WEDDING_HALL: "/api/v1/wedding-hall",
  WEDDING: "/api/v1/wedding-hall",
  STUDIO: "/api/v1/studio",
  DRESS: "/api/v1/dress",
  MAKEUP: "/api/v1/makeup",
};

/** ====== 유틸 ====== */
const formatDateYMD = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
};

const formatPrice = (n: number) => (n ?? 0).toLocaleString("ko-KR") + "원";

/** ====== 웹 뷰 ====== */
export default function WebView() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OwnerProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [pageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);

  /** 삭제 모달용 */
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    category: ProductCategory;
  } | null>(null);

  const openDeleteModal = (id: number, category: ProductCategory) => {
    setDeleteTarget({ id, category });
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  /** 목록 조회 */
  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<ApiOwnerProductPageResponse>(
          "/api/v1/product",
          {
            params: { pageNumber, pageSize },
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

        setItems(mapped);
        setPageMeta(data?.page ?? null);
      } catch (e) {
        console.error("[ProductManageWebView] fetch error:", e);
        toast.error("상품을 불러오는 중 오류가 발생했어요.");
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

  /** 실제 삭제 */
  const deleteProduct = async (id: number, category: ProductCategory) => {
    const endpoint = DELETE_ENDPOINT_MAP[category];

    if (!endpoint) {
      toast.error("삭제할 수 없는 카테고리입니다.");
      return;
    }

    try {
      await api.delete(`${endpoint}/${id}`);
      setItems((prev) => prev.filter((p) => p.id !== id));

      setPageMeta((prev) =>
        prev
          ? { ...prev, totalElements: Math.max(prev.totalElements - 1, 0) }
          : prev
      );

      toast.success("상품이 삭제되었습니다.");
    } catch (e) {
      console.error("[delete product] error:", e);
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id, deleteTarget.category);
    closeDeleteModal();
  };

  /* 상세보기 */
  const onViewDetail = (product: OwnerProduct) => {
    const slug = CATEGORY_SLUG_MAP[product.category];

    if (!slug) {
      toast.error("알 수 없는 카테고리의 상품입니다.");
      return;
    }

    nav(`/my-page/owner/products/${slug}/${product.id}`, {
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

  const hasItems = sortedItems.length > 0;

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB] mt-15">
      {/* 본문 */}
      <div className="max-w-[1040px] mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">
              등록된 상품을 관리하세요
            </h1>
            <p className="mt-1 text-[13px] text-[#6B7280] tracking-[-0.2px]">
              등록한 상품의 가격, 정보, 쿠폰 발급을 한 화면에서 관리할 수
              있어요.
            </p>
          </div>

          <button
            type="button"
            onClick={onRegisterProduct}
            className="h-[40px] px-4 rounded-[999px] bg-[#111827] text-white text-[13px] font-medium tracking-[-0.2px] flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Icon icon="solar:plus-linear" className="w-4 h-4" />
            상품 등록
          </button>
        </div>

        {/* 카드 영역 */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          {loading && (
            <div className="flex items-center justify-center h-[240px]">
              <p className="text-[14px] text-[#6B7280]">
                상품을 불러오는 중...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center h-[240px] border border-red-200 rounded-2xl">
              <p className="text-[14px] text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && !hasItems && (
            <div className="flex flex-col items-center justify-center h-[260px] rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
              <Icon
                icon="mdi:file-document-outline"
                className="w-14 h-14 mb-3 text-[#D9D9D9]"
              />
              <p className="text-[14px] text-[#777777] tracking-[-0.2px]">
                등록된 상품이 없어요. 상단의 상품 등록 버튼을 눌러 추가하세요.
              </p>
            </div>
          )}

          {!loading && !error && hasItems && (
            <div className="flex flex-col gap-4">
              {sortedItems.map((p) => (
                <ProductRow
                  key={p.id}
                  item={p}
                  onDelete={(id, category) => openDeleteModal(id, category)}
                  onViewDetail={onViewDetail}
                  onRegisterCoupon={onRegisterCoupon}
                />
              ))}

              {pageMeta && (
                <div className="mt-4 flex justify-end text-[12px] text-[#9CA3AF]">
                  총 {pageMeta.totalElements.toLocaleString()}개 /{" "}
                  {pageMeta.totalPages}페이지
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(0,0,0,0.45)]">
          <div className="w-[335px] h-[164px] bg-white shadow-[4px_4px_10px_rgba(0,0,0,0.06)] rounded-[14px] flex flex-col justify-between">
            <div className="flex flex-col items-start px-5 pt-6 gap-[10px]">
              <span className="text-[16px] font-bold text-[#1E2124]">
                상품을 삭제하시겠어요?
              </span>
              <p className="text-[14px] font-medium text-[#9D9D9D]">
                삭제된 상품은 복구할 수 없습니다.
              </p>
            </div>

            <div className="flex flex-row items-center px-5 pb-6 pt-[10px] gap-[10px]">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 h-11 rounded-[10px] bg-[#F3F4F5] text-[#999999] text-[14px] font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 h-11 rounded-[10px] bg-[#FF2233] text-white text-[14px] font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** ====== 서브 컴포넌트 ====== */
function ProductRow({
  item,
  onDelete,
  onViewDetail,
  onRegisterCoupon,
}: {
  item: OwnerProduct;
  onDelete: (id: number, category: ProductCategory) => void;
  onViewDetail: (product: OwnerProduct) => void;
  onRegisterCoupon: (id: number, category: ProductCategory) => void;
}) {
  return (
    <article className="w-full border border-[#E5E7EB] rounded-xl bg-white px-5 py-4 flex flex-col gap-3">
      <div className="text-[13px] text-[rgba(0,0,0,0.45)]">
        등록일 {formatDateYMD(item.createdAt)}
      </div>

      <div className="flex items-stretch gap-4">
        <div className="w-[96px] h-[96px] rounded-[6px] border border-[#F3F4F6] bg-[#F9FAFB] overflow-hidden">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.name}
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

        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[13px] text-[rgba(0,0,0,0.45)]">
              {item.brandName}
            </p>
            <p className="mt-1 text-[15px] text-[#1E2124] line-clamp-2 break-words">
              {item.name}
            </p>
          </div>

          <p className="text-[16px] font-semibold text-[#111827]">
            {formatPrice(item.price)}
          </p>
        </div>

        <div className="flex flex-col justify-between items-end gap-2">
          <button
            type="button"
            onClick={() => onViewDetail(item)}
            className="px-3 py-1.5 rounded-[999px] border border-[#E5E7EB] bg-white text-[12px] text-[#374151] hover:bg-[#F9FAFB]"
          >
            상세보기
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id, item.category)}
            className="px-3 py-1.5 rounded-[999px] border border-[#FFE2E5] bg-[#FFF5F6] text-[12px] text-[#DC2626] hover:bg-[#FFECEF]"
          >
            삭제하기
          </button>
          <button
            type="button"
            onClick={() => onRegisterCoupon(item.id, item.category)}
            className="px-3 py-1.5 rounded-[999px] bg-[#FF2233] text-white text-[12px] font-medium hover:opacity-90"
          >
            쿠폰 등록
          </button>
        </div>
      </div>
    </article>
  );
}
