// src/pages/Owner/Product/Manage/MobileView.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../../components/MyPageHeader";
import api from "../../../../../../lib/api/axios";

/** ====== 타입 ====== */
// 백엔드 category 예시에 WEDDING_HALL 이 있어서 포함
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
  // 나머지 필드들 (starCount, address, availableTime, region, tags...)은 일단 생략
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

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OwnerProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 페이지네이션 파라미터 (스웨거: pageNumber, pageSize)
  const [pageNumber] = useState(1); // 현재는 1페이지 고정
  const [pageSize] = useState(20); // 필요하면 6이나 다른 값으로 변경
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

        // 백엔드 실제 응답을 화면용 OwnerProduct 로 매핑
        const mapped: OwnerProduct[] = (data?.content ?? []).map((p) => ({
          id: p.id,
          name: p.detail, // detail = 상품명(카드 타이틀)
          brandName: p.name, // name = 업체명
          price: p.price,
          thumbnailUrl: p.thumbnail ?? undefined,
          category: p.category as ProductCategory,
          createdAt: p.createdAt,
        }));

        setItems(mapped);
        setPageMeta(data?.page ?? null);
      } catch (e) {
        console.error("[ProductManageMobileView] fetch error:", e);
        setError("상품을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [pageNumber, pageSize]);

  /** 상품 단위로 createdAt 기준 최신순 정렬 */
  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
      ),
    [items]
  );

  /** 삭제 */
  const onDelete = async (id: number) => {
    if (!confirm("이 상품을 삭제하시겠어요?")) return;

    try {
      // 스웨거 DELETE /api/v1/dress/{id} 에 맞춘 삭제 호출
      await api.delete(`/api/v1/dress/${id}`);

      // 로컬 상태에서 삭제
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
      console.error("[delete dress] error:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const onEdit = (id: number) => {
    nav(`/owner/product/${id}/edit`);
  };

  const onRegisterProduct = () => {
    nav("/my-page/owner/product/create");
  };

  /** “쿠폰 등록” 버튼 */
  const onRegisterCoupon = (productId: number, category: ProductCategory) => {
    nav(
      `/my-page/owner/coupons/register?productId=${productId}&category=${category}`
    );
  };

  /** 뷰 */
  return (
    <div className="w-full bg-white">
      {/* 모바일 프레임 390×844 */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#FFFFFF] relative overflow-hidden">
        {/* 헤더*/}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader title="상품 관리" onBack={onBack} showMenu />
        </div>

        {/* 스크롤 영역 */}
        <div className="absolute inset-x-0 bottom-0 top-[60px] bg-white overflow-y-auto">
          {/* 상단 구분선 */}
          <div className="w-full h-2 bg-[#F7F9FA]" />

          {/* 로딩/에러/목록 */}
          {loading ? (
            <div className="px-5 py-10 text-[14px] text-[#6B7280]">
              불러오는 중...
            </div>
          ) : error ? (
            <div className="px-5 py-10 text-[14px] text-[#EB5147]">{error}</div>
          ) : sortedItems.length === 0 ? (
            <div className="px-5 py-16 text-center text-[14px] text-[#9CA3AF]">
              등록된 상품이 없습니다.
            </div>
          ) : (
            <div className="pb-32">
              {sortedItems.map((p) => (
                <article
                  key={p.id}
                  className="px-5 pt-4 pb-5 border-b border-[#F3F4F5]"
                >
                  {/* 상품별 날짜 + X 삭제 버튼 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-semibold tracking-[-0.2px] text-[#1E2124]">
                      {formatDateYMD(p.createdAt)}
                    </span>
                    <button
                      type="button"
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      aria-label="delete-card"
                      onClick={() => onDelete(p.id)}
                    >
                      <Icon
                        icon="meteor-icons:xmark"
                        className="w-5 h-5 text-[#999999]"
                      />
                    </button>
                  </div>

                  {/* 카드 본문: 썸네일 + 텍스트 + 가격 */}
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

                    {/* 텍스트 + 버튼 영역 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-3">
                          {/* 업체명 (응답 name) */}
                          <div className="text-[12px] tracking-[-0.2px] text-[rgba(0,0,0,0.45)]">
                            {p.brandName}
                          </div>
                          {/* 상품명 (응답 detail) */}
                          <div className="mt-1 text-[14px] leading-[20px] tracking-[-0.2px] text-[#1E2124] line-clamp-2 break-words">
                            {p.name}
                          </div>
                        </div>
                        {/* 가격 */}
                        <div className="pt-1 text-[15px] font-semibold text-[#1E2124] whitespace-nowrap">
                          {formatPrice(p.price)}
                        </div>
                      </div>

                      {/* 버튼들 */}
                      <div className="mt-3 space-y-2">
                        {/* 수정 / 쿠폰 등록 */}
                        <div className="flex gap-2">
                          <ActionButton
                            onClick={() => onEdit(p.id)}
                            className="flex-1"
                          >
                            수정하기
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
              ))}
            </div>
          )}

          {/* pageMeta 디버깅 필요하면 아래 주석 해제 */}
          {/* <pre className="px-5 py-4 text-xs text-gray-400">
            {JSON.stringify(pageMeta, null, 2)}
          </pre> */}
        </div>

        {/* 오른쪽 아래 플로팅 상품 등록 버튼 */}
        <button
          type="button"
          onClick={onRegisterProduct}
          className="absolute right-5 bottom-24 w-[56px] h-[56px] rounded-full bg-white border border-[#F3F4F5] shadow-[0_4px_4px_rgba(51,51,51,0.12)] flex items-center justify-center active:scale-95 z-30"
          aria-label="add-product"
        >
          <Icon icon="mdi:plus" className="w-7 h-7" />
        </button>
      </div>
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
