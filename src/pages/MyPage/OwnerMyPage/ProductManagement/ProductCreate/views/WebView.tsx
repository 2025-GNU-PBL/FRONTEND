// === 전체 파일 리뉴얼 버전 ===
// WebView.tsx (단일 스크롤 + 고급 패널 레이아웃)

import React, { useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { multipartApi } from "../../../../../../lib/api/multipartApi";
import { useAppSelector } from "../../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../../store/userSlice";

// ---------------------------------------------------------------------

type ImageItem = { src: string; file?: File };

type Region =
  | "SEOUL"
  | "GYEONGGI"
  | "INCHEON"
  | "BUSAN"
  | "DAEGU"
  | "GWANGJU"
  | "DAEJEON"
  | "ULSAN"
  | "SEJONG"
  | "GANGWON"
  | "CHUNGBUK"
  | "CHUNGNAM"
  | "JEONBUK"
  | "JEONNAM"
  | "GYEONGBUK"
  | "GYEONGNAM"
  | "JEJU";

type FormValues = {
  vendorName: string;
  address: string;
  category: string | null;
  name: string;
  price: string;
  basicInfo: string;
  detail: string;
  images: ImageItem[];

  availableTime: string;
  region: Region | "";
  ownerName: string;
  starCount: string;
  subwayAccessible: boolean;
  diningAvailable: boolean;
  thumbnail: string;
  tags: string[];
};

const categories = ["웨딩홀", "스튜디오", "드레스", "메이크업"] as const;

// ---------------------------------------------------------------------

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

const TAG_GROUPS_BY_CATEGORY: Record<(typeof categories)[number], TagGroup[]> =
  {
    웨딩홀: HALL_TAG_GROUPS,
    스튜디오: STUDIO_TAG_GROUPS,
    드레스: DRESS_TAG_GROUPS,
    메이크업: MAKEUP_TAG_GROUPS,
  };

// 매핑
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
  }, {});

const EN_TO_KO: Record<string, string> = Object.keys(KO_TO_EN).reduce(
  (acc, ko) => {
    acc[KO_TO_EN[ko]] = ko;
    return acc;
  },
  {}
);

// ---------------------------------------------------------------------

const FILE_PART_KEY = "images";
const JSON_PART_KEY = "request";

const regions: Region[] = ["SEOUL", "GYEONGGI", "INCHEON", "BUSAN"];

// OWNER 판별
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

// ---------------------------------------------------------------------
// ★★★ 메인 컴포넌트 시작 (레이아웃 전체 리프레시 완료) ★★★
// ---------------------------------------------------------------------

