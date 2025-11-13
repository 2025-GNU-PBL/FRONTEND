import React, { useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { multipartApi } from "../../../../../../lib/api/multipartApi";

/**
 * 멀티파트 전송 규약
 * - 파일 파트: "images" (key)
 * - JSON 파트: "request" (key)  👉 Blob(application/json) + filename("request.json")
 */

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
  // 기존(디자인 유지)
  vendorName: string; // 읽기 전용
  address: string; // 읽기 전용
  category: string | null;
  name: string;
  price: string;
  basicInfo: string; // 기존 UI 유지 (JSON에는 포함 X)
  detail: string;
  images: ImageItem[];

  // 추가된 필드
  availableTime: string; // 예: "09:00-11:00, 13:00-15:00"
  region: Region | "";
  ownerName: string;
  starCount: string; // 숫자 텍스트 입력 → number 변환
  subwayAccessible: boolean;
  diningAvailable: boolean;
  thumbnail: string; // URL (선택)

  // 태그 (백엔드 전송 형식: string[])
  tags: string[];
};

const categories = ["웨딩홀", "스튜디오", "드레스", "메이크업"] as const;

// ---------- 태그 그룹 정의 (표시는 한글, 전송값은 영문 코드) ----------
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

// ko ↔ en 매핑 빠른 조회용 (표시: ko, 저장/전송: en)
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

type Props = {
  vendorName?: string; // 백엔드에서 전달
  address?: string; // 백엔드에서 전달
};

const regions: Region[] = ["SEOUL", "GYEONGGI", "INCHEON", "BUSAN"];

