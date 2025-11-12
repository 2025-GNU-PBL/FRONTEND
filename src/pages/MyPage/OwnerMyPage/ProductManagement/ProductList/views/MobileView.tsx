// src/pages/Owner/Product/Manage/MobileView.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../../components/MyPageHeader";
import api from "../../../../../../lib/api/axios";

/** ====== 타입 ====== */
type ProductCategory = "WEDDING" | "STUDIO" | "DRESS" | "MAKEUP";

type OwnerProduct = {
  id: number;
  name: string; // 카드 타이틀
  brandName: string; // 업체명
  price: number; // 원 단위
  thumbnailUrl?: string; // 썸네일
  category: ProductCategory;
  createdAt: string; // ISO (YYYY-MM-DDTHH:mm:ss)
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

/** ====== 컴포넌트 ====== */
export default function ProductManageMobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OwnerProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** 목록 조회 */
  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);
        // API 엔드포인트는 프로젝트에 맞춰 조정하세요.
        const { data } = await api.get<OwnerProduct[]>(
          "/api/v1/owner/products"
        );
        setItems(data ?? []);
      } catch (e) {
        console.error("[ProductManageMobileView] fetch error:", e);
        setError("상품을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  /** 날짜(YYYY.MM.DD) 기준 그룹핑 */
  const grouped = useMemo(() => {
    const map = new Map<string, OwnerProduct[]>();
    for (const it of items) {
      const key = formatDateYMD(it.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    // 최신일자 먼저
    return Array.from(map.entries()).sort(
      (a, b) =>
        +new Date(b[0].replaceAll(".", "-")) -
        +new Date(a[0].replaceAll(".", "-"))
    );
  }, [items]);

  /** 액션 */
  const onDelete = async (id: number) => {
    if (!confirm("이 상품을 삭제하시겠어요?")) return;
    try {
      await api.delete(`/api/v1/owner/product/${id}`);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("[delete product] error:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const onEdit = (id: number) => {
    nav(`/owner/product/${id}/edit`);
  };

  const onRegisterProduct = () => {
    nav("/owner/product/new");
  };

  /** 요청: “쿠폰 등록” 버튼 추가 */
  const onRegisterCoupon = (productId: number, category: ProductCategory) => {
    // 쿠폰 등록 화면으로 이동 (필요 파라미터는 프로젝트에 맞춰 수정)
    nav(`/owner/coupon/new?productId=${productId}&category=${category}`);
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
          {/* 구분 영역 상단 얇은 그레이 바 */}
          <div className="w-full h-2 bg-[#F7F9FA]" />

          {/* 로딩/에러/목록 */}
          {loading ? (
            <div className="px-5 py-10 text-[14px] text-[#6B7280]">
              불러오는 중...
            </div>
          ) : error ? (
            <div className="px-5 py-10 text-[14px] text-[#EB5147]">{error}</div>
          ) : items.length === 0 ? (
            <div className="px-5 py-16 text-center text-[14px] text-[#9CA3AF]">
              등록된 상품이 없습니다.
            </div>
          ) : (
            <div className="pb-24">
              {grouped.map(([date, list], gi) => (
                <section key={date + gi} className={gi === 0 ? "pt-4" : "pt-6"}>
                  {/* 날짜 행 + 닫기 아이콘 자리(아이콘은 시각적만, 기능X) */}
                  <div className="px-5 flex items-center justify-between h-[29px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-semibold tracking-[-0.2px] text-[#1E2124]">
                        {date}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      aria-label="close-group"
                    >
                      <Icon
                        icon="meteor-icons:xmark"
                        className="w-5 h-5 text-[#999999]"
                      />
                    </button>
                  </div>

                  {/* 카드 리스트 */}
                  <div className={gi === 0 ? "mt-2" : "mt-4"}>
                    {list.map((p) => (
                      <article
                        key={p.id}
                        className="px-5 py-4 border-b border-[#F3F4F5]"
                      >
                        {/* 카드 헤더 + 가격 */}
                        <div className="flex gap-4">
                          {/* 썸네일 */}
                          <div className="w-20 h-20 rounded-[4px] border border-[#F5F5F5] overflow-hidden flex-shrink-0">
                            {p.thumbnailUrl ? (
                              <img
                                src={p.thumbnailUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#F6F7FB] flex items-center justify-center">
                                <Icon
                                  icon="solar:image-broken-linear"
                                  className="w-6 h-6 text-[#C1C1C1]"
                                />
                              </div>
                            )}
                          </div>

                          {/* 텍스트 영역 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 pr-3">
                                <div className="text-[14px] text-[rgba(0,0,0,0.4)]">
                                  {p.brandName}
                                </div>
                                <div className="mt-1 text-[14px] leading-[21px] tracking-[-0.2px] text-[#1E2124] line-clamp-2">
                                  {p.name}
                                </div>
                              </div>
                              <div className="text-[16px] font-semibold text-[#1E2124] whitespace-nowrap">
                                {formatPrice(p.price)}
                              </div>
                            </div>

                            {/* 액션 버튼들 */}
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <ActionButton onClick={() => onDelete(p.id)}>
                                삭제하기
                              </ActionButton>
                              <ActionButton onClick={() => onEdit(p.id)}>
                                수정하기
                              </ActionButton>
                              {/* 요청사항: 쿠폰 등록 버튼 추가 */}
                              <ActionButton
                                onClick={() =>
                                  onRegisterCoupon(p.id, p.category)
                                }
                              >
                                쿠폰 등록
                              </ActionButton>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* 플로팅 버튼: 상품 추가 (+) */}
        <button
          type="button"
          onClick={onRegisterProduct}
          className="absolute right-5 bottom-6 w-[54px] h-[54px] rounded-[40px] bg-white border border-[#F3F4F5] shadow-[0_4px_4px_rgba(51,51,51,0.1)] flex items-center justify-center active:scale-95"
          aria-label="add-product"
        >
          <Icon icon="solar:plus-linear" className="w-6 h-6 text-black" />
        </button>
      </div>
    </div>
  );
}

/** ====== 서브 컴포넌트 ====== */
function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 px-4 rounded-[8px] border border-[#E4E4E4] bg-white text-[14px] text-[#333333] flex items-center justify-center"
    >
      {children}
    </button>
  );
}
