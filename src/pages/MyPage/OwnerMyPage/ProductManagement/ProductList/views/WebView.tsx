// src/pages/MyPage/OwnerMyPage/ProductManagement/ProductList/views/WebView.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../../components/MyPageHeader";
import api from "../../../../../../lib/api/axios";

/** ====== 타입 ====== */
// 모바일 뷰와 동일하게 WEDDING_HALL 포함
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

/** 백엔드 실제 응답 DTO 타입 (모바일 뷰와 동일) */
type ApiOwnerProduct = {
  id: number;
  name: string; // 업체명
  detail: string; // 상품명
  price: number;
  thumbnail: string | null;
  category: string;
  createdAt: string;
  // starCount, address, availableTime, region, tags... 등은 생략
};

// 스웨거 예시 DTO에 맞춘 페이지 응답 타입
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

/** ====== 웹 뷰 ====== */
export default function WebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OwnerProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 페이지네이션 파라미터 (스웨거: pageNumber, pageSize)
  const [pageNumber] = useState(1); // 현재는 1페이지 고정
  const [pageSize] = useState(20);
  const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);

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

        // ✅ 백엔드 응답을 화면용 타입으로 매핑 (모바일과 동일)
        const mapped: OwnerProduct[] = (data?.content ?? []).map((p) => ({
          id: p.id,
          name: p.detail, // detail = 상품명
          brandName: p.name, // name = 업체명
          price: p.price,
          thumbnailUrl: p.thumbnail ?? undefined,
          category: p.category as ProductCategory,
          createdAt: p.createdAt,
        }));

        setItems(mapped);
        setPageMeta(data?.page ?? null);
      } catch (e) {
        console.error("[ProductManageWebView] fetch error:", e);
        setError("상품을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [pageNumber, pageSize]);

  /** 날짜 기준 최신순 정렬 (상품 단위) */
  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
      ),
    [items]
  );

  /** 액션 */
  const onDelete = async (id: number) => {
    if (!confirm("이 상품을 삭제하시겠어요?")) return;
    try {
      await api.delete(`/api/v1/product/${id}`);
      setItems((prev) => prev.filter((p) => p.id !== id));
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

  const onEdit = (id: number) => {
    nav(`/owner/product/${id}/edit`);
  };

  const onRegisterProduct = () => {
    nav("/my-page/owner/product/create");
  };

  /** “쿠폰 등록” 버튼 (모바일과 동일 경로) */
  const onRegisterCoupon = (productId: number, category: ProductCategory) => {
    nav(
      `/my-page/owner/coupons/register?productId=${productId}&category=${category}`
    );
  };

  const hasItems = sortedItems.length > 0;

  /** ====== 뷰 ====== */
  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 상단 공통 헤더 영역 */}
      <div className="w-full bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1040px] mx-auto">
          <MyPageHeader title="상품 관리" onBack={onBack} showMenu />
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-[1040px] mt-20 mx-auto px-6 py-8">
        {/* 상단 타이틀/설명 */}
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

        {/* 메인 카드 영역 */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          {loading && (
            <div className="flex items-center justify-center h-[240px]">
              <p className="text-[14px] text-[#6B7280]">
                상품 목록을 불러오는 중입니다...
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
                아직 등록된 상품이 없어요. 상단의 상품 등록 버튼을 눌러 첫
                상품을 추가해 보세요.
              </p>
            </div>
          )}

          {!loading && !error && hasItems && (
            <div className="flex flex-col gap-4">
              {sortedItems.map((p) => (
                <ProductRow
                  key={p.id}
                  item={p}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onRegisterCoupon={onRegisterCoupon}
                />
              ))}

              {pageMeta && (
                <div className="mt-4 flex justify-end text-[12px] text-[#9CA3AF]">
                  <span>
                    총 {pageMeta.totalElements.toLocaleString()}개 /{" "}
                    {pageMeta.totalPages}페이지
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** ====== 서브 컴포넌트 ====== */

function ProductRow({
  item,
  onDelete,
  onEdit,
  onRegisterCoupon,
}: {
  item: OwnerProduct;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onRegisterCoupon: (id: number, category: ProductCategory) => void;
}) {
  return (
    <article className="w-full border border-[#E5E7EB] rounded-xl bg-white px-5 py-4 flex flex-col gap-3">
      {/* 상단: 날짜 / 더보기 아이콘 */}
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[rgba(0,0,0,0.45)] tracking-[-0.2px]">
          등록일 {formatDateYMD(item.createdAt)}
        </div>
        <button
          type="button"
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#F3F4F6]"
          aria-label="상품 더보기"
        >
          <Icon
            icon="solar:menu-dots-bold"
            className="w-4 h-4 text-[#9CA3AF]"
          />
        </button>
      </div>

      {/* 중간: 썸네일 + 정보 + 가격 */}
      <div className="flex items-stretch gap-4">
        {/* 썸네일 */}
        <div className="w-[96px] h-[96px] rounded-[6px] border border-[#F3F4F6] bg-[#F9FAFB] overflow-hidden flex-shrink-0">
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

        {/* 텍스트 영역 */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[13px] leading-[19px] text-[rgba(0,0,0,0.45)] tracking-[-0.2px]">
              {item.brandName}
            </p>
            <p className="mt-1 text-[15px] leading-[22px] text-[#1E2124] tracking-[-0.2px] line-clamp-2 break-words">
              {item.name}
            </p>
          </div>
          <p className="mt-2 text-[16px] leading-[24px] font-semibold text-[#111827] tracking-[-0.2px]">
            {formatPrice(item.price)}
          </p>
        </div>

        {/* 액션 버튼 세트 (세로) */}
        <div className="flex flex-col justify-between items-end gap-2 ml-2">
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            className="px-3 py-1.5 rounded-[999px] border border-[#E5E7EB] bg-white text-[12px] text-[#374151] tracking-[-0.2px] hover:bg-[#F9FAFB]"
          >
            상품 수정
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="px-3 py-1.5 rounded-[999px] border border-[#FFE2E5] bg-[#FFF5F6] text-[12px] text-[#DC2626] tracking-[-0.2px] hover:bg-[#FFECEF]"
          >
            삭제하기
          </button>
          <button
            type="button"
            onClick={() => onRegisterCoupon(item.id, item.category)}
            className="px-3 py-1.5 rounded-[999px] bg-[#FF2233] text-white text-[12px] font-medium tracking-[-0.2px] hover:opacity-90"
          >
            쿠폰 등록
          </button>
        </div>
      </div>
    </article>
  );
}
