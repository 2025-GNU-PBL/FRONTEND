// sections/DetailContent.tsx
import { Icon } from "@iconify/react";
import type { NormalizedDetail } from "../../../type/product";

/* ========================= Props ========================= */

type DetailContentProps = {
  data: NormalizedDetail;
};

// NormalizedDetail 에 availableTimes 가 런타임에 붙어 올 수 있는 경우를 위한 보조 타입
type DetailWithAvailableTimes = NormalizedDetail & {
  availableTimes?: string | null;
};

/* ========================= 컴포넌트 ========================= */

export const DetailContent = ({ data }: DetailContentProps) => {
  const detailImages = data.images ?? [];
  const hasDetailImages = detailImages.length > 0;

  const detailText =
    data.detail && data.detail.trim().length > 0 ? data.detail : null;

  // any 대신, 보다 넓은 타입으로 한 번만 캐스팅해서 사용
  const dataWithTimes = data as DetailWithAvailableTimes;

  const availableTimes =
    typeof dataWithTimes.availableTimes === "string" &&
    dataWithTimes.availableTimes.trim().length > 0
      ? dataWithTimes.availableTimes
      : null;

  return (
    <div className="w-full bg-white">
      {/* ========================= 상단 히어로 영역 ========================= */}
      <section className="w-full bg-gradient-to-b from-[#111111] to-[#1C1F23] text-white">
        <div className="px-5 pt-6 pb-5">
          {/* 상단 라벨 */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#FF2233]" />
            <span className="text-[11px] tracking-[0.18em] text-[#B1B5BB]">
              PRODUCT DETAIL
            </span>
          </div>

          {/* 타이틀 */}
          <h1 className="mt-3 text-[20px] font-semibold leading-[1.6] tracking-[-0.3px]">
            {data.name}
            <span className="ml-1 text-[#FF8A9A]">상품 구성 안내</span>
          </h1>

          {/* 서브 카피 */}
          <p className="mt-2 text-[12px] text-[#D2D5DB] leading-[1.7]">
            촬영, 본식, 상담까지 한 번에 진행되는{" "}
            <span className="font-semibold text-white">실제 진행 플로우</span>와{" "}
            <span className="font-semibold text-white">포함 옵션</span>을
            확인하고, 나에게 맞는 웨딩을 준비해 보세요.
          </p>

          {/* 메타 칩들 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {data.bzName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] text-[#E5E7EB]">
                <Icon icon="solar:buildings-2-linear" className="h-3.5 w-3.5" />
                {data.bzName}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] text-[#E5E7EB]">
              <Icon
                icon="solar:star-fall-linear"
                className="h-3.5 w-3.5 text-[#FBBF24]"
              />
              촬영 / 본식 패키지 안내
            </span>

            {availableTimes && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] text-[#E5E7EB]">
                <Icon
                  icon="solar:clock-circle-linear"
                  className="h-3.5 w-3.5"
                />
                이용 가능 시간 포함
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 섹션 구분바 */}
      <div className="w-full h-2 bg-[#F7F9FA]" />

      {/* ========================= 요약 안내 카드 ========================= */}
      <section className="px-5 pt-5 pb-3">
        <div className="rounded-2xl bg-[#F5F6FA] border border-[#E5E7EB] px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-2">
            <div className="mt-[2px] flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
              <Icon
                icon="solar:info-circle-linear"
                className="h-4 w-4 text-[#4B5563]"
              />
            </div>
            <div className="flex-1">
              <p className="text-[12px] leading-[1.7] text-[#4B5563]">
                이 상품은{" "}
                <span className="font-semibold text-[#111827]">
                  상담 &gt; 컨셉 협의 &gt; 촬영/본식 진행
                </span>{" "}
                순서로 진행돼요. 예약 전{" "}
                <span className="font-semibold text-[#FF2233]">
                  포함 구성과 추가 비용
                </span>
                을 꼭 확인해 주세요.
              </p>

              {availableTimes && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-[8px] bg-white px-2.5 py-1 text-[11px] text-[#374151]">
                  <Icon
                    icon="solar:calendar-linear"
                    className="h-3.5 w-3.5 text-[#FF2233]"
                  />
                  {availableTimes}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================= 포함 구성 / 프로세스 / 유의사항 ========================= */}
      <section className="px-5 pt-2 pb-6 space-y-4">
        {/* 포함 구성 */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-5 items-center rounded-full bg-[#FFF2F2] px-2 text-[10px] font-semibold text-[#FF4E5C]">
                기본 구성
              </span>
              <h2 className="text-[14px] font-semibold text-[#111827]">
                이 패키지에 포함된 것들
              </h2>
            </div>
          </div>

          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12px] leading-[1.7] text-[#4B5563]">
            <li>웨딩 컨셉 및 예산 상담</li>
            <li>촬영 / 본식 일정 예약 및 진행 안내</li>
            <li>상품 옵션 선택 및 피팅(해당 시)</li>
            <li>패키지 내 포함/미포함 항목 상세 안내</li>
          </ul>

          {detailText && (
            <div className="mt-3 rounded-xl bg-[#F9FAFB] px-3 py-2.5 text-[11px] text-[#4B5563] whitespace-pre-line">
              {detailText}
            </div>
          )}
        </div>

        {/* 이용 & 상담 프로세스 */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="inline-flex h-5 items-center rounded-full bg-[#EEF2FF] px-2 text-[10px] font-semibold text-[#4F46E5]">
              진행 순서
            </span>
            <h2 className="text-[14px] font-semibold text-[#111827]">
              이용 & 상담 프로세스
            </h2>
          </div>

          <ol className="mt-2 space-y-2">
            <li className="flex items-start gap-3">
              <div className="mt-[2px] flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF2FF] text-[11px] font-semibold text-[#4F46E5]">
                1
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-[#111827]">
                  컨셉 및 예산 상담
                </p>
                <p className="text-[11px] text-[#6B7280] leading-[1.7]">
                  원하는 분위기, 예식 일정, 예산 범위를 기준으로 상담이
                  진행됩니다.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-[2px] flex h-6 w-6 items-center justify-center rounded-full bg-[#E0F2FE] text-[11px] font-semibold text-[#0369A1]">
                2
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-[#111827]">
                  옵션 / 패키지 구성 확정
                </p>
                <p className="text-[11px] text-[#6B7280] leading-[1.7]">
                  촬영/본식 여부, 인원, 추가 옵션(드레스, 메이크업 등)을 최종
                  확정합니다.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-[2px] flex h-6 w-6 items-center justify-center rounded-full bg-[#DCFCE7] text-[11px] font-semibold text-[#16A34A]">
                3
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-[#111827]">
                  일정 확정 및 안내
                </p>
                <p className="text-[11px] text-[#6B7280] leading-[1.7]">
                  최종 일정 확정 후, 준비물/리마인드 안내를 받아보실 수 있어요.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* 유의사항 */}
        <div className="rounded-2xl border border-[#FECACA] bg-[#FFF7F8] px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Icon
              icon="solar:danger-triangle-linear"
              className="h-4 w-4 text-[#DC2626]"
            />
            <h2 className="text-[14px] font-semibold text-[#B91C1C]">
              예약 / 취소 유의사항
            </h2>
          </div>
          <p className="text-[12px] text-[#4B5563] leading-[1.7]">
            예약일 기준{" "}
            <span className="font-semibold text-[#B91C1C]">
              7일 이내 취소 시 위약금
            </span>
            이 발생할 수 있으며, 시즌 및 요일에 따라{" "}
            <span className="font-semibold text-[#B91C1C]">
              일부 옵션은 추가 비용
            </span>
            이 발생할 수 있습니다. 정확한 정책은 업체와 상담 시 다시 한 번
            확인해 주세요.
          </p>
        </div>
      </section>

      {/* 섹션 구분바 */}
      <div className="w-full h-2 bg-[#F7F9FA]" />

      {/* ========================= 상세 이미지 섹션 ========================= */}
      <section className="px-5 pt-5 pb-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#111827]">
              상품 상세 이미지
            </h3>
            <p className="mt-1 text-[11px] text-[#9CA3AF]">
              실제 촬영 공간 / 본식 홀 / 동선 등을 이미지로 확인해 보세요.
            </p>
          </div>
          {hasDetailImages && (
            <div className="flex items-center gap-1 text-[11px] text-[#6B7280]">
              <Icon icon="solar:gallery-wide-linear" className="h-3.5 w-3.5" />
              <span>{detailImages.length}장</span>
            </div>
          )}
        </div>

        {hasDetailImages ? (
          <div className="space-y-3">
            {detailImages.map((img, index) => (
              <div
                key={`${img.id ?? img.url}-${index}`}
                className="relative w-full overflow-hidden rounded-[14px] bg-[#F3F4F6] border border-[#E5E7EB] shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
              >
                <img
                  src={img.url}
                  alt={`${data.name} 상세 이미지 ${index + 1}`}
                  className="w-full max-h-[540px] object-cover"
                  loading="lazy"
                />

                {/* 우측 상단 뱃지 */}
                <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
                  {index + 1} / {detailImages.length}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-[180px] rounded-[14px] bg-gradient-to-r from-[#F3F4F6] via-[#E5E7EB] to-[#F3F4F6] animate-pulse"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
