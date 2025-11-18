import React, { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { multipartApi } from "../../../../../../lib/api/multipartApi";

// -------------------- 타입 --------------------
type ImageItem = { id?: number; src: string; file?: File };

interface FormValues {
  category: string | null;
  name: string;
  price: string;
  detail: string;
  availableTimes: string;
  region: string;
  tags: string[];
  images: ImageItem[];
}

const categories = ["웨딩홀", "스튜디오", "드레스", "메이크업"] as const;

// -------------------- 태그 그룹 / 매핑 --------------------
type TagOption = { ko: string; en: string };
type TagGroup = { groupLabel: string; options: TagOption[] };

const TAG_GROUPS: Record<(typeof categories)[number], TagGroup[]> = {
  웨딩홀: [
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
  ],
  스튜디오: [
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
  ],
  드레스: [
    {
      groupLabel: "행사",
      options: [
        { ko: "촬영+본식", en: "SHOOTING_AND_CEREMONY" },
        { ko: "본식", en: "CEREMONY" },
        { ko: "촬영", en: "SHOOTING" },
      ],
    },
  ],
  메이크업: [
    {
      groupLabel: "메이크업 스타일",
      options: [
        { ko: "과즙/색조", en: "FRUITY_TONE" },
        { ko: "깨끗/화사", en: "CLEAN_AND_BRIGHT" },
        { ko: "윤곽/음영", en: "CONTOUR_AND_SHADOW" },
      ],
    },
  ],
};

// EN -> KO 매핑 (선택된 태그 표시용)
const EN_TO_KO: Record<string, string> = Object.values(TAG_GROUPS)
  .flatMap((groups) => groups.flatMap((g) => g.options))
  .reduce((acc, cur) => {
    acc[cur.en] = cur.ko;
    return acc;
  }, {} as Record<string, string>);

// -------------------- Component --------------------
const MobileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    control,
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      category: null,
      name: "",
      price: "",
      detail: "",
      availableTimes: "",
      region: "",
      tags: [],
      images: [],
    },
  });

  const images = useWatch({ control, name: "images" }) || [];
  const category = useWatch({ control, name: "category" }) || null;
  const selectedTags = useWatch({ control, name: "tags" }) || [];

  // -------------------- 상품 불러오기 --------------------
  const loadProduct = async () => {
    if (!id) return;

    const endpoints = [
      { key: "웨딩홀", url: `/api/v1/wedding-hall/${id}` },
      { key: "스튜디오", url: `/api/v1/studio/${id}` },
      { key: "드레스", url: `/api/v1/dress/${id}` },
      { key: "메이크업", url: `/api/v1/makeup/${id}` },
    ];

    for (const ep of endpoints) {
      const res = await fetch(ep.url);
      if (!res.ok) continue;

      const data = await res.json();

      reset({
        category: ep.key,
        name: data.name,
        price: String(data.price),
        detail: data.detail,
        // availableTime / availableTimes 둘 다 대응
        availableTimes:
          data.availableTime ??
          data.availableTimes ??
          data.availabletimes ??
          "",
        region: data.region ?? "",
        tags: data.tags?.map((t: any) => t.tagName) ?? [],
        images:
          data.images?.map((img: any) => ({
            id: img.id,
            src: img.url,
          })) ?? [],
      });

      break;
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  // -------------------- 이미지 핸들러 --------------------
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remain = 10 - images.length;
    const list = Array.from(files).slice(0, remain);

    Promise.all(
      list.map(
        (file) =>
          new Promise<ImageItem>((resolve) => {
            const r = new FileReader();
            r.onload = (e) => resolve({ src: String(e.target?.result), file });
            r.readAsDataURL(file);
          })
      )
    ).then((newImgs) => {
      setValue("images", [...images, ...newImgs], {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };

  const removeImage = (idx: number) => {
    setValue(
      "images",
      images.filter((_, i) => i !== idx),
      { shouldDirty: true, shouldTouch: true }
    );
  };

  const formatPrice = (v: string) =>
    v.replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // -------------------- 태그 토글 --------------------
  const toggleTag = (en: string) => {
    const set = new Set(selectedTags as string[]);
    set.has(en) ? set.delete(en) : set.add(en);
    setValue("tags", Array.from(set));
  };

  const currentTagGroups: TagGroup[] =
    category && TAG_GROUPS[category as (typeof categories)[number]]
      ? TAG_GROUPS[category as (typeof categories)[number]]
      : [];

  // -------------------- 수정 요청 --------------------
  const onSubmit = async (v: FormValues) => {
    const priceNum = Number(v.price.replace(/[^\d]/g, ""));
    const keepImagesIds = v.images
      .filter((i) => !i.file && i.id)
      .map((i) => i.id);

    const body = {
      name: v.name,
      detail: v.detail,
      price: priceNum,
      // 🔹 API에는 availableTime 으로 전송
      availableTime: v.availableTimes,
      region: v.region,
      tags: v.tags.map((t) => ({ tagName: t })),
      keepImagesIds,
    };

    const fd = new FormData();
    fd.append(
      "request",
      new Blob([JSON.stringify(body)], { type: "application/json" })
    );
    v.images.forEach((i) => i.file && fd.append("images", i.file));

    const endpointMap: any = {
      웨딩홀: `/api/v1/wedding-hall/${id}`,
      스튜디오: `/api/v1/studio/${id}`,
      드레스: `/api/v1/dress/${id}`,
      메이크업: `/api/v1/makeup/${id}`,
    };

    await multipartApi.patch(endpointMap[v.category!], fd);
    alert("수정 완료!");
    navigate("/my-page/owner/products/management");
  };

  // -------------------- UI 시작 --------------------
  return (
    <div className="w-full bg-[#F6F7FB]">
      <div className="mx-auto w-[390px] min-h-screen flex flex-col relative">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB]">
          <div className="h-[60px] flex items-center px-5">
            <button onClick={() => window.history.back()}>
              <Icon icon="mdi:arrow-left" className="w-6 h-6 text-[#1E2124]" />
            </button>
            <h1 className="flex-1 text-center text-[17px] font-semibold text-[#1E2124]">
              상품 수정
            </h1>
            <div className="w-6 h-6" />
          </div>
        </div>
        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-[140px]">
          {/* 이미지 */}
          <div className="mb-6">
            <label className="text-[14px] font-medium text-[#1E2124]">
              상품 이미지
            </label>

            <div className="flex gap-3 overflow-x-auto mt-3">
              {/* 업로드 버튼 */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-[12px] border border-[#E8E8E8] bg-white flex flex-col items-center justify-center"
              >
                <Icon
                  icon="solar:camera-linear"
                  className="w-6 h-6 text-[#999]"
                />
                <span className="text-[11px] text-[#6B7280]">
                  {images.length}/10
                </span>
              </button>

              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-[12px] overflow-hidden border border-[#E8E8E8]"
                >
                  <img src={img.src} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white border flex items-center justify-center"
                  >
                    <Icon icon="mdi:close" className="w-3 h-3" />
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

          {/* 카테고리 */}
          <div className="mb-6">
            <label className="text-[14px] font-medium text-[#1E2124]">
              카테고리
            </label>

            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("category", c)}
                  className={[
                    "h-9 px-4 rounded-full border text-[13px]",
                    c === category
                      ? "bg-[#FFF2F2] border-[#FF5B68] text-[#FF2233]"
                      : "bg-white border-[#E5E7EB] text-[#333]",
                  ].join(" ")}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 상품명 */}
          <Field label="상품명">
            <input
              {...register("name")}
              className={inputCls()}
              placeholder="상품명을 입력하세요"
            />
          </Field>

          {/* 가격 */}
          <Field label="가격">
            <Controller
              control={control}
              name="price"
              render={({ field: { value, onChange } }) => (
                <input
                  value={value}
                  onChange={(e) => onChange(formatPrice(e.target.value))}
                  className={inputCls()}
                  placeholder="가격을 입력하세요"
                />
              )}
            />
          </Field>

          {/* 상세 설명 */}
          <Field label="상세 설명">
            <textarea
              {...register("detail")}
              className="w-full h-[120px] px-3 py-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none"
              placeholder="상세 설명을 입력하세요"
            />
          </Field>

          {/* 이용 가능 시간 */}
          <Field label="이용 가능 시간">
            <textarea
              {...register("availableTimes")}
              className="w-full h-[100px] px-3 py-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none"
              placeholder="이용 가능 시간을 입력하세요"
            />
          </Field>

          {/* 지역 */}
          <Field label="지역">
            <select
              {...register("region")}
              className="w-full h-[48px] px-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none"
            >
              <option value="">선택</option>
              <option value="SEOUL">SEOUL</option>
              <option value="GYEONGGI">GYEONGGI</option>
              <option value="INCHEON">INCHEON</option>
              <option value="BUSAN">BUSAN</option>
            </select>
          </Field>

          {/* 태그 */}
          <Field label="태그">
            {!category ? (
              <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-3 text-[13px] text-[#9CA3AF]">
                카테고리를 먼저 선택해 주세요.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {currentTagGroups.map((g) => (
                  <div
                    key={g.groupLabel}
                    className="rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#1E2124]">
                        {g.groupLabel}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF]">
                        {
                          g.options.filter((o) => selectedTags.includes(o.en))
                            .length
                        }{" "}
                        / {g.options.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.options.map((opt) => {
                        const selected = selectedTags.includes(opt.en);
                        return (
                          <button
                            key={opt.en}
                            type="button"
                            onClick={() => toggleTag(opt.en)}
                            className={[
                              "h-8 px-3 rounded-full border text-[12px]",
                              selected
                                ? "bg-[#1E2124] border-[#1E2124] text-white"
                                : "bg-white border-[#E2E6EA] text-[#1E2124]",
                            ].join(" ")}
                          >
                            {opt.ko}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 선택된 태그 목록 */}
            <div className="mt-3 rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-3">
              <div className="mb-2 text-[12px] text-[#6B7280]">선택된 태그</div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.length === 0 ? (
                  <span className="text-[12px] text-[#9CA3AF]">
                    아직 선택된 태그가 없습니다.
                  </span>
                ) : (
                  selectedTags.map((en) => (
                    <span
                      key={en}
                      className="flex items-center px-3 h-8 rounded-full border bg-[#F6F8FA] text-[12px]"
                    >
                      {EN_TO_KO[en] || en}
                      <button
                        type="button"
                        onClick={() => toggleTag(en)}
                        className="ml-2 p-[2px] rounded-full border bg-white"
                      >
                        <Icon icon="mdi:close" className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </Field>
        </div>
        {/* 하단 버튼 */}ㅁ
        <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-[390px] bg-white px-5 pb-18 pt-3 border-t border-[#E8E8E8]">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={[
              "w-full h-[52px] rounded-[12px] text-white text-[16px] font-semibold",
              isSubmitting ? "bg-[#FF8891]" : "bg-[#FF2233] active:scale-95",
            ].join(" ")}
          >
            {isSubmitting ? "수정 중..." : "수정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileView;

// -------------------- UI 하위 컴포넌트 --------------------
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-[14px] font-medium text-[#1E2124]">{label}</div>
      {children}
    </div>
  );
}

function inputCls() {
  return "w-full h-[48px] px-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none placeholder:text-[#C1C1C1]";
}