const WebView: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const resolvedVendorName = owner?.bzName ?? "";
  const resolvedAddress = owner
    ? `${owner.roadAddress || owner.jibunAddress} ${
        owner.detailAddress || ""
      }`.trim()
    : "";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      vendorName: resolvedVendorName,
      address: resolvedAddress,
      category: null,
      name: "",
      price: "",
      basicInfo: "",
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
    },
  });

  const images = useWatch({ control, name: "images" }) || [];
  const category = useWatch({ control, name: "category" }) || null;
  const selectedTags = useWatch({ control, name: "tags" }) || [];

  // ---------------------------------------------------------------------
  // 이미지 관련 핸들링
  // ---------------------------------------------------------------------

  const handlePickFiles = () => fileRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
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
    ).then((previews) =>
      setValue("images", [...images, ...previews], {
        shouldDirty: true,
        shouldTouch: true,
      })
    );
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setValue("images", next, { shouldDirty: true, shouldTouch: true });
  };

  const formatPrice = (v: string) => {
    const onlyNum = v.replace(/[^\d]/g, "");
    return onlyNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // ---------------------------------------------------------------------

  const handleCategoryToggle = (c: (typeof categories)[number] | null) => {
    setValue("category", c, { shouldDirty: true, shouldTouch: true });
    setValue("tags", [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const toggleTag = (en: string) => {
    const set = new Set(selectedTags);
    if (set.has(en)) set.delete(en);
    else set.add(en);
    setValue("tags", Array.from(set), { shouldDirty: true, shouldTouch: true });
  };

  // ---------------------------------------------------------------------
  // 제출
  // ---------------------------------------------------------------------

  const onSubmit = async (values: FormValues) => {
    const priceNumber = Number(values.price.replace(/[^\d]/g, ""));

    if (
      !values.category ||
      !values.name ||
      !values.detail ||
      !values.availableTime ||
      !values.region ||
      images.length === 0
    ) {
      alert("필수 항목을 입력해 주세요.");
      return;
    }

    let endpoint = "";
    switch (values.category) {
      case "웨딩홀":
        endpoint = "/api/v1/wedding-hall";
        break;
      case "스튜디오":
        endpoint = "/api/v1/studio";
        break;
      case "드레스":
        endpoint = "/api/v1/dress";
        break;
      case "메이크업":
        endpoint = "/api/v1/makeup";
        break;
    }

    const body = {
      name: values.name.trim(),
      address: values.address.trim(),
      detail: values.detail.trim(),
      price: priceNumber,
      availableTime: values.availableTime.trim(),
      thumbnail: values.thumbnail.trim() || undefined,
      region: values.region,
      tags: values.tags.map((t) => ({ tagName: t })),
    };

    const formData = new FormData();
    formData.append(
      JSON_PART_KEY,
      new Blob([JSON.stringify(body)], { type: "application/json" }),
      "request.json"
    );

    values.images.forEach((i) => {
      if (i.file) formData.append(FILE_PART_KEY, i.file, i.file.name);
    });

    try {
      await multipartApi.post(endpoint, formData);
      alert("등록 완료!");
      navigate("/my-page/owner/products/management");
    } catch (e) {
      alert("등록 중 오류가 발생했습니다.");
      console.error(e);
    }
  };

  const canSubmit = isValid && !!category && images.length > 0;

  const currentTagGroups = category ? TAG_GROUPS_BY_CATEGORY[category] : [];

  // ---------------------------------------------------------------------
  // UI 요소들 (Chip, TagGroupCard)
  // ---------------------------------------------------------------------

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
    >
      {labelKo}
    </button>
  );

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
          {group.options.filter((o) => selectedTags.includes(o.en)).length} /{" "}
          {group.options.length}
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

  // ---------------------------------------------------------------------
  // ★★★ 전체 UI 렌더링 ★★★
  // ---------------------------------------------------------------------

  return (
    <div className="w-full min-h-screen bg-[#F5F6FA] pb-20">
      {/* 헤더 */}
      <div className="w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-[20]">
        <div className="max-w-[1040px] mx-auto h-[64px] px-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6]"
          >
            <Icon icon="mdi:arrow-left" className="w-5 h-5 text-[#111827]" />
          </button>
          <h1 className="text-[18px] font-semibold text-[#111827]">
            상품 추가
          </h1>
          <div className="w-8 h-8" />
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-[720px] mx-auto px-6 py-10 space-y-10">
        {/* 타이틀 */}
        <div>
          <h2 className="text-[24px] font-bold text-[#111827]">
            신규 상품 등록
          </h2>
          <p className="mt-2 text-[14px] text-[#6B7280]">
            이미지, 기본 정보, 상세 설명, 태그를 입력해 웨딩 상품을 등록하세요.
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
                  e.preventDefault();
                }
              }}
            >
              <button
                type="button"
                onClick={handlePickFiles}
                disabled={images.length >= 10}
                className="w-[90px] h-[90px] shrink-0 border border-[#D1D5DB] rounded-xl bg-white hover:bg-[#F7F7FA] flex flex-col items-center justify-center text-[#9CA3AF]"
              >
                <Icon icon="solar:camera-bold" className="w-6 h-6" />
                <div className="mt-1 text-[12px]">{images.length}/10</div>
              </button>

              {images.map((it, idx) => (
                <div
                  key={idx}
                  className="relative w-[90px] h-[90px] shrink-0 rounded-xl border border-[#E5E7EB] overflow-hidden bg-white"
                >
                  <img src={it.src} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow"
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
                readOnly
                {...register("vendorName")}
                className="w-full h-[44px] px-3 rounded-lg bg-[#F6F7FB] border border-[#E8E8E8] text-[14px] text-[#4B5563]"
              />
            </div>

            {/* 주소 */}
            <div className="space-y-1">
              <label className="text-[13px] text-[#1E2124] font-medium">
                주소
              </label>
              <input
                readOnly
                {...register("address")}
                className="w-full h-[44px] px-3 rounded-lg bg-[#F6F7FB] border border-[#E8E8E8] text-[14px] text-[#4B5563]"
              />
            </div>
          </div>

          {/* 상품 기본 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
            <div className="text-[15px] font-semibold text-[#1E2124]">
              기본 정보
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <label className="text-[14px] font-medium text-[#1E2124]">
                카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const selected = category === c;
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
                {...register("name", { required: true })}
                placeholder="상품명을 입력해 주세요"
                className="w-full h-[44px] px-3 rounded-lg border border-[#E8E8E8] bg-white text-[14px] placeholder:text-[#C1C1C1]"
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
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <input
                    value={value}
                    placeholder="가격을 입력해 주세요"
                    onChange={(e) => onChange(formatPrice(e.target.value))}
                    className="w-full h-[44px] px-3 rounded-lg border border-[#E8E8E8] bg-white text-[14px]"
                  />
                )}
              />
            </div>
          </div>

          {/* 상세 설명 */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-4">
            <div className="text-[15px] font-semibold text-[#1E2124]">
              상세 설명
            </div>

            <textarea
              {...register("detail", { required: true })}
              placeholder="상세 설명을 입력해 주세요"
              className="w-full min-h-[120px] rounded-lg border border-[#E8E8E8] bg-white px-3 py-2 resize-none text-[14px]"
            />
          </div>

          {/* 이용 가능 시간 + 지역 */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ECEDEF] space-y-6">
            <div className="text-[15px] font-semibold text-[#1E2124]">
              이용 안내
            </div>

            {/* 시간 */}
            <div className="space-y-1">
              <label className="text-[14px] font-medium text-[#1E2124]">
                이용 가능 시간
              </label>
              <textarea
                {...register("availableTime", { required: true })}
                placeholder="예: 09:00-11:00, 13:00-15:00"
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-[#E8E8E8] text-[14px] resize-none"
              />
            </div>

            {/* 지역 */}
            <div className="space-y-1">
              <label className="text-[14px] font-medium text-[#1E2124]">
                지역
              </label>
              <select
                {...register("region", { required: true })}
                className="w-full h-[44px] px-3 rounded-lg border border-[#E8E8E8] text-[14px] bg-white"
              >
                <option value="">선택해주세요</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 태그 */}
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

                <div className="rounded-xl border border-[#EEF0F2] bg-[#FAFAFC] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[13px] text-[#6B7280]">
                    <Icon icon="mdi:check-circle-outline" className="w-4 h-4" />
                    선택된 태그 ({selectedTags.length})
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
                          className="px-3 h-8 bg-white rounded-full border border-[#E8ECF0] flex items-center gap-1 text-[12px] text-[#1E2124]"
                        >
                          {EN_TO_KO[en] || en}
                          <button
                            type="button"
                            onClick={() => toggleTag(en)}
                            className="w-[18px] h-[18px] rounded-full flex items-center justify-center border border-[#E5E7EB] bg-[#F9FAFB]"
                          >
                            <Icon
                              icon="meteor-icons:xmark"
                              className="w-3 h-3 text-[#374151]"
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

          {/* 버튼 영역 */}
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
                canSubmit && !isSubmitting
                  ? "bg-[#FF2233] text-white active:scale-95"
                  : "bg-[#EFEFF1] text-[#A8AEB2]",
              ].join(" ")}
            >
              {isSubmitting ? "전송 중..." : "작성 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WebView;
