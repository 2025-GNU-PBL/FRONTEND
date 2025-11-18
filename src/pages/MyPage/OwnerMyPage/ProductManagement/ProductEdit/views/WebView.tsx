import React, { useEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { multipartApi } from "../../../../../../lib/api/multipartApi";
import MyPageHeader from "../../../../../../components/MyPageHeader";

type ImageItem = { id?: number; src: string; file?: File };

interface FormValues {
  name: string;
  price: string;
  detail: string;
  availableTimes: string;
  region: string;
  tags: string[];
  images: ImageItem[];
  category?: string | null;
}

export default function WebView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      price: "",
      detail: "",
      availableTimes: "",
      region: "",
      tags: [],
      images: [],
      category: null,
    },
  });

  const images = useWatch({ control, name: "images" }) || [];

  /** ----------------- 상품 불러오기 ----------------- */
  const loadProduct = async () => {
    if (!id) return;

    const endpoints = [
      { key: "웨딩홀", url: `/api/v1/wedding-hall/${id}` },
      { key: "스튜디오", url: `/api/v1/studio/${id}` },
      { key: "드레스", url: `/api/v1/dress/${id}` },
      { key: "메이크업", url: `/api/v1/makeup/${id}` },
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url);
        if (res.ok) {
          const data = await res.json();

          reset({
            name: data.name,
            price: String(data.price),
            detail: data.detail,
            availableTimes: data.availableTimes,
            region: data.region,
            tags: data.tags?.map((t: any) => t.tagName) ?? [],
            images:
              data.images?.map((img: any) => ({
                id: img.id,
                src: img.url,
              })) ?? [],
            category: ep.key,
          });

          break;
        }
      } catch {}
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  /** 가격 포맷 */
  const formatPrice = (v: string) =>
    v.replace(/[^\d]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  /** 이미지 추가 */
  const addFiles = (files: FileList | null) => {
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

  /** 이미지 제거 */
  const removeImg = (i: number) => {
    setValue(
      "images",
      images.filter((_, idx) => idx !== i),
      { shouldDirty: true }
    );
  };

  /** ----------------- 제출 ----------------- */
  const onSubmit = async (v: FormValues) => {
    const category = v.category;
    if (!category) {
      alert("카테고리 로딩 실패");
      return;
    }

    const priceNum = Number(v.price.replace(/[^\d]/g, ""));

    const keepImagesIds = v.images
      .filter((i) => !i.file && i.id)
      .map((i) => i.id);

    const body = {
      name: v.name,
      detail: v.detail,
      price: priceNum,
      availableTimes: v.availableTimes,
      region: v.region,
      tags: v.tags.map((t) => ({ tagName: t })),
      keepImagesIds,
    };

    const jsonBlob = new Blob([JSON.stringify(body)], {
      type: "application/json",
    });

    const fd = new FormData();
    fd.append("request", jsonBlob);

    v.images.forEach((i) => {
      if (i.file) fd.append("images", i.file);
    });

    const endpointMap = {
      웨딩홀: `/api/v1/wedding-hall/${id}`,
      스튜디오: `/api/v1/studio/${id}`,
      드레스: `/api/v1/dress/${id}`,
      메이크업: `/api/v1/makeup/${id}`,
    } as any;

    try {
      await multipartApi.patch(endpointMap[category], fd);
      alert("수정 완료!");
      navigate("/my-page/owner/products/management");
    } catch {
      alert("수정 실패");
    }
  };

  /** ----------------- UI ----------------- */
  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 헤더 */}
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
      <div className="max-w-[1040px] mx-auto mt-20 px-6 py-8">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
          {/* 제목 */}
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold text-[#111827]">
              상품 정보를 수정하세요
            </h1>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              이미지, 가격, 상세 정보 등 모든 내용을 이 화면에서 변경할 수
              있어요.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-7"
          >
            {/* 이미지 영역 */}
            <section>
              <label className="text-[14px] font-medium text-[#1E2124]">
                상품 이미지
              </label>

              <div className="flex gap-4 mt-3 flex-wrap">
                {/* 업로드 버튼 */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-28 h-28 rounded-[10px] border border-[#E8E8E8] bg-[#F6F7FB] flex flex-col items-center justify-center"
                >
                  <Icon
                    icon="solar:camera-bold"
                    className="w-6 h-6 text-[#999999]"
                  />
                  <span className="text-[12px] text-[#999999] mt-1">
                    {images.length}/10
                  </span>
                </button>

                {/* 썸네일 목록 */}
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-28 h-28 rounded-[10px] border border-[#E8E8E8] overflow-hidden"
                  >
                    <img src={img.src} className="w-full h-full object-cover" />

                    <button
                      type="button"
                      onClick={() => removeImg(i)}
                      className="absolute right-2 top-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow"
                    >
                      <Icon
                        icon="mdi:close"
                        className="w-4 h-4 text-gray-600"
                      />
                    </button>
                  </div>
                ))}
              </div>

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => addFiles(e.target.files)}
              />
            </section>

            {/* 상품명 */}
            <Field label="상품명">
              <input {...register("name")} className={inputCls()} />
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
                  />
                )}
              />
            </Field>

            {/* 상세 설명 */}
            <Field label="상세 설명">
              <textarea
                {...register("detail")}
                className="w-full h-[120px] px-3 py-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none"
              />
            </Field>

            {/* 이용 가능 시간 */}
            <Field label="이용 가능 시간">
              <textarea
                {...register("availableTimes")}
                className="w-full h-[100px] px-3 py-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none"
              />
            </Field>

            {/* 지역 */}
            <Field label="지역">
              <select {...register("region")} className={inputCls()}>
                <option value="">지역 선택</option>
                <option value="SEOUL">SEOUL</option>
                <option value="GYEONGGI">GYEONGGI</option>
                <option value="INCHEON">INCHEON</option>
                <option value="BUSAN">BUSAN</option>
              </select>
            </Field>

            {/* 태그 */}
            <Field label="태그 (영문 코드)">
              <input
                {...register("tags")}
                className={inputCls()}
                placeholder="예: PORTRAIT,BRIGHT,NATURE"
              />
            </Field>

            {/* 버튼 */}
            <div className="flex justify-end mt-4">
              <button
                disabled={isSubmitting}
                className="h-[44px] px-6 rounded-[12px] bg-[#FF2233] text-white text-[14px] font-semibold active:scale-95"
              >
                {isSubmitting ? "수정 중..." : "수정 완료"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/** 공통 필드 wrapper */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[14px] font-medium text-[#1E2124]">{label}</div>
      {children}
    </div>
  );
}

function inputCls() {
  return "w-full h-[44px] px-3 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] outline-none placeholder:text-[#C1C1C1]";
}
