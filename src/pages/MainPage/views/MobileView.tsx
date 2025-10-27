// src/pages/MainPage/views/MobileView.tsx
import { Icon } from "@iconify/react";
import type { MouseEvent } from "react";

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

export default function MobileView({
  active,
  setActive,
  categories,
  products,
  isMenuOpen,
  openMenu,
  closeMenu,
}: Props) {
  const handleSelect = (key: CategoryKey) => setActive(key);

  return (
    <div className="flex flex-col text-lg relative">
      {/* 헤더 (로고 + 메뉴) */}
      <div className="flex justify-between items-center m-5">
        <h1 className="font-allimjang text-[#FF2233] text-2xl font-bold ">
          웨딩PICK
        </h1>
        <button
          className="flex items-center justify-center hover:opacity-80 active:scale-95"
          aria-label="메뉴 열기"
          onClick={openMenu}
        >
          <Icon icon="mynaui:menu" className="w-6 h-6 text-black/80" />
        </button>
      </div>

      {/* 바디 */}
      <div className="mx-5.5">
        {/* 검색창 */}
        <div className="flex items-center mb-7.5 rounded-[8px] px-4 h-11 bg-[#F3F4F5] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600">
          <Icon icon="tabler:search" className="w-5 h-5 text-[#D9D9D9] mr-2" />
          <input
            type="text"
            placeholder="검색어를 입력해주세요"
            className="flex-1 text-gray-700 placeholder-[#D9D9D9] text-sm bg-transparent h-full focus:outline-none"
          />
        </div>

        {/* 상세 페이지 아이콘 */}
        <div className="grid grid-cols-5 gap-4 mb-5.5 text-black/80">
          {[
            { img: "/images/wedding.png", label: "웨딩홀" },
            { img: "/images/studio.png", label: "스튜디오" },
            { img: "/images/makeup.png", label: "메이크업" },
            { img: "/images/dress.png", label: "드레스" },
            { img: "/images/calendar.png", label: "캘린더" },
          ].map((i) => (
            <div key={i.label} className="flex flex-col items-center">
              <button className="flex flex-col items-center p-3 rounded-[16px] bg-[#F3F4F5] text-gray-700 hover:text-blue-500 mb-2">
                <img src={i.img} alt={i.label} className="h-6" />
              </button>
              <span className="text-xs">{i.label}</span>
            </div>
          ))}
        </div>

        {/* 견적 CTA */}
        <div className="flex items-center justify-between mb-7.5 rounded-[8px] px-4 h-11 bg-[#F3F4F5] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600">
          <div className="flex items-center ">
            <img src="/images/star.png" alt="star" className="h-4.5 w-4.5" />
            <span className="text-sm text-[#333333]">
              &nbsp; 나의 검색 조건으로 견적을 보고 싶다면?
            </span>
          </div>
          <Icon icon="solar:alt-arrow-right-linear" />
        </div>

        {/* 섹션 타이틀 */}
        <div className="font-semibold text-lg mb-4">
          <span className="text-[#FF2233] mr-0.75">2030</span>
          <span className="text-[#FF2233]">신부님</span>
          <span className="text-black/80 mr-0.75">들</span>
          <span className="text-black/80">PICK</span>
        </div>

        {/* 토글 버튼들 */}
        <div className="flex gap-2 mb-4">
          {categories.map((c) => {
            const isActive = active === c.key;
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelect(c.key)}
                className={[
                  "flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "border border-[#D9D9D9] text-black",
                ].join(" ")}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* 카테고리 상품 리스트 (가로 스크롤) */}
        <div className="-mx-5 px-5">
          <div
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
            style={{ scrollPaddingLeft: 20, scrollSnapType: "x mandatory" }}
          >
            {products.map((p) => (
              <article
                key={p.id}
                className="min-w-[228px] max-w-[228px] bg-white  overflow-hidden"
              >
                <div className="w-full h-[144px] bg-[#F3F4F5]">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="h-full w-full object-cover rounded-[16px]"
                  />
                </div>

                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-black/40 text-sm">
                      {p.address
                        ? p.address.split(" ").slice(0, 2).join(" ")
                        : ""}{" "}
                      <span className="mx-2">|</span>
                      <img
                        src="/images/star2.png"
                        alt="평점"
                        className="h-3 inline-block mb-1 mr-1"
                      />
                      {p.avg_star ?? "-"}
                    </h3>
                  </div>

                  {p.title && <p className="text-black/80">{p.title}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* 할인 배너 */}
        <div className="text-white flex items-center justify-between mt-3 p-4 rounded-[16px] bg-[#A06CFF] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600">
          <div className="flex items-center">
            <img src="/images/credit.png" alt="credit" className="h-8 mr-3" />
            <span className="font-semibold text-base">
              신용카드 할인 알아보기
            </span>
          </div>
          <Icon icon="solar:alt-arrow-right-linear" className="h-6 w-6" />
        </div>

        {/* 오늘의 소식 */}
        <div className="mt-10 mb-25">
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-semibold">오늘의 소식</h1>
            <div className="text-[14px] text-black/30 gap-1.25 hover:underline">
              <span>더보기</span>
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="h-4 w-4 inline-block"
              />
            </div>
          </div>

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
          ].map((t) => (
            <div key={t.img} className="mt-5 first:mt-8 flex items-center">
              <img src={t.img} alt="trend" className="h-[60px] inline-block" />
              <div className="ml-3 items-center">
                <h2 className="text-[#8C8C8C] text-sm">{t.cat}</h2>
                <h1 className="text-base">{t.title}</h1>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =================== 왼쪽 슬라이드 메뉴 =================== */}
      {/* dimmed */}
      <div
        className={[
          "fixed inset-0 z-40 bg-[rgba(0,0,0,0.6)] transition-opacity duration-300",
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={closeMenu}
        aria-hidden={!isMenuOpen}
      />

      {/* drawer panel */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[265px] bg-white shadow-xl",
          "transform transition-transform duration-300 will-change-transform",
          isMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMenuOpen}
      >
        {/* 카피 */}
        <div
          className="absolute left-6 top-20 w-[157px] h-14 font-semibold text-[20px] leading-[138%] text-[#202325]"
          style={{ fontFamily: "Pretendard" }}
        >
          1만 신부님들의 선택
          <br />
          웨딩PICK
        </div>

        {/* 버튼: 로그인 (레드) */}
        <button
          aria-label="로그인"
          className="absolute left-6 top-[156px] w-[105px] h-[37px] flex items-center justify-center 
               px-6 py-2.5 rounded-[20px] bg-[#FF2233] text-white text-[12px] font-medium
               leading-[150%] tracking-[-0.1px]
               transition active:scale-95 hover:bg-[#e61e2d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2233]/40"
          style={{ fontFamily: "Pretendard" }}
          onClick={closeMenu}
        >
          로그인
        </button>

        {/* 버튼: 회원가입 (아웃라인) */}
        <button
          aria-label="회원가입"
          className="absolute left-[136px] top-[156px] w-[105px] h-[37px] box-border flex items-center justify-center 
               px-6 py-2.5 rounded-[20px] border border-[rgba(0,0,0,0.2)] bg-white
               text-[12px] font-medium text-[rgba(0,0,0,0.8)] leading-[150%] tracking-[-0.1px]
               transition active:scale-95 hover:border-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          style={{ fontFamily: "Pretendard" }}
        >
          회원가입
        </button>

        {/* Frame 2085665277 */}
        <div className="absolute left-6 top-[225px] w-[217px] h-5 flex flex-row items-center justify-between gap-[152px] p-0">
          {/* 웨딩 */}
          <span
            className="font-semibold text-[14px] leading-[140%] text-[#202325]"
            style={{ fontFamily: "Pretendard" }}
          >
            웨딩
          </span>
        </div>

        {/* Frame 2085665178 (메뉴 리스트 영역) */}
        <div className="absolute left-6 top-[261px] w-[217px] h-[160px] flex flex-col items-start p-0">
          {/* Frame 2085665175 (활성 항목) */}
          <div className="flex flex-row items-center w-[217px] h-10 px-6 py-3 gap-[10px] bg-[#FAF8FB] rounded-[12px]">
            <span
              className="text-[14px] font-medium leading-[140%] text-black"
              style={{ fontFamily: "Pretendard" }}
            >
              모바일초대장
            </span>
          </div>

          {/* Frame 2085665176 */}
          <div className="flex flex-row items-center w-[217px] h-10 px-6 py-3 gap-[10px] bg-white">
            <span
              className="text-[14px] font-medium leading-[140%] text-[#595F63]"
              style={{ fontFamily: "Pretendard" }}
            >
              청첩장 관리
            </span>
          </div>

          {/* Frame 2085665177 */}
          <div className="flex flex-row items-center w-[217px] h-10 px-6 py-3 gap-[10px] bg-white">
            <span
              className="text-[14px] font-medium leading-[140%] text-[#595F63]"
              style={{ fontFamily: "Pretendard" }}
            >
              결제 내역
            </span>
          </div>

          {/* Frame 2085665178 */}
          <div className="flex flex-row items-center w-[217px] h-10 px-6 py-3 gap-[10px] bg-white">
            <span
              className="text-[14px] font-medium leading-[140%] text-[#595F63]"
              style={{ fontFamily: "Pretendard" }}
            >
              고객센터
            </span>
          </div>
        </div>

        {/* Frame 2085665182 (하단 메뉴 리스트) */}
        <div className="absolute left-6 top-[623px] w-[217px] h-[120px] flex flex-col items-start p-0">
          {/* Frame 2085665174 */}
          <div className="flex flex-row items-center w-[217px] h-10 px-0 py-3 gap-[10px] bg-white rounded-[10px]">
            <span
              className="text-[14px] font-medium leading-[140%] text-[#595F63]"
              style={{ fontFamily: "Pretendard" }}
            >
              공지사항
            </span>
          </div>

          {/* Frame 2085665180 */}
          <div className="flex flex-row items-center w-[217px] h-10 px-0 py-3 gap-[10px] bg-white rounded-[10px]">
            <span
              className="text-[14px] font-medium leading-[140%] text-[#595F63]"
              style={{ fontFamily: "Pretendard" }}
            >
              이벤트
            </span>
          </div>

          {/* Frame 2085665179 */}
          <div className="flex flex-row items-center w-[217px] h-10 px-0 py-3 gap-[10px] bg-white rounded-[10px]">
            <span
              className="text-[14px] font-medium leading-[140%] text-[#595F63]"
              style={{ fontFamily: "Pretendard" }}
            >
              이용약관 및 정책
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
