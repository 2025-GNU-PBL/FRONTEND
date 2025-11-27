// src/pages/MyPage/OwnerMyPage/ProductManagement/ProductDetail/views/WebView.tsx

import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../../store/userSlice";
import api from "../../../../../../lib/api/axios";

// -------------------- 타입 --------------------
type ImageItem = { id?: number; src: string; file?: File };

type Region = "SEOUL" | "GYEONGGI" | "INCHEON" | "BUSAN";

type CategoryKo = "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

type FormValues = {
  // 공통
  vendorName: string;
  address: string;
  category: CategoryKo | null;
  name: string;
  price: string;
  detail: string;
  images: ImageItem[];

  // 공통 추가 필드
  availableTime: string;
  region: Region | "";
  ownerName: string;
  starCount: string;
  subwayAccessible: boolean;
  diningAvailable: boolean;
  thumbnail: string;
  tags: string[];

  // 웨딩홀 전용 필드
  hallCapacity: string;
  minGuest: string;
  maxGuest: string;
  parkingCapacity: string;
  cateringType: string;
  reservationPolicy: string;
};

// ---------- 태그 그룹 정의 ----------
type TagOption = { ko: string; en: string };
type TagGroup = { groupLabel: string; options: TagOption[] };

const HALL_TAG_GROUPS: TagGroup[] = [
  {
    groupLabel: "홀타입",
    options: [
      { ko: "일반", en: "GENERAL" },
      { ko: "컨벤션", en: "CONVENTION" },
      { ko: "호텔", en: "HOTEL" },
      { ko: "하우스", en: "HOUSE" },
      { ko: "레스토랑", en: "RESTAURANT" },
      { ko: "한옥", en: "HANOK" },
      { ko: "교회/성당", en: "CHURCH" },
    ],
  },
  {
    groupLabel: "홀컨셉",
    options: [
      { ko: "스몰", en: "SMALL" },
      { ko: "채플", en: "CHAPEL" },
      { ko: "야외/가든", en: "OUTDOOR_GARDEN" },
      { ko: "전통혼례", en: "TRADITIONAL_WEDDING" },
    ],
  },
];

const STUDIO_TAG_GROUPS: TagGroup[] = [
  {
    groupLabel: "스타일",
    options: [
      { ko: "인물중심", en: "PORTRAIT_FOCUSED" },
      { ko: "배경다양", en: "VARIED_BACKGROUND" },
      { ko: "인물+배경", en: "PORTRAIT_AND_BACKGROUND" },
    ],
  },
  {
    groupLabel: "촬영 가능",
    options: [
      { ko: "한옥", en: "HANOK" },
      { ko: "가든", en: "GARDEN" },
      { ko: "야간", en: "NIGHT" },
      { ko: "로드", en: "ROAD" },
      { ko: "수중", en: "UNDERWATER" },
      { ko: "반려동물", en: "PET_FRIENDLY" },
    ],
  },
];

const DRESS_TAG_GROUPS: TagGroup[] = [
  {
    groupLabel: "행사",
    options: [
      { ko: "촬영+본식", en: "SHOOTING_AND_CEREMONY" },
      { ko: "본식", en: "CEREMONY" },
      { ko: "촬영", en: "SHOOTING" },
    ],
  },
  {
    groupLabel: "주력소재",
    options: [
      { ko: "실크", en: "SILK" },
      { ko: "레이스", en: "LACE" },
      { ko: "비즈", en: "BEADS" },
    ],
  },
  {
    groupLabel: "제작형태",
    options: [
      { ko: "국내", en: "DOMESTIC" },
      { ko: "수입", en: "IMPORTED" },
      { ko: "국내+수입", en: "DOMESTIC_AND_IMPORTED" },
    ],
  },
];

const MAKEUP_TAG_GROUPS: TagGroup[] = [
  {
    groupLabel: "행사",
    options: [
      { ko: "촬영+본식", en: "SHOOTING_AND_CEREMONY" },
      { ko: "본식", en: "CEREMONY" },
      { ko: "촬영", en: "SHOOTING" },
    ],
  },
  {
    groupLabel: "담당자",
    options: [
      { ko: "원장/대표/이사", en: "DIRECTOR_OR_CEO" },
      { ko: "부원장", en: "DEPUTY_DIRECTOR" },
      { ko: "실장", en: "MANAGER" },
      { ko: "팀장/디자이너", en: "TEAM_LEADER_OR_DESIGNER" },
    ],
  },
  {
    groupLabel: "메이크업 스타일",
    options: [
      { ko: "과즙/색조", en: "FRUITY_TONE" },
      { ko: "깨끗/화사", en: "CLEAN_AND_BRIGHT" },
      { ko: "윤곽/음영", en: "CONTOUR_AND_SHADOW" },
    ],
  },
];

