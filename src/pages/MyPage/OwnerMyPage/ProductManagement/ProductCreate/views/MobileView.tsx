import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { multipartApi } from "../../../../../../lib/api/multipartApi";

/**
 * 멀티파트 전송 규약
 * - 파일 파트: "images" (key)
 * - JSON 파트: "request" (key)  👉 Blob(application/json) + filename("request.json")
 */

type ImageItem = { src: string; file?: File };
type TagItem = { id?: number | null; tagName: string };

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

  // 추가된 필드(예시 JSON 대응)
  availableTime: string; // 예: "09:00-11:00, 13:00-15:00"
  region: Region | "";
  ownerName: string;
  starCount: string; // 숫자 텍스트 입력 → number 변환
  subwayAccessible: boolean;
  diningAvailable: boolean;
  thumbnail: string; // URL (선택)
  tags: TagItem[];
};

const categories = ["웨딩홀", "스튜디오", "드레스", "메이크업"] as const;

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
  const [tagNameInput, setTagNameInput] = useState("");
  const [tagIdInput, setTagIdInput] = useState("");

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
      tags: [],
    },
  });

  // 기존 훅 유지
  const images = useWatch({ control, name: "images" }) || [];
  const category = useWatch({ control, name: "category" }) || null;
  const tags = useWatch({ control, name: "tags" }) || [];

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

  const addTag = () => {
    const name = tagNameInput.trim();
    if (!name) return;
    const idVal =
      tagIdInput.trim() === "" ? null : Number(tagIdInput.trim() || NaN);
    if (idVal !== null && Number.isNaN(idVal)) {
      alert("태그 ID는 숫자이거나 비워두세요.");
      return;
    }
    const next: TagItem = { tagName: name, id: idVal };
    setValue("tags", [...tags, next], { shouldDirty: true, shouldTouch: true });
    setTagNameInput("");
    setTagIdInput("");
  };

  const removeTag = (idx: number) => {
    const next = tags.filter((_, i) => i !== idx);
    setValue("tags", next, { shouldDirty: true, shouldTouch: true });
  };

  // 🧭 수평 스크롤용 wheel 핸들러 (React SyntheticEvent 타입 사용)
  const handleHorizontalWheel: React.WheelEventHandler<HTMLDivElement> = (
    e
  ) => {
    const { deltaY, deltaX } = e;
    // 세로 제스처가 더 크면 가로 스크롤로 전환
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      e.currentTarget.scrollLeft += deltaY;
      e.preventDefault(); // 세로 스크롤 방지
    }
  };

  // 제출
  const onSubmit = async (values: FormValues) => {
    const priceNumber = Number(values.price.replace(/[^\d]/g, ""));
    const starCountNumber = Number(values.starCount.replace(/[^\d]/g, ""));

    // ✅ 기존 + 추가 필드 유효성
    if (
      !values.category ||
      !values.name.trim() ||
      !(priceNumber >= 0) ||
      !values.detail.trim() ||
      images.length < 1 ||
      !values.availableTime.trim() || // 추가 필수
      !values.region || // 추가 필수
      !values.ownerName.trim() // 추가 필수
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    // 엔드포인트 결정 (기존 로직 유지)
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

    // 🔥 예시 스키마에 맞춘 JSON (id/createdAt은 서버 생성 가정으로 제외)
    const body: Record<string, unknown> = {
      name: values.name.trim(),
      starCount: Number.isNaN(starCountNumber) ? 0 : starCountNumber,
      address: values.address?.trim() ?? "",
      detail: values.detail.trim(),
      price: priceNumber,
      availableTime: values.availableTime.trim(), // 예시와 동일 키(단수)
      thumbnail: values.thumbnail.trim() || undefined, // 선택
      region: values.region,
      ownerName: values.ownerName.trim(),
      subwayAccessible: Boolean(values.subwayAccessible),
      diningAvailable: Boolean(values.diningAvailable),
      tags: (values.tags || []).map((t) => {
        const obj: { id?: number | null; tagName: string } = {
          tagName: t.tagName,
        };
        if (typeof t.id === "number") obj.id = t.id;
        else if (t.id === null) obj.id = null;
        return obj;
      }),
    };

    // ✅ JSON 파트를 application/json Blob + filename 으로 전송
    const jsonBlob = new Blob([JSON.stringify(body)], {
      type: "application/json",
    });

    const formData = new FormData();
    formData.append(JSON_PART_KEY, jsonBlob, "request.json");

    // 파일 파트들
    values.images.forEach((img) => {
      if (img.file) formData.append(FILE_PART_KEY, img.file, img.file.name);
    });

    // (선택) 디버깅
    for (const [k, v] of formData.entries()) {
      console.log(
        "FormData =>",
        k,
        v instanceof File ? `(File) ${v.name} | ${v.type} | ${v.size}B` : v
      );
    }

    try {
      // 헤더 지정 금지 — 브라우저가 멀티파트 boundary 자동 설정
      console.log(formData);
      const res = await multipartApi.post(endpoint, formData);
      console.log("등록 성공:", res.data);
      alert("작성 완료!");
    } catch (err) {
      console.error("등록 실패:", err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  const canSubmit = isValid && !!category && images.length > 0;

  return (
    <div className="w-full flex justify-center bg-white">
      <div className="relative w-[390px] min-h-screen bg-white">
        {/* 헤더 (기존) */}
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

        {/* 본문 (기존 디자인 유지) */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="pt-[60px] pb-[210px]"
        >
          {/* 이미지 업로드 (기존) */}
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

          {/* 기존 필드 섹션들 */}
          <section className="px-5 mt-5 flex flex-col gap-5">
            {/* 업체명 (읽기 전용) */}
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

            {/* 주소 (읽기 전용) */}
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
                      onClick={() =>
                        setValue("category", selected ? null : c, {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
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

            {/* 상품 기본 정보 (기존) */}
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

          {/* ----------------------------- */}
          {/* 🔽 추가 섹션: 예시 JSON 필드들 */}
          {/* ----------------------------- */}
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

            {/* ownerName */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                대표자명 (ownerName)
              </label>
              <div className="h-[49px] flex items-center px-4 rounded-[8px] border border-[#D9D9D9]">
                <input
                  type="text"
                  placeholder="예: 김용환"
                  className="w-full text-[14px] leading-[21px] placeholder:text-[#D9D9D9] outline-none bg-transparent"
                  {...register("ownerName", { required: true })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* starCount */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                별점 수치 (starCount)
              </label>
              <div className="h-[49px] flex items-center px-4 rounded-[8px] border border-[#D9D9D9]">
                <Controller
                  control={control}
                  name="starCount"
                  rules={{
                    required: true,
                    validate: (v) => /^\d+$/.test(v.trim()),
                  }}
                  render={({ field: { value, onChange } }) => (
                    <input
                      inputMode="numeric"
                      placeholder="예: 0 또는 5"
                      className="w-full text-[14px] leading-[21px] placeholder:text-[#D9D9D9] outline-none bg-transparent"
                      value={value || ""}
                      onChange={(e) =>
                        onChange(e.target.value.replace(/[^\d]/g, ""))
                      }
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>
            </div>

            {/* 편의 옵션 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                편의 옵션
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="subwayAccessible"
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  <span className="text-[14px]">
                    지하철 접근성 (subwayAccessible)
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="diningAvailable"
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  <span className="text-[14px]">
                    식사 제공 (diningAvailable)
                  </span>
                </label>
              </div>
            </div>

            {/* 태그 입력 */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[21px] text-black">
                태그 (tags)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="태그명 (예: 채광좋음)"
                  className="flex-1 h-[42px] px-3 rounded-[8px] border border-[#D9D9D9] outline-none"
                  value={tagNameInput}
                  onChange={(e) => setTagNameInput(e.target.value)}
                  disabled={isSubmitting}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="ID (선택)"
                  className="w-[110px] h-[42px] px-3 rounded-[8px] border border-[#D9D9D9] outline-none"
                  value={tagIdInput}
                  onChange={(e) =>
                    setTagIdInput(e.target.value.replace(/[^\d]/g, ""))
                  }
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="h-[42px] px-3 rounded-[8px] bg-[#FF2233] text-white text-[14px] font-semibold disabled:opacity-50"
                  disabled={isSubmitting || !tagNameInput.trim()}
                >
                  추가
                </button>
              </div>

              {/* 태그 리스트 */}
              <div className="flex flex-wrap gap-2">
                {tags.map((t: TagItem, idx: number) => (
                  <span
                    key={`${t.tagName}-${idx}`}
                    className="inline-flex items-center gap-2 px-3 h-[34px] rounded-full border border-[#FFD5D8] bg-[#FFF2F2] text-[#FF2233] text-[13px]"
                  >
                    {t.tagName}
                    {typeof t.id === "number" ? (
                      <em className="not-italic text-[#FF6B76] text-[12px]">
                        #{t.id}
                      </em>
                    ) : null}
                    <button
                      type="button"
                      aria-label="태그 삭제"
                      onClick={() => removeTag(idx)}
                      className="ml-1 w-[18px] h-[18px] flex items-center justify-center bg-white border border-[#F2F2F2] rounded-full"
                      disabled={isSubmitting}
                    >
                      <Icon
                        icon="meteor-icons:xmark"
                        className="w-3 h-3 text-[#3C4144]"
                      />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>
        </form>

        {/* 하단 버튼 (기존) */}
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
