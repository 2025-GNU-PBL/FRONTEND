import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../../lib/api/axios";

type ConfirmResponse = {
  orderCode: string;
  paymentMethod: string;
  amount: number;
  receiptUrl: string;
};

const WebView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [responseData, setResponseData] = useState<ConfirmResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function confirm() {
      const paymentKey = searchParams.get("paymentKey") ?? "";
      const orderId = searchParams.get("orderId") ?? "";
      const amountParam = searchParams.get("amount");
      const amountNumber = Number(amountParam ?? "0");

      if (
        !paymentKey ||
        !orderId ||
        amountParam === null ||
        Number.isNaN(amountNumber)
      ) {
        console.error(
          "[PAYMENTS_CONFIRM_PARAM_ERROR]",
          "paymentKey, orderId, amountParam 중 하나 이상이 잘못되었습니다.",
          {
            paymentKey,
            orderId,
            amountParam,
            amountNumber,
          }
        );

        navigate(
          `/fail?code=INVALID_PARAMS&message=${encodeURIComponent(
            "결제 정보가 올바르지 않습니다."
          )}`
        );
        return;
      }

      const requestData = {
        paymentKey,
        orderId,
        amount: amountNumber,
      };

      try {
        console.log("[PAYMENTS_CONFIRM_REQUEST]", {
          url: "/api/v1/payments/confirm",
          method: "POST",
          body: requestData,
        });

        const { data } = await api.post<ConfirmResponse>(
          "/api/v1/payments/confirm",
          requestData
        );

        console.log("[PAYMENTS_CONFIRM_SUCCESS]", data);

        setResponseData(data);
      } catch (error: any) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;
        const respData = error?.response?.data;
        const reqUrl = error?.config?.url;
        const reqMethod = error?.config?.method;

        console.error("[PAYMENTS_CONFIRM_ERROR]", {
          status,
          statusText,
          reqUrl,
          reqMethod,
        });

        console.error("[PAYMENTS_CONFIRM_ERROR_RESPONSE_DATA]", respData);

        const code = respData?.code ?? "COMMON500";

        // message가 null이어도 화면에 어느 정도 정보가 보이도록 처리
        let message = respData?.message;
        if (!message) {
          // 서버에서 message를 안 내려주는 경우 코드 기반 기본 메시지 구성
          if (code === "PAYMENT001") {
            message =
              "결제 정보가 유효하지 않거나 검증에 실패했습니다. (PAYMENT001)";
          } else {
            message = `결제 확인에 실패했습니다. (${code})`;
          }
        }

        navigate(`/fail?code=${code}&message=${encodeURIComponent(message)}`);
      } finally {
        setLoading(false);
      }
    }

    confirm();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8f3ff]">
        <div className="bg-white rounded-[10px] shadow px-10 py-8 text-[#4e5968]">
          결제 정보를 확인하는 중입니다...
        </div>
      </div>
    );
  }

  const finalAmount = responseData?.amount ?? 0;
  const finalOrderCode =
    responseData?.orderCode ?? searchParams.get("orderId") ?? "";
  const paymentKeyForDisplay = searchParams.get("paymentKey");
  const paymentMethodForDisplay = responseData?.paymentMethod;
  const receiptUrlForDisplay = responseData?.receiptUrl;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e8f3ff] px-4 py-10">
      <div
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
          src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
          alt="결제 완료 이미지"
          className="mb-3"
        />
        <h2 className="m-0 mb-1 text-[24px] font-semibold text-[#4e5968]">
          결제를 완료했어요
        </h2>

        <div className="flex flex-wrap w-full mt-[50px] text-[15px] leading-[1.6]">
          <div className="flex-1 text-left font-semibold text-[#4e5968]">
            결제금액
          </div>
          <div className="flex-1 text-right text-[#4e5968]">
            {finalAmount.toLocaleString()}원
          </div>
        </div>

        <div className="flex flex-wrap w-full mt-[10px] text-[15px] leading-[1.6]">
          <div className="flex-1 text-left font-semibold text-[#4e5968]">
            주문번호
          </div>
          <div className="flex-1 text-right text-[#4e5968]">
            {finalOrderCode}
          </div>
        </div>

        {paymentMethodForDisplay && (
          <div className="flex flex-wrap w-full mt-[10px] text-[15px] leading-[1.6]">
            <div className="flex-1 text-left font-semibold text-[#4e5968]">
              결제수단
            </div>
            <div className="flex-1 text-right text-[#4e5968]">
              {paymentMethodForDisplay}
            </div>
          </div>
        )}

        <div className="flex flex-wrap w-full mt-[10px] text-[15px] leading-[1.6]">
          <div className="flex-1 text-left font-semibold text-[#4e5968]">
            paymentKey
          </div>
          <div className="flex-1 text-right text-[#4e5968] whitespace-normal w-[250px]">
            {paymentKeyForDisplay}
          </div>
        </div>

        {receiptUrlForDisplay && (
          <div className="flex flex-wrap w-full mt-[10px] text-[15px] leading-[1.6]">
            <div className="flex-1 text-left font-semibold text-[#4e5968]">
              영수증
            </div>
            <div className="flex-1 text-right text-[#3182f6]">
              <a
                href={receiptUrlForDisplay}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                영수증 확인하기
              </a>
            </div>
          </div>
        )}

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
                hover:bg-[#1b64da]
                transition
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
                bg-[#e8f3ff] text-[#1b64da]
                border border-[#1b64da]
                hover:bg-[#1b64da] hover:text-white
                transition
              "
            >
              실시간 문의
            </button>
          </Link>
        </div>
      </div>

      <div
        className="
          w-[600px] max-w-full
          bg-white text-[#333d4b]
          rounded-[10px]
          shadow-[0_10px_20px_rgba(0,0,0,0.01),0_6px_6px_rgba(0,0,0,0.06)]
          px-[50px] py-[50px]
          mt-[30px] mx-auto
          text-left
          overflow-x-auto whitespace-nowrap
        "
      >
        <b className="text-[#4e5968]">Response Data :</b>

        <div
          className="mt-3 whitespace-pre-wrap text-[13px] leading-[1.6] text-[#4e5968]"
          id="response"
        >
          {responseData && <pre>{JSON.stringify(responseData, null, 4)}</pre>}
        </div>
      </div>
    </div>
  );
};

export default WebView;
