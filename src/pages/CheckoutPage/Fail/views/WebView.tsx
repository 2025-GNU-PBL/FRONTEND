import { useNavigate, useSearchParams } from "react-router-dom";

const WebView = () => {
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
    <div className="min-h-screen bg-gradient-to-b from-[#fee2e2] to-[#f9fafb] flex flex-col items-center px-4 py-10">
      {/* 메인 카드 */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-[#fee2e2] px-6 py-7 sm:px-8 sm:py-9">
        {/* 상단 상태 배지 & 타이틀 */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-[#fef2f2] text-[#b91c1c]">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span>결제가 정상적으로 처리되지 않았어요</span>
          </div>

          <img
            width={90}
            src="https://static.toss.im/lotties/error-spot-no-loop-space-apng.png"
            alt="결제 실패 이미지"
            className="mb-3"
          />

          <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#111827]">
            결제를 실패했어요
          </h2>
          <p className="mt-2 text-[13px] sm:text-[14px] text-[#6b7280]">
            결제가 완료되지 않았습니다. 아래 오류 내용을 확인하신 뒤 다시 결제를
            진행해 주세요.
          </p>
        </div>

        {/* 에러 정보 섹션 */}
        <div className="mt-7 sm:mt-8">
          <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
            오류 정보
          </h3>

          <div className="space-y-3 text-[13px] sm:text-[14px]">
            <div className="flex flex-col gap-1 rounded-2xl border border-[#fee2e2] bg-[#fef2f2] px-4 py-3">
              <span className="text-[12px] sm:text-[13px] font-medium text-[#b91c1c]">
                에러 메시지
              </span>
              <span className="text-[#4b5563] break-words">{errorMessage}</span>
            </div>

            <div className="flex justify-between items-center rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
              <span className="text-[#6b7280] text-[13px] sm:text-[14px]">
                에러 코드
              </span>
              <span className="font-semibold text-[#111827] text-[13px] sm:text-[14px]">
                {errorCode}
              </span>
            </div>
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="mt-6 text-[12px] sm:text-[13px] text-[#9ca3af] leading-relaxed">
          같은 오류가 여러 번 반복된다면, 사용 중인 카드나 계좌 상태를
          확인하시거나 고객센터로 문의해 주세요. 결제가 진행되지 않은 경우에는
          결제 금액이 청구되지 않습니다.
        </p>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="mt-6 w-full max-w-xl flex gap-3">
        <button
          type="button"
          onClick={handleGoHome}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111827] hover:bg-[#f9fafb] transition-colors"
        >
          홈으로
        </button>
        <button
          type="button"
          onClick={handleRetryPayment}
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#b91c1c] text-[14px] font-semibold text-white shadow-[0_10px_25px_rgba(185,28,28,0.35)] hover:bg-[#991b1b] transition-colors"
        >
          결제 다시 시도
        </button>
      </div>
    </div>
  );
};

export default WebView;
