// /pages/WebView.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import ResultsWeb from "../sections/ResultsWeb";
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

export default function WebView() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const initialQ = sp.get("q")?.trim() ?? "";
  const [value, setValue] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 인증 여부
  const isAuth = useAppSelector((state) => state.user.isAuth);

  // 최근 검색어 상태
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const lastSavedKeywordRef = useRef<string>("");

  const trimmed = value.trim();
  const showResults = !!trimmed;

  // 최근 검색어 가져오기
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
        return;
      }

      const status = err.response?.status;
      const message = (err.response?.data as { message?: string } | undefined)
        ?.message;

      // 모바일과 동일한 에러 처리 로직
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

  // 최근 검색어 저장
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
          // 응답 포맷이 애매하면 다시 한 번 전체 조회
          fetchRecentKeywords();
        }

        lastSavedKeywordRef.current = keyword;
      } catch (err: unknown) {
        console.error(err);
      }
    },
    [fetchRecentKeywords, isAuth]
  );

  // 검색 확정(엔터/최근 검색어 클릭 등)
  const handleSearchConfirm = (keywordRaw?: string) => {
    const keyword = (keywordRaw ?? value).trim();
    if (!keyword) return;

    // URL q 동기화 (이미 되어 있어도 한 번 더 맞춰줌)
    const next = new URLSearchParams(sp);
    next.set("q", keyword);
    setSp(next, { replace: true });
    setValue(keyword);

    saveRecentKeyword(keyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchConfirm();
      inputRef.current?.blur();
    }
  };

  const handleRecentClick = (keyword: string) => {
    handleSearchConfirm(keyword);
    inputRef.current?.blur();
  };

  // 브라우저 뒤/앞 이동 시 URL q 반영
  useEffect(() => {
    const q = sp.get("q")?.trim() ?? "";
    setValue(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.get("q")]);

  return (
    <div className="relative min-h-screen bg-white mt-16">
      {/* 상단 고정 검색 헤더 */}
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
              onKeyDown={handleKeyDown}
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

      {/* 본문 */}
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* 검색어 없을 때: 최근 검색어 + 가이드 */}
        {!showResults && (
          <motion.div
            variants={stagger()}
            initial="hidden"
            animate="show"
            className="space-y-10"
          >
            {/* 최근 검색어 */}
            <motion.div variants={fadeUp} className="space-y-3">
              <h3 className="text-[16px] font-semibold text-black">
                최근 검색어
              </h3>

              {!isAuth ? (
                <p className="text-[14px] text-[#999999]">
                  로그인 후 최근 검색어를 확인할 수 있어요.
                </p>
              ) : recentLoading ? (
                <p className="text-[14px] text-[#999999]">불러오는 중...</p>
              ) : recentError ? (
                <p className="text-[14px] text-red-500">{recentError}</p>
              ) : recentKeywords.length === 0 ? (
                <p className="text-[14px] text-[#999999]">
                  최근 검색어가 없습니다
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentKeywords.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => handleRecentClick(keyword)}
                      className="px-4 py-2 rounded-full border border-[#D0D4DA] bg-white text-[14px] text-[#555B65] hover:border-black/40 hover:bg-[#F3F4F5] transition active:scale-[0.97]"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 검색 유도 텍스트 (선택) */}
            <motion.div variants={fadeUp} className="space-y-2">
              <h4 className="text-[15px] font-semibold text-black">
                이런 검색어는 어떠세요?
              </h4>
              <p className="text-[14px] text-[#888F99]">
                예) 강남 스튜디오, 서울 웨딩홀, 본식 스냅, 한복 대여 …
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* 검색어 있을 때: 결과 */}
        {showResults && (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={value || "all"}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
            >
              {/* 상단 상태 텍스트 */}
              <div className="mb-4 text-[14px] text-gray-600">
                <span className="text-black font-semibold">“{trimmed}”</span>{" "}
                검색 결과
              </div>

              <ResultsWeb query={trimmed} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