const MobileView: React.FC<Props> = ({ vendorName = "d", address = "d" }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      // 기존
      vendorName,
      address,
      category: null,
      name: "",
      price: "",
      basicInfo: "",
      detail: "",
      images: [],
      // 추가
      availableTime: "",
      region: "",
      ownerName: vendorName || "",
      starCount: "0",
      subwayAccessible: false,
      diningAvailable: false,
      thumbnail: "",
      // 태그 (전송용: 영문 코드 배열)
      tags: [],
    },
  });

  // 기존 훅 유지
  const images = useWatch({ control, name: "images" }) || [];
  const category = useWatch({ control, name: "category" }) || null;
  const selectedTags = useWatch({ control, name: "tags" }) || [];

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

  const formatPrice = (v: string) => {
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

  // ✅ 카테고리 토글 시: 태그 초기화(선택 태그 전체 해제)
  const handleCategoryToggle = (
    nextCategory: (typeof categories)[number] | null
  ) => {
    setValue("category", nextCategory, {
      shouldDirty: true,
      shouldTouch: true,
    });

    // 핵심 변경: resetField 대신 setValue로 즉시 비움
    setValue("tags", [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // 태그 토글(칩) 클릭
  const toggleTag = (enCode: string) => {
    const set = new Set(selectedTags as string[]);
    if (set.has(enCode)) set.delete(enCode);
    else set.add(enCode);
    setValue("tags", Array.from(set), { shouldDirty: true, shouldTouch: true });
  };

  // 제출
  const onSubmit = async (values: FormValues) => {
    const priceNumber = Number(values.price.replace(/[^\d]/g, ""));

    if (
      !values.category ||
      !values.name.trim() ||
      !(priceNumber >= 0) ||
      !values.detail.trim() ||
      images.length < 1 ||
      !values.availableTime.trim() ||
      !values.region ||
      !values.ownerName.trim()
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    // 엔드포인트 결정
    let endpoint = "";
    switch (values.category) {
      case "웨딩홀":
        endpoint = "/api/v1/wedding-hall";
        break;
      case "스튜디오":
        endpoint = "/api/v1/studio"; // TODO: 실제 엔드포인트 확인
        break;
      case "드레스":
        endpoint = "/api/v1/dress"; // TODO: 실제 엔드포인트 확인
        break;
      case "메이크업":
        endpoint = "/api/v1/makeup"; // TODO: 실제 엔드포인트 확인
        break;
      default:
        alert("카테고리를 선택해주세요.");
        return;
    }

    // 🔥 전송용 JSON — tags는 string[] 평면 배열
    const body: Record<string, unknown> = {
      name: values.name.trim(),
      address: values.address?.trim() ?? "",
      detail: values.detail.trim(),
      price: priceNumber,
      availableTime: values.availableTime.trim(),
      thumbnail: values.thumbnail.trim() || undefined,
      region: values.region,
      tags: (values.tags || []).map((t) => ({ tagName: t })), // ✅ 이 부분 유지
    };

    const jsonBlob = new Blob([JSON.stringify(body)], {
      type: "application/json",
    });

    const formData = new FormData();
    formData.append(JSON_PART_KEY, jsonBlob, "request.json");

    // 🔎 디버그: FormData 상세 출력
    console.groupCollapsed("[DEBUG] FormData");

    for (const [k, v] of formData.entries()) {
      if (v instanceof File) {
        console.log(
          k,
          `(File) name=${v.name}, type=${v.type}, size=${v.size}B`
        );
      } else if (v instanceof Blob) {
        console.log(k, `(Blob) type=${v.type}`);
      } else {
        console.log(k, v);
      }
    }

    const reqPart = formData.get("request");
    if (reqPart instanceof Blob) {
      try {
        const text = await reqPart.text();
        try {
          console.log("request.json (parsed):", JSON.parse(text));
        } catch {
          console.log("request.json (raw text):", text);
        }
      } catch (e) {
        console.warn("request.json 읽기 실패:", e);
      }
    }

    console.groupEnd();

    values.images.forEach((img) => {
      if (img.file) formData.append(FILE_PART_KEY, img.file, img.file.name);
    });

    try {
      const res = await multipartApi.post(endpoint, formData);
      console.log("등록 성공:", res.data);
      alert("작성 완료!");
    } catch (err) {
      console.error("등록 실패:", err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  const canSubmit = isValid && !!category && images.length > 0;

  // 현재 카테고리에 해당하는 태그 그룹들
  const currentTagGroups: TagGroup[] = category
    ? TAG_GROUPS_BY_CATEGORY[category]
    : [];

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
        <div className="flex flex-wrap gap-8px gap-2">
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
    <div className="w-full flex justify-center bg-white">
      <div className="relative w-[390px] min-h-screen bg-white">
        {/* 헤더 */}
        <header className="absolute left-0 top-0 w-[390px] h-[60px] flex items-center justify-between px-5">
          <button
            type="button"
            aria-label="뒤로가기"
            className="w-6 h-6 flex items-center justify-center"
            onClick={() => window.history.back()}
          >
            <Icon icon="mdi:arrow-left" className="w-6 h-6 text-[#1E2124]" />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 top-[15.5px] text-[18px] leading-[29px] font-semibold tracking-[-0.2px] text-[#1E2124]">
            상품 추가
          </h1>

          <div className="w-6 h-6" />
        </header>

        {/* 본문 */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="pt-[60px] pb-[210px]"
        >
          {/* 이미지 업로드 */}
          <section className="px-5 pt-5">
            <div
              className="flex items-center gap-2 overflow-x-auto h-20"
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
                className="shrink-0 w-20 h-20 border border-[#999999] rounded-[8px] flex items-center justify-center"
                aria-label="이미지 업로드"
                disabled={images.length >= 10 || isSubmitting}
              >
                <div className="flex flex-col items-center w-[27px] h-[45px]">
                  <Icon
                    icon="solar:camera-bold"
                    className="w-6 h-6 text-[#999999]"
                  />
                  <span className="mt-1 text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    {images.length}/10
                  </span>
                </div>
              </button>

              {images.map((it, idx) => (
                <div
                  key={`${it.src}-${idx}`}
                  className="relative shrink-0 w-20 h-20 rounded-[8px] border border-[#E1E4E6] overflow-hidden"
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
                    className="absolute right-1 top-1 w-[18px] h-[18px] flex items-center justify-center bg-white border border-[#F2F2F2] rounded-full"
                    aria-label="이미지 삭제"
                    disabled={isSubmitting}
                  >
                    <Icon
                      icon="meteor-icons:xmark"
                      className="w-3 h-3 text-[#3C4144]"
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

          {/* 기존 필드 */}
          <section className="px-5 mt-5 flex flex-col gap-5">
            {/* 업체명 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                업체명
              </label>
              <div className="h-[49px] flex items-center px-4 rounded-[8px] border border-[#E8E8E8] bg-[#F8F8F8]">
                <input
                  type="text"
                  readOnly
                  aria-readonly="true"
                  tabIndex={-1}
                  className="w-full text-[14px] leading-[21px] tracking-[-0.2px] placeholder:text-[#949494] outline-none bg-transparent pointer-events-none select-none"
                  {...register("vendorName")}
                />
              </div>
            </div>

            {/* 주소 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                주소
              </label>
              <div className="h-[49px] flex items-center px-4 rounded-[8px] border border-[#E8E8E8] bg-[#F8F8F8]">
                <input
                  type="text"
                  readOnly
                  aria-readonly="true"
                  tabIndex={-1}
                  className="w-full text-[14px] leading-[21px] tracking-[-0.2px] placeholder:text-[#949494] outline-none bg-transparent pointer-events-none select-none"
                  {...register("address")}
                />
              </div>
            </div>

            {/* 카테고리 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
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
                        "h-[37px] px-3 rounded-full border transition-colors",
                        selected
                          ? "bg-[#FFF2F2] border-[#FF5B68] text-[#FF2233]"
                          : "bg-white border-[#D9D9D9] text-black",
                      ].join(" ")}
                      onClick={() => handleCategoryToggle(selected ? null : c)}
                      disabled={isSubmitting}
                    >
                      <span className="text-[14px] leading-[21px]">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 상품명 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                상품명
              </label>
              <div className="h-[49px] flex items-center px-4 rounded-[8px] border border-[#D9D9D9]">
                <input
                  type="text"
                  placeholder="상품명을 입력해 주세요"
                  className="w-full text-[14px] leading-[21px] placeholder:text-[#D9D9D9] outline-none bg-transparent"
                  {...register("name", { required: true })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 가격 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                가격
              </label>
              <div className="h-[49px] flex items-center px-4 rounded-[8px] border border-[#D9D9D9]">
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
                      className="w-full text-[14px] leading-[21px] placeholder:text-[#D9D9D9] outline-none bg-transparent"
                      value={value || ""}
                      onChange={(e) => onChange(formatPrice(e.target.value))}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>
            </div>

            {/* 상품 기본 정보 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                상품 기본 정보
              </label>
              <div className="h-[120px] px-4 py-2 rounded-[8px] border border-[#D9D9D9]">
                <textarea
                  placeholder={
                    "상품 기본 정보에 대해 작성해주세요\nex) 상품 구성 : 촬영용 드레스 3벌 + 본식 드레스 1벌\n상담 소요 시간 : 60분  가봉 소요 시 : 90분"
                  }
                  className="w-full h-full resize-none text-[14px] leading-[21px] placeholder:text-[#D9D9D9] outline-none bg-transparent"
                  {...register("basicInfo")}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 상세 설명 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                상세 설명
              </label>
              <div className="h-[120px] px-4 py-2 rounded-[8px] border border-[#D9D9D9]">
                <textarea
                  placeholder={
                    "ex) 취소 및 환불규정 > 웨딩촬영 행사일 기준 60일~31일 전 고객님의 일방적인 일정변경 또는 이용 취소 시, 위약금이 발생됩니다."
                  }
                  className="w-full h-full resize-none text-[14px] leading-[21px] placeholder:text-[#D9D9D9] outline-none bg-transparent"
                  {...register("detail", { required: true })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* 추가 섹션 */}
          <section className="px-5 mt-8 flex flex-col gap-5">
            <h2 className="text-[16px] font-semibold text-[#1E2124]">
              추가 정보
            </h2>

            {/* availableTime */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                이용 가능 시간 (availableTime)
              </label>
              <div className="h-[100px] px-4 py-2 rounded-[8px] border border-[#D9D9D9]">
                <textarea
                  placeholder="예: 09:00-11:00, 13:00-15:00"
                  className="w-full h-full resize-none text-[14px] leading-[21px] placeholder:text-[#D9D9D9] outline-none bg-transparent"
                  {...register("availableTime", { required: true })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* region */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                지역 (region)
              </label>
              <div className="h-[49px] flex items-center px-3 rounded-[8px] border border-[#D9D9D9]">
                <select
                  className="w-full bg-transparent outline-none text-[14px] leading-[21px]"
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

            {/* 🔁 태그 그룹 (칩 토글, 여러 개 선택 가능) */}
            <div className="flex flex-col gap-3">
              <label className="text-[14px] leading-[21px] text-black">
                태그 선택
              </label>

              {!category ? (
                <div className="rounded-[12px] border border-[#EEF0F2] bg-[#FAFBFC] text-[#9AA1A6] p-4 text-[13px]">
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
        </form>

        {/* 하단 버튼 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[390px] bg-white">
          <div className="px-5 py-5">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={!canSubmit || isSubmitting}
              className={[
                "w-full h-14 rounded-[12px] flex items-center justify-center select-none",
                !isSubmitting && canSubmit
                  ? "bg-[#FF2233] active:opacity-90"
                  : "bg-[#F6F6F6]",
              ].join(" ")}
            >
              <span
                className={[
                  "text-[16px] font-semibold",
                  !isSubmitting && canSubmit ? "text-white" : "text-[#ADB3B6]",
                ].join(" ")}
              >
                {isSubmitting ? "전송 중..." : "작성 완료"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