// ko ↔ en 매핑
const KO_TO_EN: Record<string, string> = [
  ...HALL_TAG_GROUPS,
  ...STUDIO_TAG_GROUPS,
  ...DRESS_TAG_GROUPS,
  ...MAKEUP_TAG_GROUPS,
]
  .flatMap((g) => g.options)
  .reduce((acc, cur) => {
    acc[cur.ko] = cur.en;
    return acc;
  }, {} as Record<string, string>);

const EN_TO_KO: Record<string, string> = Object.keys(KO_TO_EN).reduce(
  (acc, ko) => {
    const en = KO_TO_EN[ko];
    acc[en] = ko;
    return acc;
  },
  {} as Record<string, string>
);

// -------------------- 지역 매핑 --------------------
const REGION_LABELS: Record<Region, string> = {
  SEOUL: "서울",
  GYEONGGI: "경기",
  INCHEON: "인천",
  BUSAN: "부산",
};

// OWNER 전용 유저 판별
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

// GET 공통 엔드포인트 맵 (한글 카테고리 기준)
const GET_ENDPOINT_MAP: Record<CategoryKo, string> = {
  웨딩홀: "/api/v1/wedding-hall",
  스튜디오: "/api/v1/studio",
  드레스: "/api/v1/dress",
  메이크업: "/api/v1/makeup",
};

// 리스트에서 넘어온 영어/slug 카테고리 → 한글 카테고리
const EN_CATEGORY_TO_KO: Record<string, CategoryKo> = {
  // UPPER CASE
  WEDDING_HALL: "웨딩홀",
  WEDDING: "웨딩홀",
  STUDIO: "스튜디오",
  DRESS: "드레스",
  MAKEUP: "메이크업",
  // slug / lower case
  "wedding-hall": "웨딩홀",
  wedding_hall: "웨딩홀",
  wedding: "웨딩홀",
  studio: "스튜디오",
  dress: "드레스",
  makeup: "메이크업",
};

// 🔹 상세 → 수정 페이지로 갈 때: 한글 카테고리 → 영어(slug) 카테고리
const KO_CATEGORY_TO_EN: Record<CategoryKo, string> = {
  웨딩홀: "wedding-hall",
  스튜디오: "studio",
  드레스: "dress",
  메이크업: "makeup",
};

// API 응답 타입
type ApiTag = string | { tagName?: string | null } | null | undefined;

interface ApiImage {
  id?: number;
  url?: string;
}

// 전체 카테고리 리스트 (fallback 용)
const ALL_CATEGORIES: CategoryKo[] = [
  "웨딩홀",
  "스튜디오",
  "드레스",
  "메이크업",
];

