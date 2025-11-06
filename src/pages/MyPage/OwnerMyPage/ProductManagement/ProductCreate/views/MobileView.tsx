import React, { useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import api from "../../../../../../lib/api/axios";

/**
 * 멀티파트 전송 규약
 * - 파일 파트: "images"  (여러 장이면 같은 key로 여러 번 append)
 * - JSON 파트: "request" (application/json Blob으로 전송)
 * - 전체 요청은 multipart/form-data (브라우저가 boundary 자동 지정)
 * - 이 폼에 존재하는 필드만 JSON에 매핑해서 전송
 */

type ImageItem = { src: string; file?: File };

type FormValues = {
  vendorName: string; // 읽기 전용 표시, ownerName 로 전송(있으면)
  address: string; // 읽기 전용 표시, address 로 전송(있으면)
  category: string | null;
  name: string;
  price: string; // 콤마 포함 → 숫자 변환
  basicInfo: string; // availableTimes 로 전송
  detail: string; // detail 로 전송
  images: ImageItem[];
};

const categories = ["웨딩홀", "스튜디오", "드레스", "메이크업"];

// ✅ 서버 파트 키
const FILE_PART_KEY = "images";
const JSON_PART_KEY = "request";

type Props = {
  vendorName?: string; // 백엔드에서 전달
  address?: string; // 백엔드에서 전달
};

const MobileView: React.FC<Props> = ({ vendorName = "", address = "" }) => {
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
      vendorName,
      address,
      category: null,
      name: "",
      price: "",
      basicInfo: "",
      detail: "",
      images: [],
    },
  });

  const images = useWatch({ control, name: "images" }) || [];
  const category = useWatch({ control, name: "category" }) || null;

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

  // 제출
  const onSubmit = async (values: FormValues) => {
    const priceNumber = Number(values.price.replace(/[^\d]/g, ""));
    if (
      !values.category ||
      !values.name.trim() ||
      !(priceNumber > 0) ||
      !values.basicInfo.trim() ||
      !values.detail.trim() ||
      images.length < 1
    ) {
      return;
    }

    // 1) JSON 파트(이 폼에서 존재하는 항목만 포함)
    const body: Record<string, unknown> = {};

    // 필수/핵심 매핑
    body.name = values.name.trim();
    body.price = priceNumber;
    if (values.address?.trim()) body.address = values.address.trim();
    body.detail = values.detail.trim();

    // 추가 매핑
    // "상품 기본 정보" -> availableTimes
    body.availableTimes = values.basicInfo.trim();

    // 업체명 -> ownerName (있으면)
    if (values.vendorName?.trim()) body.ownerName = values.vendorName.trim();

    // 태그: 카테고리 1개만 전송
    if (values.category) body.tags = [values.category];

    // 필요 시 옵션/용량/지역 등은 추후 필드 추가 후 조건부 삽입
    // body.region = "SEOUL";
    // body.options = [{ name: "...", detail: "...", price: 0 }];

    // JSON Blob 생성 (⚠️ Content-Type: application/json)
    const jsonBlob = new Blob([JSON.stringify(body)], {
      type: "application/json",
    });

    // 2) FormData 만들고 JSON/파일 각각 별도 파트로 append
    const formData = new FormData();

    // (A) JSON 파트 (키: "request", content-type: application/json)
    formData.append(JSON_PART_KEY, jsonBlob);

    // (B) 파일 파트(여러 개, 키: "images")
    values.images.forEach((img, idx) => {
      if (img.file) {
        // 파일명도 함께 전송(서버 로깅/정렬 시 유용)
        formData.append(
          FILE_PART_KEY,
          img.file,
          img.file.name || `image_${idx + 1}.jpg`
        );
      }
    });

    try {
      // ⚠️ Content-Type 수동 지정 금지: 브라우저가 boundary 포함해서 설정
      const res = await api.post("/api/v1/wedding-hall", formData);
      console.log("등록 성공:", res.data);
      alert("작성 완료!");
      // 전송 성공 후 초기화가 필요하면 아래 주석 해제
      // reset({ vendorName, address, category: null, name: "", price: "", basicInfo: "", detail: "", images: [] });
    } catch (err) {
      console.error("등록 실패:", err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  const canSubmit = isValid && !!category && images.length > 0;

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
          className="pt-[60px] pb-[130px]"
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
              // @ts-ignore
              onWheel={(e) => {
                if (
                  Math.abs((e as WheelEvent).deltaY) >
                  Math.abs((e as WheelEvent).deltaX)
                ) {
                  (e.currentTarget as HTMLDivElement).scrollLeft += (
                    e as WheelEvent
                  ).deltaY;
                }
              }}
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

          {/* 필드들 */}
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
                    validate: (v) => Number(v.replace(/[^\d]/g, "")) > 0,
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

            {/* 상품 기본 정보 -> availableTimes */}
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
                  {...register("basicInfo", { required: true })}
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
        </form>

        {/* 하단 버튼 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[390px]">
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

      {/* 숨김 파일 입력(한 곳만 유지) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

export default MobileView;
