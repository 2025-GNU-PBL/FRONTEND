import { Link, useSearchParams } from "react-router-dom";

const WebView = () => {
  const [searchParams] = useSearchParams();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8f3ff]">
      <div
        id="info"
        className="
          w-[600px] max-w-full
          bg-white text-[#333d4b]
          rounded-[10px]
          shadow-[0_10px_20px_rgba(0,0,0,0.01),0_6px_6px_rgba(0,0,0,0.06)]
          px-[50px] py-[50px]
          mt-[30px] mx-auto
          flex flex-col items-center text-center
          overflow-x-auto whitespace-nowrap
        "
      >
        <img
          width={100}
          src="https://static.toss.im/lotties/error-spot-no-loop-space-apng.png"
          alt="에러 이미지"
          className="mb-3"
        />
        <h2 className="m-0 mb-1 text-[24px] font-semibold text-[#4e5968]">
          결제를 실패했어요
        </h2>

        {/* 에러 메시지 */}
        <div className="flex flex-wrap w-full mt-[50px] text-[15px] leading-[1.6]">
          <div className="flex-1 text-left font-semibold text-[#4e5968]">
            에러메시지
          </div>
          <div className="flex-1 text-right text-[#4e5968]" id="message">
            {searchParams.get("message")}
          </div>
        </div>

        {/* 에러 코드 */}
        <div className="flex flex-wrap w-full mt-[10px] text-[15px] leading-[1.6]">
          <div className="flex-1 text-left font-semibold text-[#4e5968]">
            에러코드
          </div>
          <div className="flex-1 text-right text-[#4e5968]" id="code">
            {searchParams.get("code")}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="mt-[30px] w-full flex justify-center">
          <Link
            to="https://docs.tosspayments.com/guides/v2/payment-widget/integration"
            className="mx-[15px]"
          >
            <button
              className="
                w-[250px]
                text-[15px] font-semibold leading-[18px]
                px-[16px] py-[11px]
                rounded-[7px]
                text-[#f9fafb]
                bg-[#3182f6]
                border border-transparent
                whitespace-nowrap text-center
                cursor-pointer
                transition-[background,color] duration-200
                hover:bg-[#1b64da] hover:text-white
              "
            >
              연동 문서
            </button>
          </Link>

          <Link to="https://discord.gg/A4fRFXQhRu" className="mx-[15px]">
            <button
              className="
                w-[250px]
                text-[15px] font-semibold leading-[18px]
                px-[16px] py-[11px]
                rounded-[7px]
                whitespace-nowrap text-center
                cursor-pointer
                border border-[#1b64da]
                bg-[#e8f3ff] text-[#1b64da]
                transition-[background,color] duration-200
                hover:bg-[#1b64da] hover:text-white
              "
            >
              실시간 문의
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WebView;