// -------------------- WebView (상품 정보 확인 - 읽기 전용) --------------------
const WebView: React.FC = () => {
  // URL: /my-page/owner/products/:category/:id
  const { id, category: categoryParam } = useParams<{
    id: string;
    category?: string;
  }>();
  const navigate = useNavigate();

  // Redux 의 userData에서 OWNER 정보 가져오기
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const resolvedVendorName = owner?.bzName ?? "";
  const resolvedAddress = owner
    ? `${owner.roadAddress || owner.jibunAddress} ${
        owner.detailAddress || ""
      }`.trim()
    : "";

  if (!owner) {
    console.warn(
      "[상품 정보 확인 WebView] OWNER 정보가 없습니다. 로그인 상태 및 권한을 확인해주세요."
    );
  }

  const { control, reset } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      vendorName: resolvedVendorName,
      address: resolvedAddress,
      category: null,
      name: "",
      price: "",
      detail: "",
      images: [],
      availableTime: "",
      region: "",
      ownerName: resolvedVendorName || "",
      starCount: "0",
      subwayAccessible: false,
      diningAvailable: false,
      thumbnail: "",
      tags: [],
      hallCapacity: "",
      minGuest: "",
      maxGuest: "",
      parkingCapacity: "",
      cateringType: "",
      reservationPolicy: "",
    },
  });

  // 값들 watch (읽기 전용 뷰 렌더용)
  const vendorName = useWatch({ control, name: "vendorName" }) || "";
  const address = useWatch({ control, name: "address" }) || "";
  const category = useWatch({ control, name: "category" });
  const name = useWatch({ control, name: "name" }) || "";
  const price = useWatch({ control, name: "price" }) || "";
  const detail = useWatch({ control, name: "detail" }) || "";
  const images = useWatch({ control, name: "images" }) || [];
  const availableTime = useWatch({ control, name: "availableTime" }) || "";
  const region = useWatch({ control, name: "region" }) as Region | "";
  const selectedTags = useWatch({ control, name: "tags" }) || [];
  const hallCapacity = useWatch({ control, name: "hallCapacity" }) || "";
  const minGuest = useWatch({ control, name: "minGuest" }) || "";
  const maxGuest = useWatch({ control, name: "maxGuest" }) || "";
  const parkingCapacity = useWatch({ control, name: "parkingCapacity" }) || "";
  const cateringType = useWatch({ control, name: "cateringType" }) || "";
  const reservationPolicy =
    useWatch({ control, name: "reservationPolicy" }) || "";

  // -------------------- 상품 불러오기 --------------------
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      // ✅ URL 파라미터에서 한글 카테고리로 매핑
      let categoryKoFromParam: CategoryKo | undefined;

      if (categoryParam) {
        const key1 = categoryParam; // e.g. "dress" / "wedding-hall"
        const key2 = categoryParam.toUpperCase(); // "DRESS"
        const key3 = categoryParam.toLowerCase(); // "dress"

        categoryKoFromParam =
          EN_CATEGORY_TO_KO[key1] ??
          EN_CATEGORY_TO_KO[key2] ??
          EN_CATEGORY_TO_KO[key3];
      }

      // ✅ 카테고리 후보 리스트 구성
      let targetCategories: CategoryKo[];

      if (categoryKoFromParam) {
        targetCategories = [categoryKoFromParam];
      } else {
        targetCategories = [...ALL_CATEGORIES];
      }

      let lastError: unknown | null = null;

      for (const cat of targetCategories) {
        const url = `${GET_ENDPOINT_MAP[cat]}/${id}`;
        try {
          const { data } = await api.get(url);

          const priceStr = data.price
            ? String(data.price).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            : "";

          const rawTags: unknown = data.tags ?? data.tag;

          const serverTags: string[] = Array.isArray(rawTags)
            ? (rawTags as ApiTag[])
                .map((t) => {
                  if (typeof t === "string") return t;
                  if (t && typeof t === "object" && "tagName" in t) {
                    const tagName = t.tagName;
                    return typeof tagName === "string" ? tagName : null;
                  }
                  return null;
                })
                .filter((t): t is string => typeof t === "string")
            : [];

          const normalizedTags: string[] = serverTags.map((tag) =>
            KO_TO_EN[tag] ? KO_TO_EN[tag] : tag
          );

          reset({
            vendorName: resolvedVendorName,
            address: resolvedAddress,
            category: cat,
            name: data.name ?? "",
            price: priceStr,
            detail: data.detail ?? "",
            availableTime:
              data.availableTime ??
              data.availableTimes ??
              data.availabletimes ??
              "",
            region: data.region ?? "",
            ownerName: resolvedVendorName || "",
            starCount: "0",
            subwayAccessible: false,
            diningAvailable: false,
            thumbnail: data.thumbnail ?? "",
            tags: normalizedTags,
            hallCapacity: data.capacity ? String(data.capacity) : "",
            minGuest: data.minGuest ? String(data.minGuest) : "",
            maxGuest: data.maxGuest ? String(data.maxGuest) : "",
            parkingCapacity: data.parkingCapacity
              ? String(data.parkingCapacity)
              : "",
            cateringType: data.cateringType ?? "",
            reservationPolicy: data.reservationPolicy ?? "",
            images:
              Array.isArray(data.images) && data.images.length > 0
                ? (data.images as ApiImage[])
                    .filter(
                      (img): img is Required<ApiImage> =>
                        typeof img.id === "number" &&
                        typeof img.url === "string"
                    )
                    .map((img) => ({
                      id: img.id,
                      src: img.url,
                    }))
                : [],
          });

          // 하나라도 성공하면 더 이상 다른 카테고리 호출하지 않음
          return;
        } catch (e: any) {
          lastError = e;
          const status = e?.response?.status;
          if (status !== 404) {
            console.error(
              `[상품 정보 확인 WebView] 상품 로딩 실패 (카테고리: ${cat}, status: ${status})`,
              e
            );
          }
          continue;
        }
      }

      console.error(
        "[상품 정보 확인 WebView] 모든 카테고리에서 상품을 찾지 못했습니다. id:",
        id,
        "lastError:",
        lastError
      );
    };

    loadProduct();
  }, [id, reset, resolvedAddress, resolvedVendorName, categoryParam]);

  // 태그 한글 변환
  const selectedTagsKo: string[] = (selectedTags as string[]).map(
    (en) => EN_TO_KO[en] || en
  );

  // 🔹 수정 페이지 이동 (모바일 상세와 동일한 로직)
  const handleGoEdit = () => {
    if (!id) return;

    let categoryForEdit: string | undefined;

    // 1순위: 실제 로드된 폼의 카테고리 값
    if (category) {
      categoryForEdit = KO_CATEGORY_TO_EN[category];
    }
    // 2순위: URL 파라미터 기반 보정
    else if (categoryParam) {
      const key1 = categoryParam;
      const key2 = categoryParam.toUpperCase();
      const key3 = categoryParam.toLowerCase();
      const categoryKoFromParam =
        EN_CATEGORY_TO_KO[key1] ??
        EN_CATEGORY_TO_KO[key2] ??
        EN_CATEGORY_TO_KO[key3];

      if (categoryKoFromParam) {
        categoryForEdit = KO_CATEGORY_TO_EN[categoryKoFromParam];
      } else {
        // 매핑 안 되면 그대로 사용
        categoryForEdit = categoryParam;
      }
    }

    if (!categoryForEdit) {
      alert("카테고리 정보를 찾을 수 없습니다. 다시 시도해 주세요.");
      return;
    }

    // 웹 수정 WebView 라우트
    navigate(`/my-page/owner/product/edit/${categoryForEdit}/${id}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F6FA] pb-12 mt-15">
      <div className="max-w-[720px] mx-auto px-6 py-10 space-y-10">
        {/* 타이틀 영역 */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#111827] tracking-[-0.3px]">
              상품 정보 확인
            </h1>
            <p className="mt-2 text-[14px] text-[#6B7280] tracking-[-0.2px]">
              등록된 웨딩 상품의 상세 정보를 확인하고, 필요 시 수정할 수 있어요.
            </p>
          </div>
        </header>

        {/* 이미지 섹션 */}
        <section className="bg-white rounded-2xl border border-[#ECEDEF] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:gallery-wide-linear"
                className="w-5 h-5 text-[#6B7280]"
              />
              <h2 className="text-[15px] font-semibold text-[#1E2124]">
                상품 이미지
              </h2>
            </div>
            <span className="text-[12px] text-[#9CA3AF]">
              최대 10장까지 등록 가능
            </span>
          </div>

          {images.length === 0 ? (
            <div className="h-[120px] flex items-center justify-center rounded-xl bg-[#F9FAFB] border border-dashed border-[#E5E7EB]">
              <p className="text-[13px] text-[#9AA1A6]">
                등록된 이미지가 없습니다.
              </p>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 overflow-x-auto h-[120px] bg-[#FAFAFC] rounded-xl p-3"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              onWheel={(e) => {
                const { deltaY, deltaX } = e;
                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                  e.currentTarget.scrollLeft += deltaY;
                }
              }}
            >
              {images.map((it: ImageItem, idx: number) => (
                <div
                  key={`${it.src}-${idx}`}
                  className="relative shrink-0 w-[100px] h-[100px] rounded-[10px] border border-[#E1E4E6] overflow-hidden bg-white"
                >
                  <img
                    src={it.src}
                    alt={`상품 이미지 ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 기본 정보 섹션 */}
        <section className="bg-white rounded-2xl border border-[#ECEDEF] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-5">
          <h2 className="text-[15px] font-semibold text-[#1E2124]">
            기본 정보
          </h2>

          {/* 업체명 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">업체명</span>
            <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#E8E8E8] bg-[#F8F8F8] flex items-center">
              <span className="text-[14px] text-[#111827]">
                {vendorName || "-"}
              </span>
            </div>
          </div>

          {/* 주소 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">주소</span>
            <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#E8E8E8] bg-[#F8F8F8] flex items-center">
              <span className="text-[14px] text-[#111827]">
                {address || "-"}
              </span>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">상품 카테고리</span>
            <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#E8E8E8] bg-[#F8F8F8] flex items-center">
              <span className="text-[14px] text-[#111827]">
                {category || "-"}
              </span>
            </div>
          </div>

          {/* 상품명 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">상품명</span>
            <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8] flex items-center">
              <span className="text-[14px] text-[#111827]">{name || "-"}</span>
            </div>
          </div>

          {/* 가격 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">가격</span>
            <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8] flex items-center">
              <span className="text-[14px] text-[#111827]">
                {price ? `${price}원` : "-"}
              </span>
            </div>
          </div>

          {/* 상품 기본 정보 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">상품 기본 정보</span>
            <div className="min-h-[80px] px-4 py-3 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8]">
              <pre className="whitespace-pre-wrap text-[14px] leading-[21px] text-[#111827]">
                {detail || "-"}
              </pre>
            </div>
          </div>
        </section>

        {/* 추가 정보 섹션 */}
        <section className="bg-white rounded-2xl border border-[#ECEDEF] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-5">
          <h2 className="text-[15px] font-semibold text-[#1E2124]">
            추가 정보
          </h2>

          {/* 이용 가능 시간 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">이용 가능 시간</span>
            <div className="min-h-[80px] px-4 py-3 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8]">
              <pre className="whitespace-pre-wrap text-[14px] leading-[21px] text-[#111827]">
                {availableTime || "-"}
              </pre>
            </div>
          </div>

          {/* 지역 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">지역</span>
            <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8] flex items-center">
              <span className="text-[14px] text-[#111827]">
                {region ? REGION_LABELS[region] : "-"}
              </span>
            </div>
          </div>

          {/* 태그 */}
          <div className="space-y-1">
            <span className="text-[13px] text-[#6B7280]">태그</span>
            <div className="min-h-[60px] px-4 py-3 rounded-lg border border-[#EEF0F2] bg-[#F9FAFB]">
              {selectedTagsKo.length === 0 ? (
                <span className="text-[13px] text-[#9AA1A6]">
                  선택된 태그가 없습니다.
                </span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedTagsKo.map((tagKo, idx) => (
                    <div
                      key={`${tagKo}-${idx}`}
                      className="inline-flex items-center gap-1 px-3 h-8 rounded-full border border-[#E8ECF0] bg-white text-[#1E2124] text-[12px]"
                    >
                      <Icon
                        icon="mdi:tag-outline"
                        className="w-3.5 h-3.5 text-[#9AA1A6]"
                      />
                      <span>{tagKo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 웨딩홀 전용 섹션 */}
        {category === "웨딩홀" && (
          <section className="bg-white rounded-2xl border border-[#ECEDEF] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-5">
            <h2 className="text-[15px] font-semibold text-[#1E2124]">
              웨딩홀 정보
            </h2>

            {/* 수용 인원 */}
            <div className="space-y-1">
              <span className="text-[13px] text-[#6B7280]">수용 인원</span>
              <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8] flex items-center">
                <span className="text-[14px] text-[#111827]">
                  {hallCapacity ? `${hallCapacity}명` : "-"}
                </span>
              </div>
            </div>

            {/* 최소 수용 인원 */}
            <div className="space-y-1">
              <span className="text-[13px] text-[#6B7280]">최소 수용 인원</span>
              <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8] flex items-center">
                <span className="text-[14px] text-[#111827]">
                  {minGuest ? `${minGuest}명` : "-"}
                </span>
              </div>
            </div>

            {/* 최대 수용 인원 */}
            <div className="space-y-1">
              <span className="text-[13px] text-[#6B7280]">최대 수용 인원</span>
              <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8] flex items-center">
                <span className="text-[14px] text-[#111827]">
                  {maxGuest ? `${maxGuest}명` : "-"}
                </span>
              </div>
            </div>

            {/* 주차 수용량 */}
            <div className="space-y-1">
              <span className="text-[13px] text-[#6B7280]">주차 수용량</span>
              <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8] flex items-center">
                <span className="text-[14px] text-[#111827]">
                  {parkingCapacity ? `${parkingCapacity}대` : "-"}
                </span>
              </div>
            </div>

            {/* 뷔페 타입 */}
            <div className="space-y-1">
              <span className="text-[13px] text-[#6B7280]">뷔페 타입</span>
              <div className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8] flex items-center">
                <span className="text-[14px] text-[#111827]">
                  {cateringType || "-"}
                </span>
              </div>
            </div>

            {/* 예약 규칙 */}
            <div className="space-y-1">
              <span className="text-[13px] text-[#6B7280]">예약 규칙</span>
              <div className="min-h-[80px] px-4 py-3 rounded-lg border border-[#D9D9D9] bg-[#F8F8F8]">
                <pre className="whitespace-pre-wrap text-[14px] leading-[21px] text-[#111827]">
                  {reservationPolicy || "-"}
                </pre>
              </div>
            </div>
          </section>
        )}

        {/* 하단 버튼 영역 */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-[44px] px-6 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#4B5563] hover:bg-[#F9FAFB]"
          >
            목록으로
          </button>
          <button
            type="button"
            onClick={handleGoEdit}
            className="h-[44px] px-6 rounded-xl bg-[#FF2233] text-white text-[14px] font-semibold hover:opacity-90 active:scale-95"
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebView;
