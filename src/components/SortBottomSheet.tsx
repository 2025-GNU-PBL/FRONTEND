import React from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";

/* ========================= 애니메이션 유틸 ========================= */

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const dimVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 0.7, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } },
};

const bottomSheetVariants: Variants = {
  hidden: { y: "100%" },
  show: {
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    y: "100%",
    transition: { duration: 0.26, ease: EASE_OUT },
  },
};

/* ========================= 정렬 타입/옵션 ========================= */

export type SortOption = "최신순" | "리뷰많은순" | "높은가격순" | "낮은가격순";

const SORT_OPTIONS: SortOption[] = [
  "최신순",
  "리뷰많은순",
  "높은가격순",
  "낮은가격순",
];

/* ========================= Props ========================= */

interface SortBottomSheetProps {
  isOpen: boolean;
  sortOption: SortOption;
  onClose: () => void;
  onChange: (option: SortOption) => void;
}

/* ========================= 컴포넌트 ========================= */

const SortBottomSheet: React.FC<SortBottomSheetProps> = ({
  isOpen,
  sortOption,
  onClose,
  onChange,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/70"
            variants={dimVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed left-1/2 bottom-0 z-50 w-full max-w-screen-sm -translate-x-1/2 bg-white rounded-t-[20px]"
            variants={bottomSheetVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center px-5 pt-6 pb-4">
              <span className="text-[18px] font-semibold text-[#1E2124]">
                정렬
              </span>
            </div>

            {/* 옵션 리스트 */}
            <div className="flex flex-col">
              {SORT_OPTIONS.map((opt) => {
                const active = sortOption === opt;
                return (
                  <button
                    key={opt}
                    className="w-full flex items-center gap-3 px-5 py-5 justify-start"
                    onClick={() => onChange(opt)}
                  >
                    {/* 체크 아이콘 영역 */}
                    <div className="w-5 h-5 flex items-center justify-center">
                      {active && (
                        <Icon
                          icon="material-symbols:check-rounded"
                          className="w-5 h-5 text-[#1E2124]"
                        />
                      )}
                    </div>

                    {/* 텍스트 (왼쪽 정렬) */}
                    <span
                      className={`flex-1 text-left text-[16px] ${
                        active
                          ? "font-semibold text-[#1E2124]"
                          : "font-normal text-[#999999]"
                      }`}
                    >
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SortBottomSheet;
