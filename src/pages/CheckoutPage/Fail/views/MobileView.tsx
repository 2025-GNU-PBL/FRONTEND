import { useNavigate, useSearchParams } from "react-router-dom";

const MobileView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorMessage =
    searchParams.get("message") || "일시적인 오류가 발생했어요.";
  const errorCode = searchParams.get("code") || "-";

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleRetryPayment = () => {
    navigate("/checkout");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-[#fee2e2] to-[#f9fafb] text-[#1E2124]">
      {/* 화면 중앙에 배치되는 컨테이너 */}
      <main className="flex flex-1 items-center justify-center px-5 pb-[120px]">
        <div className="w-full rounded-2xl border border-[#fee2e2] bg-white px-5 py-6 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
          {/* 헤더 / 배지 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fef2f2] px-3 py-1 text-[11px] font-medium text-[#b91c1c]">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
              <span>결제가 정상적으로 처리되지 않았어요</span>
            </div>

            <img
              width={80}
              src="https://static.toss.im/lotties/error-spot-no-loop-space-apng.png"
              alt="결제 실패 이미지"
              className="mb-3"
            />

            <h2 className="text-[20px] font-semibold text-[#111827]">
              결제를 실패했어요
            </h2>
            <p className="mt-2 text-[12px] text-[#6b7280]">
              아래 오류 내용을 확인하신 뒤, 다시 결제를 진행해 주세요.
            </p>
          </div>

          {/* 에러 정보 섹션 */}
          <div className="mt-6">
            <h3 className="mb-3 text-[13px] font-semibold text-[#111827]">
              오류 정보
            </h3>

            <div className="space-y-3 text-[12px]">
              <div className="flex flex-col gap-1 rounded-2xl border border-[#fee2e2] bg-[#fef2f2] px-4 py-3">
                <span className="text-[11px] font-medium text-[#b91c1c]">
                  에러 메시지
                </span>
                <span className="break-words text-[#4b5563]">
                  {errorMessage}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <span className="text-[12px] text-[#6b7280]">에러 코드</span>
                <span className="text-[12px] font-semibold text-[#111827]">
                  {errorCode}
                </span>
              </div>
            </div>
          </div>

          {/* 안내 문구 */}
          <p className="mt-5 text-[11px] leading-relaxed text-[#9ca3af]">
            같은 오류가 반복될 경우 결제 수단 상태를 확인하시거나, 고객센터로
            문의해 주세요. 결제가 완료되지 않은 경우에는 결제 금액이 청구되지
            않습니다.
          </p>
        </div>
      </main>

      {/* 하단 버튼 영역 (고정) */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex w-full gap-3 px-5">
          <button
            type="button"
            onClick={handleGoHome}
            className="flex h-12 flex-1 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white"
          >
            <span className="text-[14px] font-medium text-[#1E2124]">
              홈으로
            </span>
          </button>
          <button
            type="button"
            onClick={handleRetryPayment}
            className="flex h-12 flex-1 items-center justify-center rounded-[12px] bg-[#b91c1c]"
          >
            <span className="text-[14px] font-semibold text-white">
              결제 다시 시도
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
