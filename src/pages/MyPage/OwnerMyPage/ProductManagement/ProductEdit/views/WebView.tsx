import React, { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { multipartApi } from "../../../../../../lib/api/multipartApi";
import { useAppSelector } from "../../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../../store/userSlice";
import MyPageHeader from "../../../../../../components/MyPageHeader";

// -------------------- 타입 --------------------
type ImageItem = { id?: number; src: string; file?: File };

type Region = "SEOUL" | "GYEONGGI" | "INCHEON" | "BUSAN";

type FormValues = {
  // 공통
  vendorName: string; // 읽기 전용
  address: string; // 읽기 전용
  category: string | null;
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

const categories = ["웨딩홀", "스튜디오", "드레스", "메이크업"] as const;
type CategoryKo = (typeof categories)[number];

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

// 🔁 리스트에서 넘어온 영어 카테고리 → 이 페이지에서 쓰는 한글 카테고리
const EN_CATEGORY_TO_KO: Record<string, CategoryKo> = {
  WEDDING_HALL: "웨딩홀",
  WEDDING: "웨딩홀", // 혹시 WEDDING 으로 오는 경우 대비
  STUDIO: "스튜디오",
  DRESS: "드레스",
  MAKEUP: "메이크업",
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

  // -------------------- 상품 불러오기 --------------------
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      // ✅ URL 의 영어 categoryParam 을 한글 카테고리로 변환
      const categoryKoFromParam: CategoryKo | undefined = categoryParam
        ? EN_CATEGORY_TO_KO[categoryParam]
        : undefined;

      let targetCategories: CategoryKo[];

      if (categoryKoFromParam) {
        // ✅ 해당 카테고리 하나만 호출
        targetCategories = [categoryKoFromParam];
      } else {
        // 파라미터가 없거나 매핑 실패하면, 전체 시도 (fallback)
        targetCategories = categories as CategoryKo[];
      }

      for (const cat of targetCategories) {
        const url = `${GET_ENDPOINT_MAP[cat]}/${id}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            continue;
          }

          const data = await res.json();

          // 가격 문자열 포맷
          const priceStr = data.price
            ? String(data.price).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            : "";

          reset({
            vendorName: resolvedVendorName,
            address: resolvedAddress,
            category: cat, // ✅ 실제로 성공한 카테고리(한글)로 설정
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
            tags: data.tags?.map((t: any) => t.tagName) ?? [],
            hallCapacity: data.capacity ? String(data.capacity) : "",
            minGuest: data.minGuest ? String(data.minGuest) : "",
            maxGuest: data.maxGuest ? String(data.maxGuest) : "",
            parkingCapacity: data.parkingCapacity
              ? String(data.parkingCapacity)
              : "",
            cateringType: data.cateringType ?? "",
            reservationPolicy: data.reservationPolicy ?? "",
            images:
              data.images?.map((img: any) => ({
                id: img.id,
                src: img.url,
              })) ?? [],
          });

          // ✅ 한 번 성공하면 나머지 카테고리는 호출하지 않음
          break;
        } catch (e) {
          console.error("[상품 수정] 상품 로딩 실패:", e);
        }
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

  // 수평 스크롤용 wheel 핸들러
  const handleHorizontalWheel: React.WheelEventHandler<HTMLDivElement> = (
    e
  ) => {
    const { deltaY, deltaX } = e;
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      e.currentTarget.scrollLeft += deltaY;
      e.preventDefault();
    }
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

    // 공통 필수 체크
    if (
      !values.category ||
      !values.name.trim() ||
      !(priceNumber >= 0) ||
      !values.detail.trim() ||
      images.length < 1 ||
      !values.availableTime.trim() ||
      !values.region
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    const cat = values.category as CategoryKo;
    const endpoint = PATCH_ENDPOINT_MAP[cat];
    if (!endpoint) {
      alert("카테고리를 다시 확인해 주세요.");
      return;
    }

    // keepImagesIds (기존 이미지 유지)
    const keepImagesIds = values.images
      .filter((i) => !i.file && i.id)
      .map((i) => i.id as number);

    // PATCH 바디
    const body: Record<string, unknown> = {
      name: values.name.trim(),
      detail: values.detail.trim(),
      price: priceNumber,
      availableTime: values.availableTime.trim(),
      region: values.region,
      tags: (values.tags || []).map((t) => ({ tagName: t })),
      keepImagesIds,
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
      alert("수정 완료!");
      navigate("/my-page/owner/products/management");
    } catch (err) {
      console.error("[상품 수정] 수정 실패:", err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const canSubmit = isValid && !!category && images.length > 0;

  // 칩(알약) 한 개 렌더
  const Chip: React.FC<{
    labelKo: string;
    valueEn: string;
    selected: boolean;
    onClick: () => void;
  }> = ({ labelKo, selected, onClick }) => {
    return (
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
        <span className="align-middle">{labelKo}</span>
      </button>
    );
  };

  // 태그 그룹 카드 렌더
  const TagGroupCard: React.FC<{ group: TagGroup }> = ({ group }) => {
    return (
      <div className="rounded-[12px] border border-[#EEF0F2] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon="mdi:tag-multiple-outline"
              className="w-5 h-5 text-[#6B7280]"
            />
            <h3 className="text-[14px] font-semibold text-[#1E2124]">
              {group.groupLabel}
            </h3>
          </div>
          <span className="text-[12px] text-[#9AA1A6]">
            선택{" "}
            {group.options.filter((o) => selectedTags.includes(o.en)).length} /{" "}
            {group.options.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {group.options.map((opt) => {
            const sel = selectedTags.includes(opt.en);
            return (
              <Chip
                key={opt.en}
                labelKo={opt.ko}
                valueEn={opt.en}
                selected={sel}
                onClick={() => toggleTag(opt.en)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 상단 헤더 */}
      <div className="w-full bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1040px] mx-auto">
          <MyPageHeader
            title="상품 수정"
            onBack={() => navigate(-1)}
            showMenu
          />
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-[1040px] mx-auto px-6 py-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-8"
        >
          {/* 상단 타이틀 */}
          <div>
            <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">
              상품 정보를 수정하세요
            </h1>
            <p className="mt-1 text-[13px] text-[#6B7280] tracking-[-0.2px]">
              이미지, 가격, 상세 정보 등 모든 내용을 이 화면에서 변경할 수
              있어요.
            </p>
          </div>

          {/* 이미지 업로드 */}
          <section>
            <label className="text-[14px] font-medium text-[#1E2124]">
              상품 이미지
            </label>
            <div
              className="mt-3 flex items-center gap-3 overflow-x-auto"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              onWheel={handleHorizontalWheel}
            >
              <button
                type="button"
                onClick={handlePickFiles}
                className="shrink-0 w-[104px] h-[104px] rounded-[10px] border border-[#D1D5DB] bg-[#F9FAFB] flex flex-col items-center justify-center"
                aria-label="이미지 업로드"
                disabled={images.length >= 10 || isSubmitting}
              >
                <Icon
                  icon="solar:camera-bold"
                  className="w-6 h-6 text-[#9CA3AF]"
                />
                <span className="mt-1 text-[12px] text-[#9CA3AF]">
                  {images.length}/10
                </span>
              </button>

              {images.map((it, idx) => (
                <div
                  key={`${it.src}-${idx}`}
                  className="relative shrink-0 w-[104px] h-[104px] rounded-[10px] border border-[#E5E7EB] overflow-hidden"
                >
                  <img
                    src={it.src}
                    alt={`업로드 이미지 ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 w-[22px] h-[22px] flex items-center justify-center bg-white border border-[#E5E7EB] rounded-full shadow-sm"
                    aria-label="이미지 삭제"
                    disabled={isSubmitting}
                  >
                    <Icon
                      icon="meteor-icons:xmark"
                      className="w-3.5 h-3.5 text-[#4B5563]"
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
          </section>

          {/* 기본 정보 섹션 */}
          <section className="flex flex-col gap-5">
            {/* 업체명 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#111827]">업체명</label>
              <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB]">
                <input
                  type="text"
                  readOnly
                  aria-readonly="true"
                  tabIndex={-1}
                  className="w-full text-[14px] text-[#4B5563] outline-none bg-transparent pointer-events-none select-none"
                  {...register("vendorName")}
                />
              </div>
            </div>

            {/* 주소 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#111827]">주소</label>
              <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB]">
                <input
                  type="text"
                  readOnly
                  aria-readonly="true"
                  tabIndex={-1}
                  className="w-full text-[14px] text-[#4B5563] outline-none bg-transparent pointer-events-none select-none"
                  {...register("address")}
                />
              </div>
            </div>

            {/* 카테고리 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#111827]">
                상품 카테고리
              </label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((c) => {
                  const selected = c === category;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={[
                        "h-[34px] px-3 rounded-full border text-[13px] transition-colors",
                        selected
                          ? "bg-[#FFF2F2] border-[#FF5B68] text-[#FF2233]"
                          : "bg-white border-[#D1D5DB] text-[#111827]",
                      ].join(" ")}
                      onClick={() => handleCategoryToggle(selected ? null : c)}
                      disabled={isSubmitting}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 상품명 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#111827]">상품명</label>
              <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#D1D5DB]">
                <input
                  type="text"
                  placeholder="상품명을 입력해 주세요"
                  className="w-full text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                  {...register("name", { required: true })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 가격 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#111827]">가격</label>
              <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#D1D5DB]">
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
                      className="w-full text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                      value={value || ""}
                      onChange={(e) =>
                        onChange(formatPriceInput(e.target.value))
                      }
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>
            </div>

            {/* 상품 기본 정보 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#111827]">
                상품 기본 정보
              </label>
              <div className="h-[140px] px-4 py-3 rounded-[8px] border border-[#D1D5DB]">
                <textarea
                  placeholder={
                    "상품 기본 정보에 대해 작성해주세요\nex) 상품 구성 : 촬영용 드레스 3벌 + 본식 드레스 1벌\n상담 소요 시간 : 60분  가봉 소요 시 : 90분"
                  }
                  className="w-full h-full resize-none text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                  {...register("detail")}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* 추가 정보 섹션 */}
          <section className="flex flex-col gap-5">
            <h2 className="text-[16px] font-semibold text-[#1E2124]">
              추가 정보
            </h2>

            {/* availableTime */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#111827]">
                이용 가능 시간 (availableTime)
              </label>
              <div className="h-[100px] px-4 py-2 rounded-[8px] border border-[#D1D5DB]">
                <textarea
                  placeholder="예: 09:00-11:00, 13:00-15:00"
                  className="w-full h-full resize-none text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                  {...register("availableTime", { required: true })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* region */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#111827]">
                지역 (region)
              </label>
              <div className="h-[44px] flex items-center px-3 rounded-[8px] border border-[#D1D5DB]">
                <select
                  className="w-full bg-transparent outline-none text-[14px]"
                  {...register("region", { required: true })}
                  disabled={isSubmitting}
                >
                  <option value="">지역 선택</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 태그 그룹 */}
            <div className="flex flex-col gap-3">
              <label className="text-[14px] text-[#111827]">태그 선택</label>

              {!category ? (
                <div className="rounded-[12px] border border-[#EEF0F2] bg-[#F9FAFB] text-[#9CA3AF] p-4 text-[13px]">
                  카테고리를 먼저 선택해 주세요.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {currentTagGroups.map((g) => (
                    <TagGroupCard key={g.groupLabel} group={g} />
                  ))}

                  {/* 선택된 태그 프리뷰 */}
                  <div className="rounded-[12px] border border-[#EEF0F2] bg-white p-3">
                    <div className="mb-2 text-[13px] text-[#6B7280] flex items-center gap-1">
                      <Icon
                        icon="mdi:check-circle-outline"
                        className="w-4 h-4"
                      />
                      선택된 태그
                      <span className="ml-1 text-[#9AA1A6]">
                        ({selectedTags.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.length === 0 ? (
                        <span className="text-[13px] text-[#9AA1A6]">
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
                              className="ml-1 w-[18px] h-[18px] flex items-center justify-center bg-white border border-[#F2F2F2] rounded-full"
                              disabled={isSubmitting}
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
          </section>

          {/* 웨딩홀 전용 섹션 */}
          {category === "웨딩홀" && (
            <section className="flex flex-col gap-5">
              <h2 className="text-[16px] font-semibold text-[#1E2124]">
                웨딩홀 정보
              </h2>

              {/* 수용 인원 */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] text-[#111827]">
                  수용 인원 (capacity)
                </label>
                <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#D1D5DB]">
                  <input
                    inputMode="numeric"
                    placeholder="예: 200"
                    className="w-full text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                    {...register("hallCapacity")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 최소 수용 인원 */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] text-[#111827]">
                  최소 수용 인원 (minGuest)
                </label>
                <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#D1D5DB]">
                  <input
                    inputMode="numeric"
                    placeholder="예: 50"
                    className="w-full text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                    {...register("minGuest")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 최대 수용 인원 */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] text-[#111827]">
                  최대 수용 인원 (maxGuest)
                </label>
                <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#D1D5DB]">
                  <input
                    inputMode="numeric"
                    placeholder="예: 300"
                    className="w-full text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                    {...register("maxGuest")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 주차 수용량 */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] text-[#111827]">
                  주차 수용량 (parkingCapacity)
                </label>
                <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#D1D5DB]">
                  <input
                    inputMode="numeric"
                    placeholder="예: 100"
                    className="w-full text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                    {...register("parkingCapacity")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 뷔페 타입 */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] text-[#111827]">
                  뷔페 타입 (cateringType)
                </label>
                <div className="h-[44px] flex items-center px-4 rounded-[8px] border border-[#D1D5DB]">
                  <input
                    type="text"
                    placeholder="예: 뷔페 / 테이블 / 뷔페+테이블"
                    className="w-full text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                    {...register("cateringType")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 예약 규칙 */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] text-[#111827]">
                  예약 규칙 (reservationPolicy)
                </label>
                <div className="h-[120px] px-4 py-2 rounded-[8px] border border-[#D1D5DB]">
                  <textarea
                    placeholder="예: 예약 및 취소/환불 규정을 입력해 주세요."
                    className="w-full h-full resize-none text-[14px] placeholder:text-[#D1D5DB] outline-none bg-transparent"
                    {...register("reservationPolicy")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </section>
          )}

          {/* 하단 버튼 */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={[
                "h-[44px] px-8 rounded-[12px] text-[14px] font-semibold",
                !isSubmitting && canSubmit
                  ? "bg-[#FF2233] text-white active:scale-95"
                  : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed",
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
