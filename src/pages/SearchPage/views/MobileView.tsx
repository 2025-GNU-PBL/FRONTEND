// pages/MobileView.tsx
import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import ResultsMobile from "../sections/ResultsMobile";
import api from "../../../lib/api/axios";
import { useAppSelector } from "../../../store/hooks";
import axios from "axios";

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

  const initialQ = sp.get("q")?.trim() ?? "";
  const [value, setValue] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const lastSavedKeywordRef = useRef<string>("");

  const isAuth = useAppSelector((state) => state.user.isAuth);

  const icons = [
    { img: "/images/wedding.png", label: "웨딩홀", path: "/wedding" },
    { img: "/images/studio.png", label: "스튜디오", path: "/studio" },
    { img: "/images/makeup.png", label: "메이크업", path: "/makeup" },
    { img: "/images/dress.png", label: "드레스", path: "/dress" },
    { img: "/images/calendar.png", label: "캘린더", path: "/calendar" },
  ] as const;

  const trimmed = value.trim();
  const showResults = !!trimmed;

  const fetchRecentKeywords = useCallback(async () => {
    if (!isAuth) {
      setRecentKeywords([]);
      setRecentError(null);
      return;
    }

    try {
      setRecentLoading(true);
      setRecentError(null);

      const res = await api.get<{ keywords: string[] }>(
        "/api/v1/search/recent"
      );
      setRecentKeywords(res.data?.keywords ?? []);
    } catch (err: unknown) {
      console.error(err);

      if (!axios.isAxiosError(err)) {
        // axios 에러가 아닌 경우: 공통 에러 처리
        setRecentKeywords([]);
        setRecentError("최근 검색어를 불러오지 못했어요.");
        setRecentLoading(false);
        return;
      }

      const status = err.response?.status;
      const message = (err.response?.data as { message?: string } | undefined)
        ?.message;

      if (
        status === 400 ||
        status === 401 ||
        message === "존재하지 않는 유저입니다."
      ) {
        setRecentKeywords([]);
        setRecentError(null);
      } else if (status === 500) {
        setRecentKeywords([]);
        setRecentError(null);
      } else {
        setRecentKeywords([]);
        setRecentError("최근 검색어를 불러오지 못했어요.");
      }
    } finally {
      setRecentLoading(false);
    }
  }, [isAuth]);

  useEffect(() => {
    fetchRecentKeywords();
  }, [fetchRecentKeywords]);

  useEffect(() => {
    if (initialQ && !value) {
      setValue(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeImmediate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const saveRecentKeyword = useCallback(
    async (keyword: string) => {
      if (!keyword) return;
      if (!isAuth) return;
      if (lastSavedKeywordRef.current === keyword) return;

      try {
        const res = await api.post<{ keywords: string[] }>(
          "/api/v1/search/recent",
          null,
          { params: { keyword } }
        );

        if (res.data?.keywords) {
          setRecentKeywords(res.data.keywords);
        } else {
          fetchRecentKeywords();
        }

        lastSavedKeywordRef.current = keyword;
      } catch (err: unknown) {
        console.error(err);
        // 저장 API는 에러를 UI에 꼭 노출할 필요는 없으니 로깅만
      }
    },
    [fetchRecentKeywords, isAuth]
  );

  const handleSearchConfirm = () => {
    const keyword = value.trim();
    if (!keyword) return;
    saveRecentKeyword(keyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchConfirm();
      inputRef.current?.blur();
    }
  };

  const handleSearchIconClick = () => {
    handleSearchConfirm();
    inputRef.current?.blur();
  };

  const handleRecentClick = (keyword: string) => {
    setValue(keyword);
    saveRecentKeyword(keyword);
  };

  return (
    <div className="relative min-h-screen w-full bg-white">
      {/* 상단 검색 헤더 (간격/높이 유지, 전체 폭 사용) */}
      <div className="fixed top-5 left-0 right-0 z-20 px-5 my-2">
        <div className="flex flex-row items-center gap-4 w-full h-[44px]">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center active:scale-95"
          >
            <Icon
              icon="solar:arrow-left-linear"
              className="w-8 h-8 text-black"
            />
          </button>

          <label
            htmlFor="mobile-search"
            className="flex flex-row items-center px-4 py-2 flex-1 h-[44px] bg-[#F3F4F5] rounded-[50px] overflow-hidden"
          >
            <input
              id="mobile-search"
              ref={inputRef}
              value={value}
              type="search"
              inputMode="search"
              placeholder="검색어를 입력해주세요"
              onChange={onChangeImmediate}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-[14px] leading-[150%] tracking-[-0.2px] text-gray-700 placeholder-[#D9D9D9] outline-none"
            />
          </label>

          <button
            type="button"
            aria-label="검색"
            onClick={handleSearchIconClick}
            className="w-6 h-6 flex items-center justify-center"
          >
            <Icon icon="tabler:search" className="w-6 h-6 text-black" />
          </button>
        </div>
      </div>

      {/* 본문 영역: 헤더 높이만큼 패딩 */}
      <div className="pt-[88px] pb-6 w-full">
        {/* 검색어 없음 상태 */}
        {!showResults && (
          <>
            {/* 카테고리 아이콘 */}
            <motion.div
              variants={stagger()}
              initial="hidden"
              animate="show"
              className="px-5 pt-3"
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

            {/* 견적 CTA + 최근 검색어 */}
            <motion.div
              variants={stagger(0.02)}
              initial="hidden"
              animate="show"
              className="flex flex-col items-start gap-6 px-5 mt-8 w-full"
            >
              {/* 견적 CTA */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col items-start gap-3 w-full"
              >
                <h2 className="font-semibold text-[16px] leading-[160%] tracking-[-0.2px] text-black">
                  견적 예상하기
                </h2>
                <button
                  onClick={() => navigate("/quotation")}
                  className="flex flex-col items-start px-4 py-3 gap-1 w-full bg-[#F3F4F5] rounded-[8px] active:scale-[0.99]"
                >
                  <div className="flex flex-row items-center gap-1 w-full">
                    <img
                      src="/images/star.png"
                      alt="star"
                      className="h-4.5 w-4.5"
                    />

                    <div className="flex flex-row items-center justify-between w-full">
                      <span className="text-[14px] leading-[150%] tracking-[-0.2px] text-[#333333]">
                        나의 검색 조건으로 견적을 보고 싶다면?
                      </span>
                      <Icon
                        icon="solar:alt-arrow-right-linear"
                        className="w-4 h-4 text-black"
                      />
                    </div>
                  </div>
                </button>
              </motion.div>

              {/* 최근 검색어 */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col items-start gap-3 w-full"
              >
                <h3 className="font-semibold text-[16px] leading-[160%] tracking-[-0.2px] text-black">
                  최근 검색어
                </h3>

                {!isAuth ? (
                  <p className="text-[14px] leading-[160%] tracking-[-0.2px] text-[#999999]">
                    로그인 후 최근 검색어를 확인할 수 있어요.
                  </p>
                ) : recentLoading ? (
                  <p className="text-[14px] leading-[160%] tracking-[-0.2px] text-[#999999]">
                    불러오는 중...
                  </p>
                ) : recentError ? (
                  <p className="text-[14px] leading-[160%] tracking-[-0.2px] text-red-500">
                    {recentError}
                  </p>
                ) : recentKeywords.length === 0 ? (
                  <p className="text-[14px] leading-[160%] tracking-[-0.2px] text-[#999999]">
                    최근 검색어가 없습니다
                  </p>
                ) : (
                  <div className="flex flex-row flex-wrap gap-2 w-full">
                    {recentKeywords.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => handleRecentClick(keyword)}
                        className="box-border flex justify-center items-center px-4 py-2 rounded-[20px] border border-[#999999] bg-white text-[14px] leading-[160%] tracking-[-0.2px] text-[#666666] active:scale-[0.97]"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}

        {/* 검색 결과 */}
        {showResults && (
          <div className="px-5">
            <ResultsMobile query={trimmed} />
          </div>
        )}
      </div>
    </div>
  );
}
