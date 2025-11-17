// src/hooks/useInfiniteProducts.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import api from "../lib/api/axios";
import type { Product } from "../type/product";
import { getRegionQueryValue, type RegionKey } from "../constants/region";

/* ========================= API 타입 ========================= */

type PageMeta = {
  size: number;
  number: number; // 현재 페이지(0-base)
  totalElements: number;
  totalPages: number;
};

type PagedResponse = {
  content: Product[];
  page: PageMeta;
};

/* ========================= 파라미터 타입 ========================= */

type UseInfiniteProductsParams = {
  endpoint: string; // 예: "/api/v1/wedding-hall/filter" | "/api/v1/studio/filter"
  region: RegionKey; // "전체" | "서울" | ...
  sortParam: string; // "LATEST" | "POPULAR" | "PRICE_DESC" | "PRICE_ASC" 등
  tagsParam?: string; // "TAG1,TAG2" 이런 콤마 문자열 (없으면 undefined)
  pageSize?: number; // 기본 6
};

/* ========================= 훅 구현 (웨딩홀 로직 기반) ========================= */

export const useInfiniteProducts = ({
  endpoint,
  region,
  sortParam,
  tagsParam,
  pageSize = 6,
}: UseInfiniteProductsParams) => {
  // 데이터 상태
  const [items, setItems] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 페이지네이션 & 무한 스크롤 상태
  const [pageNumber, setPageNumber] = useState(1); // 1-base
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  // 진행 중 요청 취소를 위한 AbortController
  const controllerRef = useRef<AbortController | null>(null);
  // 현재 요청에 매긴 파라미터 키(응답 가드)
  const inFlightKeyRef = useRef<string | null>(null);
  // 중복 요청 방지 플래그
  const fetchingRef = useRef(false);
  // paramsKey 변경을 감지하기 위한 ref (이펙트 가드에 사용)
  const paramsKey = useMemo(
    () =>
      JSON.stringify({
        endpoint,
        region: getRegionQueryValue(region) ?? null,
        sort: sortParam,
        tags: tagsParam ?? null,
      }),
    [endpoint, region, sortParam, tagsParam]
  );
  const prevParamsKeyRef = useRef<string>(paramsKey);

  const fetchMoreItems = useCallback(
    async (page: number) => {
      if (fetchingRef.current || !hasMore) return;

      // 이전 요청 취소
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      // 현재 파라미터 스냅샷 고정
      const myKey = paramsKey;
      inFlightKeyRef.current = myKey;
      fetchingRef.current = true;

      const isInitial = page === 1;
      if (isInitial) setLoadingInitial(true);
      else setIsLoadingMore(true);

      setErrorMsg("");

      try {
        const regionValue = getRegionQueryValue(region);

        const { data }: { data: PagedResponse } = await api.get(endpoint, {
          params: {
            pageNumber: page,
            pageSize,
            region: regionValue,
            sortType: sortParam,
            tags: tagsParam, // 콤마 구분
          },
          signal: controller.signal,
        });

        // 파라미터가 바뀐 뒤 늦게 온 응답이면 폐기
        if (inFlightKeyRef.current !== myKey || myKey !== paramsKey) {
          return;
        }

        const nextContent = data.content ?? [];
        setTotalCount(data.page.totalElements);

        setItems((prev) => {
          if (isInitial) {
            // 1페이지는 새로 세팅
            return nextContent;
          }
          // 2페이지 이상은 이어 붙이되 중복 제거 (웨딩홀 코드 그대로)
          const map = new Map<number, Product>();
          prev.forEach((p) => map.set(p.id, p));
          nextContent.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });

        const nextPage = page + 1;
        const more = nextPage <= data.page.totalPages;
        setHasMore(more);
      } catch (err: unknown) {
        // 의도적인 취소(axios 또는 AbortController)는 무시 (웨딩홀 코드 기준)
        if (
          (axios.isAxiosError(err) && err.code === "ERR_CANCELED") ||
          (err instanceof Error && err.name === "CanceledError")
        ) {
          // 취소된 요청이므로 메시지 표시 안 함
        } else {
          console.error(err);
          setErrorMsg("목록을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (inFlightKeyRef.current === myKey) {
          setLoadingInitial(false);
          setIsLoadingMore(false);
          fetchingRef.current = false;
        }
      }
    },
    [endpoint, hasMore, pageSize, region, sortParam, tagsParam, paramsKey]
  );

  // paramsKey 변경 시 페이지 리셋 & fetch (웨딩홀 코드 로직 그대로)
  useEffect(() => {
    if (prevParamsKeyRef.current !== paramsKey && pageNumber !== 1) {
      prevParamsKeyRef.current = paramsKey;
      setPageNumber(1);
      return;
    }
    prevParamsKeyRef.current = paramsKey;
    fetchMoreItems(pageNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, pageNumber]);

  // 인터섹션 옵저버: 초기 로딩이 끝난 뒤에만 다음 페이지 요구 (웨딩홀 코드 그대로)
  useEffect(() => {
    const target = elementRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          hasMore &&
          !loadingInitial &&
          !isLoadingMore &&
          !fetchingRef.current
        ) {
          setPageNumber((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "300px 0px" }
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasMore, loadingInitial, isLoadingMore]);

  return {
    items,
    totalCount,
    loadingInitial,
    errorMsg,
    isLoadingMore,
    hasMore,
    elementRef,
  };
};
