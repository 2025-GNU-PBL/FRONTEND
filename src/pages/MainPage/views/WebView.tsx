// src/pages/MainPage/views/WebView.tsx
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../../../components/SideMenu";

type CategoryKey = "hall" | "studio" | "dress" | "makeup";

type Product = {
  id: string;
  title: string;
  image: string;
  subtitle?: string;
  price?: string;
  tag?: string;
  avg_star?: number;
  address?: string;
};

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

// 🎨 색상 변수
const PRIMARY_COLOR = "bg-[#9370DB]"; // 메인 배경색 (신용카드 배너, 활성 탭)
// [수정] CTA 그라데이션 변수 제거
const CTA_DARK_BG = "bg-slate-800"; // 프리미엄 다크 CTA 배경
const ACCENT_COLOR_TEXT = "text-[#9370DB]"; // 메인 텍스트 색상
const PRIMARY_COLOR_HEX = "#9370DB"; // 포커스 링 등에 사용할 HEX 값
const HOVER_SHADOW = "hover:shadow-lg";
const ACCENT_COLOR_HOVER = "hover:bg-[#EBE7F7]"; // 라이트 퍼플 호버 배경

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
  const handleSelect = (key: CategoryKey) => setActive(key);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const shouldScroll = safeProducts.length > 9;

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[15px] text-black/80">
      {/* 1. 데스크톱(Navbar) 높이 확보 */}
      <div className="hidden h-16 md:block"></div>

      {/* 2. 상단 행: 검색 + 메뉴 버튼 (모바일/태블릿) */}
      <div className="sticky top-0 z-10 w-full border-b border-black/5 bg-white/70 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-6">
          <div
            className={`flex h-11 w-[calc(100%-60px)] items-center rounded-[10px] bg-[#F3F4F5] px-4 focus-within:ring-2 focus-within:ring-[${PRIMARY_COLOR_HEX}]`}
          >
            <Icon icon="tabler:search" className="mr-2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="검색어를 입력해주세요"
              aria-label="검색 입력"
              className="h-full w-full bg-transparent text-sm text-gray-700 placeholder-[#D9D9D9] focus:outline-none"
            />
          </div>
          <button
            aria-label="사이드메뉴 열기"
            onClick={openMenu}
            className={`ml-2 shrink-0 rounded-md p-2 transition ${ACCENT_COLOR_HOVER} active:scale-95`}
          >
            <Icon icon="mynaui:menu" className="h-6 w-6 text-black/80" />
          </button>
        </div>
      </div>

      {/* 본문 */}
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-8">
        {/* ⭐️ 견적 CTA 카드: [수정 적용] '프리미엄 다크' 테마로 변경 */}
        <section className="mb-10">
          <button
            onClick={() => navigate("/quotation")}
            className={`group relative flex w-full justify-between overflow-hidden rounded-[24px] p-8 text-left text-white shadow-xl transition duration-300 ${CTA_DARK_BG} hover:scale-[1.005] hover:shadow-2xl active:scale-[0.995] md:p-10`}
          >
            {/* 배경 패턴 (어두운 배경에 맞게 opacity 조절) */}
            <div
              className="absolute inset-0 opacity-10" // 15 -> 10으로 (패턴이 밝은색 SVG라고 가정)
              style={{
                backgroundImage: 'url("/images/pattern.svg")',
                backgroundSize: "cover",
              }}
            ></div>

            {/* 텍스트 컨텐츠 */}
            <div className="relative z-10 flex flex-col items-start justify-center">
              <div className="flex items-center text-xl font-extrabold md:text-2xl">
                {/* 노란색 별 아이콘이 다크 배경에서 돋보임 */}
                <Icon
                  icon="solar:star-fall-bold"
                  className="h-7 w-7 mr-3 text-yellow-300 md:h-8 md:w-8"
                />
                <span className="leading-tight">
                  **나만의 맞춤 견적**, 지금 바로 1분 만에 확인하세요!
                </span>
              </div>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                복잡한 웨딩 준비, 조건만 입력하면 AI가 최적의 플랜을 제시합니다.
              </p>
            </div>

            {/* 우측 화살표/아이콘 */}
            <div className="relative z-10 flex items-center shrink-0 ml-4">
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="h-8 w-8 transition duration-300 group-hover:translate-x-1"
              />
            </div>
          </button>
        </section>

        {/* 섹션 타이틀 */}
        <section className="mb-4">
          <div className="text-2xl font-bold">
            <span className={`mr-1 ${ACCENT_COLOR_TEXT}`}>2030</span>
            <span className={ACCENT_COLOR_TEXT}>신부님</span>
            <span className="mr-1 text-black/80">들의</span>
            <span className="text-black/80">PICK</span>
          </div>
        </section>

        {/* 카테고리 토글 */}
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
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm",
                    isActive
                      ? `${PRIMARY_COLOR} text-white ${HOVER_SHADOW}`
                      : `border border-[#D9D9D9] text-black ${ACCENT_COLOR_HOVER}`,
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 본문 그리드: 상품 목록 + 사이드 정보 */}
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
                  <article
                    key={p.id}
                    className="group cursor-pointer overflow-hidden rounded-[16px] bg-white shadow-sm transition duration-300 hover:shadow-xl active:scale-[0.99]"
                  >
                    <div className="relative h-[200px] w-full overflow-hidden rounded-t-[16px] bg-[#F3F4F5]">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                      {p.tag && (
                        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                          {p.tag}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      {/* 제목 */}
                      <p className="line-clamp-2 text-[16px] font-semibold text-black/80">
                        {p.title}
                      </p>

                      {/* 부제 */}
                      {p.subtitle && (
                        <p className="mt-0.5 line-clamp-1 text-[13px] text-black/50">
                          {p.subtitle}
                        </p>
                      )}

                      {/* 별점/주소/가격 */}
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="flex items-center text-black/60">
                          {p.address
                            ? p.address.split(" ").slice(0, 2).join(" ")
                            : ""}
                          {p.address && (
                            <span className="mx-1.5 text-black/20">|</span>
                          )}
                          <Icon
                            icon="solar:star-bold"
                            className="mr-1 inline-block h-4 w-4 text-yellow-500"
                          />
                          <span className="font-bold">{p.avg_star ?? "-"}</span>
                        </div>
                        {p.price && (
                          <span className="text-[16px] font-bold text-red-500">
                            {p.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
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

          {/* 사이드: 할인 배너 + 오늘의 소식 */}
          <aside className="col-span-12 lg:col-span-4">
            {/* 카드 할인 배너 (보라색 단색 유지) */}
            <button
              className={`w-full rounded-[16px] ${PRIMARY_COLOR} p-5 text-white shadow-md transition duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`}
              onClick={() => navigate("/card-discount")}
            >
              <div className="flex items-center justify-between text-left">
                <div className="flex items-center">
                  <img
                    src="/images/credit.png"
                    alt="credit"
                    className="mr-3 h-9"
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
                <h2 className="text-xl font-bold">오늘의 소식</h2>
                <button
                  className={`text-[14px] ${ACCENT_COLOR_TEXT} font-medium hover:underline`}
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
                    title: "요즘 신부 메이크업 트랜드",
                  },
                  {
                    img: "/images/t2.png",
                    cat: "메이크업",
                    title: "요즘 신부 메이크업 트랜드",
                  },
                  {
                    img: "/images/t3.png",
                    cat: "메이크업",
                    title: "요즘 신부 메이크업 트랜드",
                  },
                ].map((t, index) => (
                  <button
                    key={index}
                    className={`flex w-full items-center rounded-[12px] p-2 text-left transition ${ACCENT_COLOR_HOVER} active:scale-[0.99]`}
                    onClick={() => navigate("/news/detail/" + index)}
                  >
                    <img
                      src={t.img}
                      alt={t.title}
                      className="h-[72px] w-[72px] shrink-0 rounded-[12px] object-cover shadow-sm"
                    />
                    <div className="ml-4">
                      <h3
                        className={`text-sm font-medium ${ACCENT_COLOR_TEXT}`}
                      >
                        {t.cat}
                      </h3>
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
