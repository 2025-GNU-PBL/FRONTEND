// 2) 상품상세 탭: 완전 다른 레이아웃 예시
export const DetailContent = () => {
  return (
    <>
      {/* 상품상세 전용 헤더 영역 */}
      <div className="w-full h-[220px] bg-[#111111] text-white flex flex-col justify-end px-5 pb-4">
        <p className="text-[11px] text-[#BBBBBB] mb-1">PRODUCT DETAIL</p>
        <h1 className="text-[20px] font-semibold">
          프리미엄 드레스 패키지 구성 안내
        </h1>
        <p className="mt-1 text-[11px] text-[#D9D9D9] leading-[1.6]">
          촬영용 3벌 + 본식 1벌, 체형 보완, 컨셉별 스타일 제안까지 포함되어 있는
          패키지의 상세 구성을 확인해보세요.
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
              <li>촬영 드레스 3벌 (라인/컬러 선택 가능)</li>
              <li>본식 드레스 1벌 (프리미엄 라인)</li>
              <li>1:1 스타일 컨설팅 및 피팅</li>
              <li>드레스 보정 및 클리닝 포함</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[14px] font-semibold text-[#111111] mb-1">
              피팅 & 상담 프로세스
            </h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>컨셉 및 예산 상담</li>
              <li>체형에 맞는 추천 드레스 1차 피팅</li>
              <li>촬영/본식 일정에 맞춰 최종 확정</li>
            </ol>
          </div>

          <div>
            <h2 className="text-[14px] font-semibold text-[#111111] mb-1">
              유의사항
            </h2>
            <p>
              예약일 기준 7일 이내 취소 시 위약금이 발생할 수 있으며, 시즌에
              따라 일부 드레스 라인은 추가 비용이 발생할 수 있습니다.
            </p>
          </div>
        </section>
      </div>

      {/* 큰 상세 이미지들 */}
      <div className="px-5 pt-5 pb-8 space-y-3">
        <div className="w-full h-[180px] bg-[#EFEFEF] rounded-[10px]" />
        <div className="w-full h-[180px] bg-[#EFEFEF] rounded-[10px]" />
        <div className="w-full h-[180px] bg-[#EFEFEF] rounded-[10px]" />
      </div>
    </>
  );
};
