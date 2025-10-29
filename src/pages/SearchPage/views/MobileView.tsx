// pages/MobileView.tsx
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import Results from "../sections/Results";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};
const stagger = (delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { delay, staggerChildren: 0.06, when: "beforeChildren" },
  },
});

export default function MobileView() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // URL에 q가 있으면 초기값으로 세팅 (뒤로가기 등 대비)
  const initialQ = sp.get("q")?.trim() ?? "";
  const [value, setValue] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const icons = [
    { img: "/images/wedding.png", label: "웨딩홀", path: "/wedding" },
    { img: "/images/studio.png", label: "스튜디오", path: "/studio" },
    { img: "/images/makeup.png", label: "메이크업", path: "/makeup" },
    { img: "/images/dress.png", label: "드레스", path: "/dress" },
    { img: "/images/calendar.png", label: "캘린더", path: "/calendar" },
  ] as const;

  const onChangeImmediate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v); // ✅ 엔터 없이 즉시 Results에 전달되어 필터링됨
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* 상단 검색 헤더 (노치/인디케이터 없음 전제) */}
      <div className="flex flex-col items-start px-[20px] py-[12px] absolute w-[390px] h-[68px] left-[calc(50%-195px+1px)] top-[20px]">
        <div className="flex flex-row items-center gap-4 w-[350px] h-[44px]">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="relative w-8 h-8 flex items-center justify-center active:scale-95"
          >
            <Icon
              icon="solar:arrow-left-linear"
              className="w-6 h-6 text-black"
            />
          </button>

          <label
            htmlFor="mobile-search"
            className="flex flex-row items-center px-4 py-2 w-[261px] h-[44px] bg-[#F3F4F5] rounded-[50px] overflow-hidden"
          >
            <input
              id="mobile-search"
              ref={inputRef}
              value={value}
              type="search"
              inputMode="search"
              placeholder="검색어를 입력해주세요"
              onChange={onChangeImmediate}
              className="flex-1 bg-transparent text-[14px] leading-[150%] tracking-[-0.2px] text-gray-700 placeholder-[#D9D9D9] outline-none"
            />
          </label>

          {/* 검색 버튼은 유지하되 동작은 굳이 필요 없음 (엔터 불필요 즉시 반영) */}
          <button
            type="button"
            aria-label="검색"
            onClick={() => inputRef.current?.focus()}
            className="w-6 h-6 flex items-center justify-center"
          >
            <Icon icon="tabler:search" className="w-6 h-6 text-black" />
          </button>
        </div>
      </div>

      {/* q 없을 때: 아이콘/CTA */}
      {!value.trim() && (
        <>
          <motion.div
            variants={stagger()}
            initial="hidden"
            animate="show"
            className="pt-[110px] px-5"
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key="icon-grid"
                variants={stagger(0.05)}
                className="grid grid-cols-5 gap-4 text-black/80"
              >
                {icons.map(({ img, label, path }) => (
                  <motion.div
                    key={label}
                    variants={fadeUp}
                    className="flex flex-col items-center"
                  >
                    <motion.button
                      onClick={() => navigate(path)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex flex-col items-center p-3 rounded-[16px] bg-[#F3F4F5] text-gray-700 hover:text-blue-500 mb-2 transition"
                    >
                      <img src={img} alt={label} className="h-6" />
                    </motion.button>
                    <span className="text-xs">{label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div
            variants={stagger(0.02)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start p-0 gap-6 absolute w-[350px] h-[155px] left-[20px] top-[220px]"
          >
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-start p-0 gap-3 w-[350px] h-[75px]"
            >
              <h2 className="w-[350px] h-[26px] font-semibold text-[16px] leading-[160%] tracking-[-0.2px] text-black">
                견적 예상하기
              </h2>
              <button
                onClick={() => navigate("/quotation")}
                className="flex flex-col items-start px-3 py-2 gap-1 w-[350px] h-[37px] bg-[#F3F4F5] rounded-[8px] active:scale-[0.99]"
              >
                <div className="flex flex-row items-center p-0 gap-1 w-[326px] h-[21px]">
                  <Icon
                    icon="solar:star-bold"
                    className="w-4 h-4 text-[#803BFF]"
                  />
                  <div className="flex flex-row items-center justify-between p-0 w-[306px] h-[21px]">
                    <span className="text-[14px] leading-[150%] tracking-[-0.2px] text-[#333333]">
                      나의검색 조건으로 견적을 보고싶다면?
                    </span>
                    <Icon
                      icon="solar:alt-arrow-right-linear"
                      className="w-4 h-4 text-black"
                    />
                  </div>
                </div>
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-col items-start p-0 gap-1 w-[145px] h-[56px]"
            >
              <h3 className="w-[145px] h-[26px] font-semibold text-[16px] leading-[160%] tracking-[-0.2px] text-black">
                최근 검색어
              </h3>
              <p className="w-[145px] h-[26px] text-[16px] leading-[160%] tracking-[-0.2px] text-[#999999]">
                최근 검색어가 없습니다
              </p>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* q 있을 때: 결과 섹션 — ✅ 입력 즉시 필터링 (prop으로 전달) */}
      {value.trim() && (
        <div className="pt-[20px]">
          <Results query={value} />
        </div>
      )}
    </div>
  );
}
