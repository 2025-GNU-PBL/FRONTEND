import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";
import api from "../../../lib/api/axios";

export type ConfirmResponse = {
  orderCode: string;
  paymentMethod: string;
  amount: number;
  receiptUrl: string;
};

// /api/v1/payments/{paymentKey} 응답 타입
export interface PaymentDetail {
  paymentKey: string;
  orderCode: string;
  shopName: string;
  productName: string;
  thumbnailUrl: string;
  originalPrice: number;
  discountAmount: number;
  totalPrice: number;
  paidAmount: number;
  status: string;
  approvedAt: string;
  canceledAt: string | null;
  cancelReason: string | null;
  receiptUrl: string;
  paymentMethod: string;
  pgProvider: string;
  rejectReason: string | null;
  rejectedAt: string | null;
}

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [responseData, setResponseData] = useState<ConfirmResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // 결제 상세 조회용 상태 (WebView/MobileView 공통 사용)
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState<boolean>(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      const paymentKey = searchParams.get("paymentKey") ?? "";
      const orderId = searchParams.get("orderId") ?? "";
      const amountParam = searchParams.get("amount");
      const amountNumber = Number(amountParam ?? "0");

      // ✅ 결제 성공 페이지로 올 때 우리가 추가로 붙인 userCouponId
      const userCouponIdParam = searchParams.get("userCouponId");
      const userCouponId =
        userCouponIdParam && userCouponIdParam !== ""
          ? Number(userCouponIdParam)
          : null;

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

      setLoading(true);
      setDetailLoading(true);
      setDetailError(null);
      setPaymentDetail(null);

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

        // ✅ 결제 확인 성공 후에만 쿠폰 사용 처리
        if (userCouponId) {
          try {
            const couponUseRes = await api.post(
              `/api/v1/customer/coupon/my/${userCouponId}/use`
            );
            console.log("[COUPON_USE_SUCCESS]", couponUseRes.data);
          } catch (couponError) {
            console.error("[COUPON_USE_ERROR]", couponError);
          }
        }

        // ✅ 결제 확인까지 성공했다면, 실제 결제 상세 정보 조회
        try {
          console.log("[PAYMENTS_DETAIL_REQUEST]", {
            url: `/api/v1/payments/${paymentKey}`,
            method: "GET",
          });

          const detailRes = await api.get<PaymentDetail>(
            `/api/v1/payments/${paymentKey}`
          );

          console.log("[PAYMENTS_DETAIL_SUCCESS]", detailRes.data);
          setPaymentDetail(detailRes.data);
        } catch (detailErr) {
          console.error("[PAYMENTS_DETAIL_ERROR]", detailErr);
          setDetailError("결제 정보를 불러오는 중 오류가 발생했어요.");
        }
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

        let message = respData?.message;
        if (!message) {
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
        setDetailLoading(false);
      }
    }

    confirm();
  }, [navigate, searchParams]);

  const paymentKeyForDisplay = searchParams.get("paymentKey") ?? "";
  const orderIdFromQuery = searchParams.get("orderId") ?? "";

  return (
    <div className="min-h-screen">
      {/* 모바일 뷰 */}
      <div className="md:hidden">
        <MobileView
          loading={loading}
          responseData={responseData}
          paymentKey={paymentKeyForDisplay}
          orderId={orderIdFromQuery}
          paymentDetail={paymentDetail}
          detailLoading={detailLoading}
          detailError={detailError}
        />
      </div>

      {/* 웹 뷰 */}
      <div className="hidden md:block">
        <WebView
          loading={loading}
          responseData={responseData}
          paymentKey={paymentKeyForDisplay}
          orderId={orderIdFromQuery}
          paymentDetail={paymentDetail}
          detailLoading={detailLoading}
          detailError={detailError}
        />
      </div>
    </div>
  );
};

export default Success;
