import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../../../components/SideMenu";
import type { Product } from "../../../type/product";

type CategoryKey = "hall" | "studio" | "dress" | "makeup";
type Category = { key: CategoryKey; label: string; icon: string };

type Props = {
  active: CategoryKey;
  setActive: (key: CategoryKey) => void;
  categories: Category[];
  products: Product[];
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

// 🎨 디자인 토큰
const PRIMARY_COLOR = "bg-[#9370DB]";
const PRIMARY_COLOR_TEXT = "text-[#7B61D1]";
const CTA_DARK_BG = "bg-slate-900";
const ACCENT_COLOR_HOVER = "hover:bg-[#F2EEFB]";
const PLACEHOLDER = "/images/placeholder.png";

export default function WebView({
  active,
  setActive,
  categories,
  products,
  isMenuOpen,
  openMenu,
  closeMenu,
}: Props) {
  const navigate = useNavigate();
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const shouldScroll = safeProducts.length > 9;

  const handleSelect = (key: CategoryKey) => setActive(key);

  const formatPrice = (price?: number) =>
    typeof price === "number" && !Number.isNaN(price)
      ? `${price.toLocaleString("ko-KR")}원`
      : null;

  const shortAddress = (addr?: string) =>
    typeof addr === "string" && addr.trim()
      ? addr.split(" ").slice(0, 2).join(" ")
      : "";

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[15px] text-black/80">
      {/* 상단 공백(데스크톱 네비 높이 보정) */}
      <div className="hidden h-16 md:block" />

      {/* 모바일 상단 검색/메뉴 */}
      <div className="sticky top-0 z-10 w-full border-b border-black/5 bg-white/70 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-6">
          <div className="flex h-11 w-[calc(100%-60px)] items-center rounded-xl bg-[#F3F4F5] px-4 focus-within:ring-2 focus-within:ring-[#9370DB]/70">
            <Icon icon="tabler:search" className="mr-2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="검색어를 입력해주세요"
              aria-label="검색 입력"
              className="h-full w-full bg-transparent text-sm text-gray-700 placeholder-[#C9CBD1] focus:outline-none"
            />
          </div>
          <button
            aria-label="사이드메뉴 열기"
            onClick={openMenu}
            className="ml-2 shrink-0 rounded-lg p-2 transition hover:bg-black/5 active:scale-95"
          >
            <Icon icon="mynaui:menu" className="h-6 w-6 text-black/80" />
          </button>
        </div>
      </div>

      {/* 본문 */}
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-8">
        {/* 히어로 CTA */}
        <section className="mb-10">
          <button
            onClick={() => navigate("/quotation")}
            className={`group relative flex w-full justify-between overflow-hidden rounded-3xl p-8 text-left text-white shadow-xl transition duration-300 ${CTA_DARK_BG} hover:shadow-2xl hover:scale-[1.004] active:scale-[0.995] md:p-10`}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'url("/images/pattern.svg")',
                backgroundSize: "cover",
              }}
            />
            <div className="relative z-10 flex flex-col items-start">
              <div className="flex items-center text-xl font-extrabold md:text-2xl">
                <Icon
                  icon="solar:star-fall-bold"
                  className="mr-3 h-7 w-7 text-yellow-300 md:h-8 md:w-8"
                />
                <span className="leading-tight">
                  <strong>나만의 맞춤 견적</strong>, 1분 만에 받아보세요
                </span>
              </div>
              <p className="mt-2 text-sm text-white/85 md:text-base">
                조건만 입력하면 AI가 최적 플랜을 제안합니다.
              </p>
            </div>
            <div className="relative z-10 ml-4 flex shrink-0 items-center">
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="h-8 w-8 transition duration-300 group-hover:translate-x-1"
              />
            </div>
          </button>
        </section>

        {/* 타이틀 */}
        <section className="mb-4">
          <h2 className="text-2xl font-bold">
            <span className={`mr-1 ${PRIMARY_COLOR_TEXT}`}>2030</span>
            <span className={PRIMARY_COLOR_TEXT}>신부님</span>
            <span className="mr-1 text-black/80">들의</span>
            <span className="text-black/90">PICK</span>
          </h2>
        </section>

        {/* 카테고리 탭 */}
        <section className="mb-6">
          <div className="flex flex-wrap gap-2">
            {safeCategories.map((c) => {
              const isActive = active === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelect(c.key)}
                  className={[
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#7B61D1] text-white shadow-md ring-1 ring-[#6F55C4]"
                      : "border border-[#E6E2F6] bg-[#F7F5FF] text-[#5C4AA8] hover:bg-[#F1EDFF]",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 상품 그리드 + 사이드 */}
        <section className="grid grid-cols-12 gap-6">
          {/* 상품 그리드 */}
          <div className="col-span-12 lg:col-span-8">
            <div
              className={[
                "relative",
                shouldScroll
                  ? "max-h-[980px] overflow-y-auto pr-1 scrollbar-hide lg:max-h-[820px]"
                  : "",
              ].join(" ")}
              aria-label="상품 목록"
              aria-live="polite"
              style={
                shouldScroll
                  ? ({
                      scrollbarGutter: "stable both-edges",
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-3">
                {safeProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => navigate(`/product/${p.id}`)}
                    formatPrice={formatPrice}
                    shortAddress={shortAddress}
                  />
                ))}
              </div>

              {shouldScroll && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>

            <p className="sr-only">
              상품은 한 화면에 최대 9개까지 보여지며, 더 많은 상품은 스크롤하여
              볼 수 있습니다.
            </p>
          </div>

          {/* 오른쪽 사이드 */}
          <aside className="col-span-12 lg:col-span-4">
            <button
              className={`w-full rounded-2xl ${PRIMARY_COLOR} p-5 text-white shadow-md transition duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`}
              onClick={() => navigate("/card-discount")}
            >
              <div className="flex items-center justify-between text-left">
                <div className="flex items-center">
                  <img
                    src="/images/credit.png"
                    alt="credit"
                    className="mr-3 h-9"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = "0";
                    }}
                  />
                  <span className="text-base font-semibold">
                    신용카드 할인 알아보기
                  </span>
                </div>
                <Icon icon="solar:alt-arrow-right-linear" className="h-6 w-6" />
              </div>
            </button>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold">오늘의 소식</h3>
                <button
                  className="text-[14px] text-[#7B61D1] font-medium hover:underline"
                  onClick={() => navigate("/news")}
                >
                  더보기{" "}
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="inline h-4 w-4"
                  />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    img: "/images/t1.png",
                    cat: "메이크업",
                    title: "요즘 신부 메이크업 트렌드",
                  },
                  {
                    img: "/images/t2.png",
                    cat: "드레스",
                    title: "2025 신상 드레스 컬렉션",
                  },
                  {
                    img: "/images/t3.png",
                    cat: "스튜디오",
                    title: "인생샷 스튜디오 포즈 10",
                  },
                ].map((t, index) => (
                  <button
                    key={index}
                    className={`flex w-full items-center rounded-xl p-2 text-left transition ${ACCENT_COLOR_HOVER} active:scale-[0.99]`}
                    onClick={() => navigate("/news/detail/" + index)}
                  >
                    <img
                      src={t.img}
                      alt={t.title}
                      className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover shadow-sm"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                      }}
                    />
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-[#7B61D1]">
                        {t.cat}
                      </h4>
                      <p className="line-clamp-2 text-[15px] font-medium text-black/80">
                        {t.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>

      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </div>
  );
}

/* =========================
   ProductCard (개선 디자인)
   ========================= */
function ProductCard({
  product,
  onClick,
  formatPrice,
  shortAddress,
}: {
  product: Product;
  onClick: () => void;
  formatPrice: (n?: number) => string | null;
  shortAddress: (s?: string) => string;
}) {
  const imgSrc =
    product.thumbnail && product.thumbnail.trim()
      ? product.thumbnail
      : PLACEHOLDER;
  const priceText = formatPrice(product.price);
  const addrText = shortAddress(product.address);
  const tags =
    Array.isArray(product.tags) && product.tags.length > 0
      ? product.tags.slice(0, 2)
      : [];

  return (
    <article
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#F0EEF8] bg-white shadow-[0_1px_10px_rgba(124,97,209,0.06)] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(124,97,209,0.18)]"
      onClick={onClick}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={imgSrc}
          alt={product.name || "상품 이미지"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
        {/* 그라데이션 상·하단 오버레이 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* 우상단 퀵 아이콘 */}
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span className="rounded-full bg-white/90 p-2 shadow hover:bg-white">
            <Icon icon="solar:heart-linear" className="h-4 w-4 text-black/70" />
          </span>
          <span className="rounded-full bg-white/90 p-2 shadow hover:bg-white">
            <Icon icon="solar:eye-linear" className="h-4 w-4 text-black/70" />
          </span>
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div className="space-y-2 px-3.5 pb-3.5 pt-3">
        {/* 제목 */}
        <h3 className="line-clamp-2 text-[15px] font-semibold text-black/85">
          {product.name ?? "이름 미정"}
        </h3>

        {/* 부제(디테일) */}
        {product.detail ? (
          <p className="line-clamp-1 text-[12.5px] text-black/50">
            {product.detail}
          </p>
        ) : null}

        {/* 태그 칩 (최대 2개) */}
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.map((t, i) => (
              <span
                key={t.id ?? `${product.id}-tag-${i}`}
                className="inline-flex items-center gap-1 rounded-full border border-[#E8E6F6] bg-[#F9F8FF] px-2.5 py-1 text-[11px] font-medium text-[#5C4AA8]"
              >
                <Icon icon="solar:hashtag-bold" className="h-3.5 w-3.5" />
                {t.tagName}
              </span>
            ))}
          </div>
        )}

        {/* 메타: 주소/별점/가격 */}
        <div className="mt-1.5 flex items-end justify-between">
          <div className="min-w-0">
            <div className="flex items-center text-[12px] text-black/60">
              {addrText && (
                <>
                  <Icon
                    icon="solar:map-point-bold"
                    className="mr-1 h-3.5 w-3.5"
                  />
                  <span className="truncate">{addrText}</span>
                  <span className="mx-1.5 text-black/20">|</span>
                </>
              )}
              <Icon
                icon="solar:star-bold"
                className="mr-1 h-3.5 w-3.5 text-yellow-500"
              />
              <span className="font-semibold">
                {typeof product.starCount === "number"
                  ? product.starCount
                  : "-"}
              </span>
            </div>
          </div>

          {priceText && (
            <span className="ml-3 shrink-0 rounded-full bg-[#FFF1F1] px-2.5 py-1 text-[12.5px] font-bold text-[#DF3B3B] shadow-sm">
              {priceText}
            </span>
          )}
        </div>
      </div>

      {/* 포커스 링 */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-[#7B61D1]/40 transition group-hover:ring-2" />
    </article>
  );
}
