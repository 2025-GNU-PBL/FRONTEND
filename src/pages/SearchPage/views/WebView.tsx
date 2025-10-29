// /pages/WebView.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import ResultsWeb from "../sections/ResultsWeb";

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

type QuickLink = { label: string; path: string };

export default function WebView() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  // URL의 q를 초기값으로 사용 (뒤로가기 대응)
  const initialQ = sp.get("q")?.trim() ?? "";
  const [value, setValue] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 모바일 아이콘 섹션과 결을 맞춘 빠른 이동 텍스트 링크
  const quickLinks: QuickLink[] = useMemo(
    () => [
      { label: "웨딩홀", path: "/wedding" },
      { label: "스튜디오", path: "/studio" },
      { label: "메이크업", path: "/makeup" },
      { label: "드레스", path: "/dress" },
      { label: "캘린더", path: "/calendar" },
    ],
    []
  );

  // 입력 즉시 값 반영 + URL 동기화
  const onChangeImmediate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    const next = new URLSearchParams(sp);
    if (v.trim()) next.set("q", v.trim());
    else next.delete("q");
    setSp(next, { replace: true });
  };

  const clearQuery = () => {
    const next = new URLSearchParams(sp);
    next.delete("q");
    setSp(next, { replace: true });
    setValue("");
    inputRef.current?.focus();
  };

  // 브라우저 뒤/앞 이동 시 URL q 반영
  useEffect(() => {
    const q = sp.get("q")?.trim() ?? "";
    setValue(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.get("q")]);

  return (
    <div className="relative min-h-screen bg-white mt-16">
      {/* 상단 고정 검색 헤더 (모바일과 톤을 맞춘 심플 버전) */}
      <div className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5 active:scale-95"
          >
            <Icon
              icon="solar:arrow-left-linear"
              className="w-6 h-6 text-black"
            />
          </button>

          <label
            htmlFor="web-search"
            className="flex items-center gap-2 px-4 py-2 flex-1 bg-[#F3F4F5] rounded-[12px] overflow-hidden"
          >
            <Icon icon="tabler:search" className="w-5 h-5 text-gray-500" />
            <input
              id="web-search"
              ref={inputRef}
              value={value}
              type="search"
              inputMode="search"
              placeholder="스튜디오, 웨딩홀, 드레스… 원하는 키워드를 검색하세요"
              onChange={onChangeImmediate}
              className="flex-1 bg-transparent text-[15px] leading-[150%] tracking-[-0.2px] text-gray-800 placeholder-[#B6BCC3] outline-none"
            />
            {value && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={clearQuery}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/10"
              >
                <Icon icon="lucide:x" className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </label>

          <button
            type="button"
            aria-label="새로고침"
            onClick={() => window.location.reload()}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5"
          >
            <Icon
              icon="solar:refresh-linear"
              className="w-5 h-5 text-gray-700"
            />
          </button>
        </div>
      </div>

      {/* 본문: 필터 패널/정렬바 전부 제거, 전체 폭 결과만 표시 */}
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* q 없을 때: 모바일과 유사한 추천/CTA 섹션 */}
        {!value.trim() && (
          <motion.div
            variants={stagger()}
            initial="hidden"
            animate="show"
            className="space-y-10"
          >
            {/* 빠른 이동 링크 (모바일 아이콘 섹션 대응) */}
            <motion.div variants={fadeUp} className="space-y-3">
              <h3 className="text-[16px] font-semibold text-black">바로가기</h3>
              <div className="flex flex-wrap gap-2">
                {quickLinks.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="px-3 py-1.5 rounded-full bg-[#F3F4F5] text-[13px] text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 최근 검색어 (모바일 문구와 동일한 톤) */}
            <motion.div variants={fadeUp} className="space-y-1">
              <h3 className="text-[16px] font-semibold text-black">
                최근 검색어
              </h3>
              <p className="text-[14px] text-[#999999]">
                최근 검색어가 없습니다
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* q 있을 때: 결과 — 입력 즉시 필터링 (prop으로 전달) */}
        {value.trim() && (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={value || "all"}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
            >
              {/* 상단 상태 텍스트 (간결하게 유지) */}
              <div className="mb-4 text-[14px] text-gray-600">
                <span className="text-black font-semibold">“{value}”</span> 검색
                결과
              </div>

              <ResultsWeb query={value} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
