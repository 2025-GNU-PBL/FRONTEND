// src/pages/MainPage/views/MobileView.tsx
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../../../components/SideMenu";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

// ===== 타입 선언 =====
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
// =====================

// ✅ 문자열 ease 대신 cubic-bezier 사용 (TS 안전)
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ✅ Variants 타입 명시
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: EASE_OUT } },
};

const stagger = (delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: {
      delay,
      // 각 자식의 variants를 순차적으로 재생
      staggerChildren: 0.06,
      when: "beforeChildren",
    },
  },
});

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
  const navigate = useNavigate();

  const icons = [
    { img: "/images/wedding.png", label: "웨딩홀", path: "/wedding" },
    { img: "/images/studio.png", label: "스튜디오", path: "/studio" },
    { img: "/images/makeup.png", label: "메이크업", path: "/makeup" },
    { img: "/images/dress.png", label: "드레스", path: "/dress" },
    { img: "/images/calendar.png", label: "캘린더", path: "/calendar" },
  ] as const;

  return (
    <motion.div
      className="flex flex-col text-lg relative"
      variants={stagger()}
      initial="hidden"
      animate="show"
    >
      {/* 헤더 (로고 + 메뉴) */}
      <motion.div
        className="flex justify-between items-center m-5"
        variants={fadeUp}
      >
        <h1 className="font-allimjang text-[#FF2233] text-2xl font-bold ">
          웨딩PICK
        </h1>
        <motion.button
          className="flex items-center justify-center hover:opacity-80 active:scale-95"
          aria-label="메뉴 열기"
          onClick={openMenu}
          whileTap={{ scale: 0.94 }}
        >
          <Icon icon="mynaui:menu" className="w-6 h-6 text-black/80" />
        </motion.button>
      </motion.div>

      {/* 바디 */}
      <div className="mx-5.5">
        {/* 검색창 */}
        <motion.div
          variants={fadeUp}
          className="flex items-center mb-7.5 rounded-[8px] px-4 h-11 bg-[#F3F4F5] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600"
          whileHover={{ scale: 1.01 }}
        >
          <Icon icon="tabler:search" className="w-5 h-5 text-[#D9D9D9] mr-2" />
          <input
            type="text"
            placeholder="검색어를 입력해주세요"
            className="flex-1 text-gray-700 placeholder-[#D9D9D9] text-sm bg-transparent h-full focus:outline-none"
          />
        </motion.div>

        {/* 상세 페이지 아이콘 */}
        <motion.div
          className="grid grid-cols-5 gap-4 mb-5.5 text-black/80"
          variants={stagger(0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          {icons.map(({ img, label, path }) => (
            <motion.div
              key={label}
              className="flex flex-col items-center"
              variants={fadeUp}
            >
              <motion.button
                onClick={() => navigate(path)}
                className="flex flex-col items-center p-3 rounded-[16px] bg-[#F3F4F5] text-gray-700 hover:text-blue-500 mb-2 active:scale-95 transition"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <img src={img} alt={label} className="h-6" />
              </motion.button>
              <span className="text-xs">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* 견적 CTA */}
        <motion.button
          variants={fadeUp}
          onClick={() => navigate("/quotation")}
          className="flex items-center justify-between mb-7.5 rounded-[8px] px-4 h-11 bg-[#F3F4F5] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600 w-full text-left"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <img src="/images/star.png" alt="star" className="h-4.5 w-4.5" />
            <span className="text-sm text-[#333333]">
              &nbsp; 나의 검색 조건으로 견적을 보고 싶다면?
            </span>
          </div>
          <Icon icon="solar:alt-arrow-right-linear" />
        </motion.button>

        {/* 섹션 타이틀 */}
        <motion.div className="font-semibold text-lg mb-4" variants={fadeUp}>
          <span className="text-[#FF2233] mr-0.75">2030</span>
          <span className="text-[#FF2233]">신부님</span>
          <span className="text-black/80 mr-0.75">들</span>
          <span className="text-black/80">PICK</span>
        </motion.div>

        {/* 토글 버튼들 */}
        <motion.div className="flex gap-2 mb-4" variants={stagger(0.02)}>
          {categories.map((c) => {
            const isActive = active === c.key;
            return (
              <motion.button
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
                whileTap={{ scale: 0.96 }}
                variants={fadeUp}
              >
                {c.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* 카테고리 상품 리스트 (가로 스크롤) */}
        <div className="-mx-5 px-5">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={active} // 카테고리 바뀔 때 부드럽게 전환
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
              style={{ scrollPaddingLeft: 20, scrollSnapType: "x mandatory" }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.25, ease: EASE_OUT },
              }}
              exit={{
                opacity: 0,
                transition: { duration: 0.2, ease: EASE_OUT },
              }}
            >
              {products.map((p) => (
                <motion.article
                  key={p.id}
                  className="min-w-[228px] max-w-[228px] bg-white overflow-hidden"
                  variants={fade}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ y: -2 }}
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
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 할인 배너 */}
        <motion.div
          variants={fadeUp}
          className="text-white flex items-center justify-between mt-3 p-4 rounded-[16px] bg-[#A06CFF] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center">
            <img src="/images/credit.png" alt="credit" className="h-8 mr-3" />
            <span className="font-semibold text-base">
              신용카드 할인 알아보기
            </span>
          </div>
          <Icon icon="solar:alt-arrow-right-linear" className="h-6 w-6" />
        </motion.div>

        {/* 오늘의 소식 */}
        <div className="mt-10 mb-25">
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-semibold">오늘의 소식</h1>
            <motion.div
              className="text-[14px] text-black/30 gap-1.25 hover:underline"
              whileHover={{ x: 2 }}
            >
              <span>더보기</span>
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="h-4 w-4 inline-block"
              />
            </motion.div>
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
            <motion.div
              key={t.img}
              className="mt-5 first:mt-8 flex items-center"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <img src={t.img} alt="trend" className="h-[60px] inline-block" />
              <div className="ml-3 items-center">
                <h2 className="text-[#8C8C8C] text-sm">{t.cat}</h2>
                <h1 className="text-base">{t.title}</h1>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 왼쪽 슬라이드 메뉴 */}
      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </motion.div>
  );
}
