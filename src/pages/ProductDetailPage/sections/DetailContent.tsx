// sections/DetailContent.tsx
import type { NormalizedDetail } from "../../../type/product";

/* ========================= Props ========================= */

type DetailContentProps = {
  data: NormalizedDetail;
};

/* ========================= 컴포넌트 ========================= */

export const DetailContent = ({ data }: DetailContentProps) => {
  // 필요하면 category / data.detail 등을 사용해서
  // 카테고리별로 다른 설명을 노출할 수 있음.

  return (
    <>
      {/* 상품상세 전용 헤더 영역 */}
      <div className="w-full h-[220px] bg-[#111111] text-white flex flex-col justify-end px-5 pb-4">
        <p className="text-[11px] text-[#BBBBBB] mb-1">PRODUCT DETAIL</p>
        <h1 className="text-[20px] font-semibold">
          {data.name} 상품 구성 안내
        </h1>
        <p className="mt-1 text-[11px] text-[#D9D9D9] leading-[1.6]">
          촬영용, 본식, 상담, 컨셉 제안까지 포함되어 있는 패키지의 상세 구성을
          확인해보세요.
        </p>
      </div>

      {/* 상세 정보 섹션 */}
      <div className="px-5 pt-5">
        <section className="space-y-3 text-[12px] text-[#444444] leading-[1.8]">
          <div>
            <h2 className="text-[14px] font-semibold text-[#111111] mb-1">
              포함 구성
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>상담 및 컨셉 협의</li>
              <li>촬영 / 이용 일정 예약 및 안내</li>
              <li>상품 옵션 선택 및 피팅(해당 시)</li>
              <li>추가 비용 및 유의사항 상세 안내</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[14px] font-semibold text-[#111111] mb-1">
              이용 & 상담 프로세스
            </h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>컨셉 및 예산 상담</li>
              <li>옵션 / 패키지 구성 안내</li>
              <li>일정 확정 및 최종 확정</li>
            </ol>
          </div>

          <div>
            <h2 className="text-[14px] font-semibold text-[#111111] mb-1">
              유의사항
            </h2>
            <p>
              예약일 기준 7일 이내 취소 시 위약금이 발생할 수 있으며, 시즌에
              따라 일부 옵션은 추가 비용이 발생할 수 있습니다.
            </p>
          </div>
        </section>
      </div>

      {/* 큰 상세 이미지들 (실제 이미지가 있다면 data.images 활용해서 교체 가능) */}
      <div className="px-5 pt-5 pb-8 space-y-3">
        <div className="w-full h-[180px] bg-[#EFEFEF] rounded-[10px]" />
        <div className="w-full h-[180px] bg-[#EFEFEF] rounded-[10px]" />
        <div className="w-full h-[180px] bg-[#EFEFEF] rounded-[10px]" />
      </div>
    </>
  );
};
