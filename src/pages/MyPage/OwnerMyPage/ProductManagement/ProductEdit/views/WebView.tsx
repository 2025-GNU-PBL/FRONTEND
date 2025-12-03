import React, { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { multipartApi } from "../../../../../../lib/api/multipartApi";
import api from "../../../../../../lib/api/axios";
import { useAppSelector } from "../../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../../store/userSlice";
import { toast } from "react-toastify";

// -------------------- 타입 --------------------
type ImageItem = { id?: number; src: string; file?: File };

type Region = "SEOUL" | "GYEONGGI" | "INCHEON" | "BUSAN";

const categories = ["웨딩홀", "스튜디오", "드레스", "메이크업"] as const;
type CategoryKo = (typeof categories)[number];

type FormValues = {
  // 공통
  vendorName: string; // 읽기 전용
  address: string; // 읽기 전용
  category: CategoryKo | null;
  name: string;
  price: string;
  detail: string;
  images: ImageItem[];

  // 공통 추가 필드
  availableTime: string; // 예: "09:00-11:00, 13:00-15:00"
  region: Region | "";
  ownerName: string;
  starCount: string;
  subwayAccessible: boolean;
  diningAvailable: boolean;
  thumbnail: string;
  tags: string[];

  // 웨딩홀 전용 필드
  hallCapacity: string; // capacity
  minGuest: string; // minGuest
  maxGuest: string; // maxGuest
  parkingCapacity: string; // parkingCapacity
  cateringType: string; // cateringType
  reservationPolicy: string; // reservationPolicy
};

// ---------- 서버 응답 타입 ----------
type ServerTag = string | { tagName?: string };

type ServerImage = {
  id: number;
  url: string;
};

type LoadedProduct = {
  name?: string;
  price?: number;
  detail?: string;
  availableTime?: string;
  availableTimes?: string;
  availabletimes?: string;
  region?: Region;
  thumbnail?: string;
  tags?: ServerTag[];
  tag?: ServerTag[];
  capacity?: number;
  minGuest?: number;
  maxGuest?: number;
  parkingCapacity?: number;
  cateringType?: string;
  reservationPolicy?: string;
  images?: ServerImage[];
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

const TAG_GROUPS_BY_CATEGORY: Record<CategoryKo, TagGroup[]> = {
  웨딩홀: HALL_TAG_GROUPS,
  스튜디오: STUDIO_TAG_GROUPS,
  드레스: DRESS_TAG_GROUPS,
  메이크업: MAKEUP_TAG_GROUPS,
};

// ko ↔ en 매핑 빠른 조회용
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

// 서버에서 요구하는 파트 키
const FILE_PART_KEY = "images";
const JSON_PART_KEY = "request";

const regions: Region[] = ["SEOUL", "GYEONGGI", "INCHEON", "BUSAN"];

// Region -> 프론트 표시용 한글 라벨 매핑 (생성 페이지와 동일)
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

// GET / PATCH 공통 엔드포인트 맵 (한글 카테고리 기준)
const GET_ENDPOINT_MAP: Record<CategoryKo, string> = {
  웨딩홀: "/api/v1/wedding-hall",
  스튜디오: "/api/v1/studio",
  드레스: "/api/v1/dress",
  메이크업: "/api/v1/makeup",
};

const PATCH_ENDPOINT_MAP: Record<CategoryKo, string> = GET_ENDPOINT_MAP;

// 리스트에서 넘어온 영어 카테고리 → 이 페이지에서 쓰는 한글 카테고리
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

const WebView: React.FC = () => {
  // URL 에서 category(영어), id 둘 다 받음: /edit/:category/:id
  const { id, category: categoryParam } = useParams<{
    id: string;
    category?: string;
  }>();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // Redux 의 userData에서 OWNER 정보 가져오기
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  // 업체명 / 주소를 OwnerData 기준으로 구성
  const resolvedVendorName = owner?.bzName ?? "";
  const resolvedAddress = owner
    ? `${owner.roadAddress || owner.jibunAddress} ${
        owner.detailAddress || ""
      }`.trim()
    : "";

  if (!owner) {
    console.warn(
      "[상품 수정] OWNER 정보가 없습니다. 로그인 상태 및 권한을 확인해주세요."
    );
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      // 공통
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
      // 웨딩홀 전용
      hallCapacity: "",
      minGuest: "",
      maxGuest: "",
      parkingCapacity: "",
      cateringType: "",
      reservationPolicy: "",
    },
  });

  const images = useWatch({ control, name: "images" }) || [];
  const category = useWatch({ control, name: "category" }) as CategoryKo | null;
  const selectedTags = useWatch({ control, name: "tags" }) || [];

  // -------------------- 상품 불러오기 (URL 카테고리 한 번만 호출) --------------------
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      let categoryKoFromParam: CategoryKo | undefined;

      if (categoryParam) {
        const key1 = categoryParam; // 그대로
        const key2 = categoryParam.toUpperCase(); // 대문자
        const key3 = categoryParam.toLowerCase(); // 소문자/슬러그

        categoryKoFromParam =
          EN_CATEGORY_TO_KO[key1] ??
          EN_CATEGORY_TO_KO[key2] ??
          EN_CATEGORY_TO_KO[key3];
      }

      if (!categoryKoFromParam) {
        console.error(
          "[상품 수정] URL 카테고리를 한글 카테고리로 매핑할 수 없습니다:",
          categoryParam
        );
        return;
      }

      const url = `${GET_ENDPOINT_MAP[categoryKoFromParam]}/${id}`;

      try {
        // 🔧 fetch → axios 인스턴스로 교체
        const { data } = await api.get<LoadedProduct>(url);

        // 가격 문자열 포맷
        const priceStr = data.price
          ? String(data.price).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          : "";

        // tags(string[]) 또는 예전 방식 tag(object[]) 모두 대응
        const rawTags: ServerTag[] | undefined = data.tags ?? data.tag;
        const serverTags: string[] = Array.isArray(rawTags)
          ? rawTags
              .map((t) => {
                if (typeof t === "string") return t;
                if (t && typeof t.tagName === "string") return t.tagName;
                return null;
              })
              .filter((t): t is string => t !== null)
          : [];

        // 한글이면 EN 코드로 변환, 이미 EN 이면 그대로 사용
        const normalizedTags: string[] = serverTags.map((tag) =>
          KO_TO_EN[tag] ? KO_TO_EN[tag] : tag
        );

        reset({
          vendorName: resolvedVendorName,
          address: resolvedAddress,
          category: categoryKoFromParam, // 실제 카테고리 설정
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
            data.images?.map((img) => ({
              id: img.id,
              src: img.url,
            })) ?? [],
        });
      } catch (e) {
        console.error("[상품 수정] 상품 로딩 실패:", e);
      }
    };

    loadProduct();
  }, [id, reset, resolvedAddress, resolvedVendorName, categoryParam]);

  const handlePickFiles = () => fileRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    const remain = Math.max(0, 10 - images.length);
    const next = list.slice(0, remain);

    Promise.all(
      next.map(
        (file) =>
          new Promise<ImageItem>((res) => {
            const reader = new FileReader();
            reader.onload = (e) => res({ src: String(e.target?.result), file });
            reader.readAsDataURL(file);
          })
      )
    ).then((previews) => {
      setValue("images", [...images, ...previews], {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setValue("images", next, { shouldDirty: true, shouldTouch: true });
  };

  const formatPriceInput = (v: string) => {
    const onlyNum = v.replace(/[^\d]/g, "");
    return onlyNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 카테고리 토글 시: 태그 초기화
  const handleCategoryToggle = (nextCategory: CategoryKo | null) => {
    setValue("category", nextCategory, {
      shouldDirty: true,
      shouldTouch: true,
    });

    setValue("tags", [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // 태그 토글
  const toggleTag = (enCode: string) => {
    const set = new Set(selectedTags as string[]);
    if (set.has(enCode)) set.delete(enCode);
    else set.add(enCode);
    setValue("tags", Array.from(set), { shouldDirty: true, shouldTouch: true });
  };

  // 현재 카테고리에 해당하는 태그 그룹들
  const currentTagGroups: TagGroup[] = category
    ? TAG_GROUPS_BY_CATEGORY[category]
    : [];

  // -------------------- PATCH (상품 수정) --------------------
  const onSubmit = async (values: FormValues) => {
    const priceNumber = Number(values.price.replace(/[^\d]/g, ""));

    // 공통 필수 체크 (업체명 / 주소 포함)
    if (
      !values.vendorName.trim() ||
      !values.address.trim() ||
      !values.category ||
      !values.name.trim() ||
      !(priceNumber >= 0) ||
      !values.detail.trim() ||
      images.length < 1 ||
      !values.availableTime.trim() ||
      !values.region
    ) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }

    const cat = values.category as CategoryKo;
    const endpoint = PATCH_ENDPOINT_MAP[cat];
    if (!endpoint) {
      toast.error("카테고리를 다시 확인해 주세요.");
      return;
    }

    // keepImagesIds (기존 이미지 유지)
    const keepImagesId = values.images
      .filter((i) => !i.file && i.id)
      .map((i) => i.id as number);

    // PATCH 바디 (업체명 / 주소 포함)
    const body: Record<string, unknown> = {
      vendorName: values.vendorName.trim(),
      address: values.address.trim(),
      name: values.name.trim(),
      detail: values.detail.trim(),
      price: priceNumber,
      availableTimes: values.availableTime.trim(),
      region: values.region,
      tags: (values.tags || []).map((t) => ({ tagName: t })),
      keepImagesId,
      options: [],
    };

    // 웨딩홀 카테고리일 때만 추가 정보 전송
    if (cat === "웨딩홀") {
      body.capacity = values.hallCapacity
        ? Number(values.hallCapacity)
        : undefined;
      body.minGuest = values.minGuest ? Number(values.minGuest) : undefined;
      body.maxGuest = values.maxGuest ? Number(values.maxGuest) : undefined;
      body.parkingCapacity = values.parkingCapacity
        ? Number(values.parkingCapacity)
        : undefined;
      body.cateringType = values.cateringType.trim() || undefined;
      body.reservationPolicy = values.reservationPolicy.trim() || undefined;
    }

    const fd = new FormData();
    fd.append(
      JSON_PART_KEY,
      new Blob([JSON.stringify(body)], { type: "application/json" }),
      "request.json"
    );

    values.images.forEach((img) => {
      if (img.file) fd.append(FILE_PART_KEY, img.file, img.file.name);
    });

    try {
      await multipartApi.patch(`${endpoint}/${id}`, fd);
      toast.success("수정 완료!");
      navigate("/my-page/owner/products/management");
    } catch (err) {
      console.error("[상품 수정] 수정 실패:", err);
      toast.error("수정 중 오류가 발생했습니다.");
    }
  };

  const canSubmit = isValid && !!category && images.length > 0;

  // 칩(알약) 한 개 렌더 – 생성 페이지와 동일 스타일
  const Chip: React.FC<{
    labelKo: string;
    valueEn: string;
    selected: boolean;
    onClick: () => void;
  }> = ({ labelKo, selected, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 h-9 rounded-full border text-[13px] transition-all",
        selected
          ? "bg-[#1f2937] border-[#1f2937] text-white shadow-sm"
          : "bg-white border-[#E2E6EA] text-[#1E2124] hover:border-[#cbd5e1]",
      ].join(" ")}
      aria-pressed={selected}
    >
      {labelKo}
    </button>
  );

  // 태그 그룹 카드 – 생성 페이지와 동일 스타일
  const TagGroupCard: React.FC<{ group: TagGroup }> = ({ group }) => (
    <div className="rounded-xl border border-[#EEF0F2] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            icon="mdi:tag-multiple-outline"
            className="w-5 h-5 text-[#6B7280]"
          />
          <h3 className="text-[15px] font-semibold text-[#1E2124]">
            {group.groupLabel}
          </h3>
        </div>
        <span className="text-[12px] text-[#9AA1A6]">
          선택 {group.options.filter((o) => selectedTags.includes(o.en)).length}{" "}
          / {group.options.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {group.options.map((opt) => (
          <Chip
            key={opt.en}
            labelKo={opt.ko}
            valueEn={opt.en}
            selected={selectedTags.includes(opt.en)}
            onClick={() => toggleTag(opt.en)}
          />
        ))}
      </div>
    </div>
  );

  // -------------------- 렌더링 (생성 페이지 디자인과 통일) --------------------
  return (
    <div className="w-full min-h-screen bg-[#F5F6FA] pb-10 mt-15">
      {/* 본문 */}
      <div className="max-w-[720px] mx-auto px-6 py-10 space-y-10">
        {/* 타이틀 – 생성 페이지와 유사 */}
        <div>
          <h2 className="text-[24px] font-bold text-[#111827]">
            상품 정보 수정
          </h2>
          <p className="mt-2 text-[14px] text-[#6B7280]">
            이미지, 기본 정보, 태그를 수정해 웨딩 상품 정보를 업데이트하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* 이미지 패널 */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold text-[#1E2124]">
                상품 이미지
              </div>
              <div className="text-[12px] text-[#9CA3AF]">
                최대 10장 등록 가능
              </div>
            </div>

            <div
              className="flex items-center gap-3 overflow-x-auto h-[110px] bg-[#FAFAFC] rounded-xl p-4"
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
              <button
                type="button"
                onClick={handlePickFiles}
                disabled={images.length >= 10 || isSubmitting}
                className="w-[90px] h-[90px] shrink-0 border border-[#D1D5DB] rounded-xl bg-white hover:bg-[#F7F7FA] flex flex-col items-center justify-center text-[#9CA3AF]"
              >
                <Icon icon="solar:camera-bold" className="w-6 h-6" />
                <div className="mt-1 text-[12px]">
                  {images.length}
                  /10
                </div>
              </button>

              {images.map((it, idx) => (
                <div
                  key={`${it.src}-${idx}`}
                  className="relative w-[90px] h-[90px] shrink-0 rounded-xl border border-[#E5E7EB] overflow-hidden bg-white"
                >
                  <img
                    src={it.src}
                    alt={`업로드 이미지 ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow"
                    aria-label="이미지 삭제"
                  >
                    <Icon
                      icon="meteor-icons:xmark"
                      className="w-3 h-3 text-[#374151]"
                    />
                  </button>
                </div>
              ))}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* 업체 정보 패널 */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
            <div className="text-[15px] font-semibold text-[#1E2124]">
              업체 정보
            </div>

            {/* 업체명 */}
            <div className="space-y-1">
              <label className="text-[13px] text-[#1E2124] font-medium">
                업체명
              </label>
              <input
                type="text"
                readOnly
                aria-readonly="true"
                {...register("vendorName")}
                className="w-full h-[44px] px-3 rounded-lg bg-[#F6F7FB] border border-[#E8E8E8] text-[14px] text-[#4B5563] pointer-events-none select-none"
              />
            </div>

            {/* 주소 */}
            <div className="space-y-1">
              <label className="text-[13px] text-[#1E2124] font-medium">
                주소
              </label>
              <input
                type="text"
                readOnly
                aria-readonly="true"
                {...register("address")}
                className="w-full h-[44px] px-3 rounded-lg bg-[#F6F7FB] border border-[#E8E8E8] text-[14px] text-[#4B5563] pointer-events-none select-none"
              />
            </div>
          </div>

          {/* 기본 정보 패널 */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
            <div className="text-[15px] font-semibold text-[#1E2124]">
              기본 정보
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <label className="text-[14px] font-medium text-[#1E2124]">
                상품 카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const selected = c === category;
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleCategoryToggle(selected ? null : c)}
                      className={[
                        "h-[34px] px-4 rounded-full border text-[13px]",
                        selected
                          ? "bg-[#FFE8EA] border-[#FF5B68] text-[#FF3344]"
                          : "bg-white border-[#D1D5DB] text-[#111827]",
                      ].join(" ")}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 상품명 */}
            <div className="space-y-1">
              <label className="text-[14px] font-medium text-[#1E2124]">
                상품명
              </label>
              <input
                type="text"
                placeholder="상품명을 입력해 주세요"
                {...register("name", { required: true })}
                disabled={isSubmitting}
                className="w-full h-[44px] px-3 rounded-lg border border-[#E8E8E8] bg-white text-[14px] placeholder:text-[#C1C1C1] outline-none"
              />
            </div>

            {/* 가격 */}
            <div className="space-y-1">
              <label className="text-[14px] font-medium text-[#1E2124]">
                가격
              </label>
              <Controller
                control={control}
                name="price"
                rules={{
                  required: true,
                  validate: (v) =>
                    Number(v.replace(/[^\d]/g, "")) >= 0 &&
                    /^\d[\d,]*$/.test(v.replace(/\s/g, "")),
                }}
                render={({ field: { value, onChange } }) => (
                  <input
                    inputMode="numeric"
                    placeholder="가격을 입력해 주세요"
                    className="w-full h-[44px] px-3 rounded-lg border border-[#E8E8E8] bg-white text-[14px] placeholder:text-[#C1C1C1] outline-none"
                    value={value || ""}
                    onChange={(e) => onChange(formatPriceInput(e.target.value))}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            {/* 상품 기본 정보 */}
            <div className="space-y-1">
              <label className="text-[14px] font-medium text-[#1E2124]">
                상품 기본 정보
              </label>
              <textarea
                placeholder={
                  "상품 기본 정보에 대해 작성해주세요\nex) 상품 구성 : 촬영용 드레스 3벌 + 본식 드레스 1벌\n상담 소요 시간 : 60분  가봉 소요 시 : 90분"
                }
                {...register("detail")}
                disabled={isSubmitting}
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-[#D9D9D9] bg-white text-[14px] resize-none outline-none placeholder:text-[#D9D9D9]"
              />
            </div>
          </div>

          {/* 추가 정보 패널 (availableTime + region) */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
            <div className="text-[15px] font-semibold text-[#1E2124]">
              추가 정보
            </div>

            {/* 이용 가능 시간 */}
            <div className="space-y-1">
              <label className="text-[14px] font-medium text-[#1E2124]">
                이용 가능 시간
              </label>
              <textarea
                placeholder="예: 09:00-11:00, 13:00-15:00"
                {...register("availableTime", { required: true })}
                disabled={isSubmitting}
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-[#D9D9D9] text-[14px] resize-none outline-none placeholder:text-[#D9D9D9]"
              />
            </div>

            {/* 지역 – 한글 라벨 매핑 */}
            <div className="space-y-1">
              <label className="text-[14px] font-medium text-[#1E2124]">
                지역
              </label>
              <select
                {...register("region", { required: true })}
                disabled={isSubmitting}
                className="w-full h-[44px] px-3 rounded-lg border border-[#D9D9D9] text-[14px] bg-white outline-none"
              >
                <option value="">지역 선택</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {REGION_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 태그 패널 */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold text-[#1E2124]">
                태그 선택
              </div>
              <div className="text-[12px] text-[#9AA1A6]">
                카테고리 선택 후 태그 선택 가능
              </div>
            </div>

            {!category ? (
              <div className="w-full rounded-xl bg-[#F8FAFC] border border-[#EEF0F2] p-4 text-[14px] text-[#9CA3AF]">
                카테고리를 먼저 선택해 주세요.
              </div>
            ) : (
              <div className="space-y-4">
                {currentTagGroups.map((g) => (
                  <TagGroupCard key={g.groupLabel} group={g} />
                ))}

                {/* 선택된 태그 프리뷰 */}
                <div className="rounded-xl border border-[#EEF0F2] bg-[#FAFAFC] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[13px] text-[#6B7280]">
                    <Icon icon="mdi:check-circle-outline" className="w-4 h-4" />
                    선택된 태그
                    <span className="ml-1 text-[#9AA1A6]">
                      ({selectedTags.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedTags.length === 0 ? (
                      <span className="text-[13px] text-[#A0A5AA]">
                        아직 선택된 태그가 없습니다.
                      </span>
                    ) : (
                      selectedTags.map((en) => (
                        <span
                          key={en}
                          className="inline-flex items-center gap-1 px-3 h-8 rounded-full border border-[#E8ECF0] bg-[#F6F8FA] text-[#1E2124] text-[12px]"
                        >
                          {EN_TO_KO[en] || en}
                          <button
                            type="button"
                            aria-label="태그 삭제"
                            onClick={() => toggleTag(en)}
                            disabled={isSubmitting}
                            className="ml-1 w-[18px] h-[18px] flex items-center justify-center bg-white border border-[#F2F2F2] rounded-full"
                          >
                            <Icon
                              icon="meteor-icons:xmark"
                              className="w-3 h-3 text-[#3C4144]"
                            />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 웨딩홀 전용 섹션 */}
          {category === "웨딩홀" && (
            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
              <div className="text-[15px] font-semibold text-[#1E2124]">
                웨딩홀 정보
              </div>

              {/* 수용 인원 */}
              <div className="space-y-1">
                <label className="text-[14px] font-medium text-[#1E2124]">
                  수용 인원
                </label>
                <input
                  inputMode="numeric"
                  placeholder="예: 200"
                  {...register("hallCapacity")}
                  disabled={isSubmitting}
                  className="w-full h-[44px] px-3 rounded-lg border border-[#D9D9D9] text-[14px] bg-white outline-none placeholder:text-[#D9D9D9]"
                />
              </div>

              {/* 최소 수용 인원 */}
              <div className="space-y-1">
                <label className="text-[14px] font-medium text-[#1E2124]">
                  최소 수용 인원
                </label>
                <input
                  inputMode="numeric"
                  placeholder="예: 50"
                  {...register("minGuest")}
                  disabled={isSubmitting}
                  className="w-full h-[44px] px-3 rounded-lg border border-[#D9D9D9] text-[14px] bg-white outline-none placeholder:text-[#D9D9D9]"
                />
              </div>

              {/* 최대 수용 인원 */}
              <div className="space-y-1">
                <label className="text-[14px] font-medium text-[#1E2124]">
                  최대 수용 인원
                </label>
                <input
                  inputMode="numeric"
                  placeholder="예: 300"
                  {...register("maxGuest")}
                  disabled={isSubmitting}
                  className="w-full h-[44px] px-3 rounded-lg border border-[#D9D9D9] text-[14px] bg-white outline-none placeholder:text-[#D9D9D9]"
                />
              </div>

              {/* 주차 수용량 */}
              <div className="space-y-1">
                <label className="text-[14px] font-medium text-[#1E2124]">
                  주차 수용량
                </label>
                <input
                  inputMode="numeric"
                  placeholder="예: 100"
                  {...register("parkingCapacity")}
                  disabled={isSubmitting}
                  className="w-full h-[44px] px-3 rounded-lg border border-[#D9D9D9] text-[14px] bg-white outline-none placeholder:text-[#D9D9D9]"
                />
              </div>

              {/* 뷔페 타입 */}
              <div className="space-y-1">
                <label className="text-[14px] font-medium text-[#1E2124]">
                  뷔페 타입
                </label>
                <input
                  type="text"
                  placeholder="예: 뷔페 / 테이블 / 뷔페+테이블"
                  {...register("cateringType")}
                  disabled={isSubmitting}
                  className="w-full h-[44px] px-3 rounded-lg border border-[#D9D9D9] text-[14px] bg-white outline-none placeholder:text-[#D9D9D9]"
                />
              </div>

              {/* 예약 규칙 */}
              <div className="space-y-1">
                <label className="text-[14px] font-medium text-[#1E2124]">
                  예약 규칙
                </label>
                <textarea
                  placeholder="예: 예약 및 취소/환불 규정을 입력해 주세요."
                  {...register("reservationPolicy")}
                  disabled={isSubmitting}
                  className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-[#D9D9D9] text-[14px] bg-white resize-none outline-none placeholder:text-[#D9D9D9]"
                />
              </div>
            </div>
          )}

          {/* 버튼 영역 – 생성 페이지와 동일 레이아웃, 텍스트만 수정 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-[44px] px-6 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#4B5563]"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={[
                "h-[44px] px-6 rounded-xl text-[14px] font-semibold",
                !isSubmitting && canSubmit
                  ? "bg-[#FF2233] text-white active:scale-95"
                  : "bg-[#EFEFF1] text-[#A8AEB2]",
              ].join(" ")}
            >
              {isSubmitting ? "수정 중..." : "수정 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WebView;
