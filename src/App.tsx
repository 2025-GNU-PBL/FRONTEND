import { useEffect, useState } from "react";
import { Outlet, Route, Routes, useLocation, useMatch } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode"; // jwtDecode import

import ClientLoginPage from "./pages/LoginPage/client/ClientLoginPage";
import OwnerLoginPage from "./pages/LoginPage/owner/OwnerLoginPage";
import KakaoCallback from "./pages/LoginPage/callbacks/KakaoCallback";
import NaverCallback from "./pages/LoginPage/callbacks/NaverCallback";

import WeddingPage from "./pages/WeddingPage/WeddingPage";
import FaqPage from "./pages/FaqPage/FaqPage";
import EventPage from "./pages/EventPage/EventPage";
import CartPage from "./pages/CartPage/CartPage";
import ChatPage from "./pages/ChatPage/ChatPage";
import ScrollToTop from "./components/ScrollToTop";

import ClientMyPageMain from "./pages/MyPage/ClientMyPage/Main/ClientMyPageMain";
import ClientProfilePage from "./pages/MyPage/ClientMyPage/Profile/ClientProfilePage";
import ClientCouponPage from "./pages/MyPage/ClientMyPage/Coupon/ClientCouponPage";
import MainPage from "./pages/MainPage/MainPage";
import StudioPage from "./pages/StudioPage/StudioPage";
import MakeupPage from "./pages/MakeupPage/MakeupPage";
import QuotationPage from "./pages/QuotationPage/QuotationPage";
import CalendarPage from "./pages/CalendarPage/main/CalendarPage";
import SearchPage from "./pages/SearchPage/SearchPage";

import ProtectedRoutes from "./components/ProtectedRoutes";
import NotAuthRoutes from "./components/NotAuthRoutes";

import { useAppSelector } from "./store/hooks";
import LoginPage from "./pages/LoginPage/RoleSelection/SelectRolePage";

import Navbar from "./layout/Navbar/Navbar";
import Footer from "./layout/Footer/Footer";
import FavoritesPage from "./pages/FavoritesPage/FavoritesPage";
import DressPage from "./pages/DressPage/DressPage";
import JoinAddressPage from "./pages/SignupPage/client/step2/JoinAddressPage";
import WeddingInfoPage from "./pages/SignupPage/client/step3/WeddingInfoPage";
import SignupClientCompletePage from "./pages/SignupPage/client/step4/SignupCompletePage";
import ClientSignupPage from "./pages/SignupPage/client/step1/ClientSignupPage";
import InquiryListPage from "./pages/MyPage/ClientMyPage/Inquiries/InquiryListPage";
import ProductInquiryPage from "./pages/ProductInquiryPage/InquiryPage";
import ReviewPage from "./pages/MyPage/ClientMyPage/Reviews/ReviewPage";
import ProductCreate from "./pages/MyPage/OwnerMyPage/ProductManagement/ProductCreate/ProductCreate";
import PaymentListPage from "./pages/MyPage/ClientMyPage/Payments/ListPage/PaymentListPage";
import PaymentDetailPage from "./pages/MyPage/ClientMyPage/Payments/DetailPage/PaymentDetailPage";
import OwnerMyPageMain from "./pages/MyPage/OwnerMyPage/Main/OwnerMyPageMain";
import OwnerSignupPage from "./pages/SignupPage/owner/step1/OwnerSignupPage";
import BusinessAddressPage from "./pages/SignupPage/owner/step2/BusinessAddressPage";
import BusinessInfoPage from "./pages/SignupPage/owner/step3/BusinessInfoPage";
import SignupOwnerCompletePage from "./pages/SignupPage/owner/step4/SignupCompletePage";
import FloatingChatButton from "./components/chat/FloatingChatButton";
import NotificationPage from "./pages/NotificationPage/NotificationPage";
import ProductDetailPage from "./pages/ProductDetailPage/ProductDetailPage";
import OwnerProfilePage from "./pages/MyPage/OwnerMyPage/Profile/OwnerProfilePage";
import ReservationManagementPage from "./pages/MyPage/OwnerMyPage/ReservationManagement/ReservationManagementPage";
import ProductList from "./pages/MyPage/OwnerMyPage/ProductManagement/ProductList/ProductList";
import CheckoutPage from "./pages/CheckoutPage/main/CheckoutPage";
import OwnerPaymentManagementPage from "./pages/MyPage/OwnerMyPage/PaymentManagement/list/OwnerPaymentManagementPage";
import CancelListPage from "./pages/MyPage/OwnerMyPage/CancellistManagement/CancelListPage";
import CancelDetailPage from "./pages/MyPage/OwnerMyPage/CancellistManagement/CancelDetailPage";
import OwnerPaymentDetailPage from "./pages/MyPage/OwnerMyPage/PaymentManagement/detail/OwnerPaymentDetailPage";
import PaymentPage from "./pages/CheckoutPage/payment/PaymentPage";
import Success from "./pages/CheckoutPage/Success/Success";
import Fail from "./pages/CheckoutPage/Fail/Fail";
import ProductEdit from "./pages/MyPage/OwnerMyPage/ProductManagement/ProductEdit/ProductEdit";
import CouponPage from "./pages/CheckoutPage/coupon/CouponPage";
import ReviewCreate from "./pages/ReviewCreatePage/ReviewCreate";
import ClientProfileEdit from "./pages/MyPage/ClientMyPage/ProfileEdit/ClientProfileEdit";
import { useRefreshAuth } from "./hooks/useRefreshAuth";
import PersonalScheduleCreatePage from "./pages/CalendarPage/personalschedule/create/PersonalScheduleCreatePage";
import PersonalScheduleEditPage from "./pages/CalendarPage/personalschedule/edit/PersonalScheduleEditPage";
import SharedScheduleEditPage from "./pages/CalendarPage/sharedschedule/SharedScheduleEdigPage";
import { subscribeToNotifications } from "./lib/api/notificationService";
import CustomNotificationToast from "./components/CustomNotificationToast/CustomNotificationToast";
import SupportPage from "./pages/SupportPage/SupportPage";
import RefundRequestPage from "./pages/MyPage/ClientMyPage/Payments/RefundPage/RefundRequestPage";
import CanceledDetailPage from "./pages/MyPage/OwnerMyPage/PaymentManagement/cancel/CanceledDetailPage";
import type { Notification } from "./type/notification";
import InquiryDetailPage from "./pages/MyPage/ClientMyPage/Inquiries/InquiryDetailPage";
import ProductDetail from "./pages/MyPage/OwnerMyPage/ProductManagement/ProductDetail/ProductDetail";
import CouponRegisterPage from "./pages/MyPage/OwnerMyPage/CouponManagement/CouponRegister/CouponRegisterPage";
import CouponListPage from "./pages/MyPage/OwnerMyPage/CouponManagement/CouponList/CouponListPage";
import OwnerProfileEditPage from "./pages/MyPage/OwnerMyPage/ProfileEdit/OwnerProfileEditPage";
import ReservationDetailPage from "./pages/MyPage/OwnerMyPage/ReservationDetail/ReservationDetailPage";

function Layout() {
  const location = useLocation();
  const isAuth = useAppSelector((state) => state.user.isAuth);

  // 채팅 디테일 여부
  const isChatDetail = !!useMatch("/chat/:id");
  // 채팅 페이지 여부 (/chat 또는 /chat/:id)
  const isChatPage = !!useMatch("/chat") || isChatDetail;

  // 디테일 페이지 매칭 (푸터 숨김용)
  const isWeddingDetail = !!useMatch("/wedding/:id");
  const isStudioDetail = !!useMatch("/studio/:id");
  const isDressDetail = !!useMatch("/dress/:id");
  const isMakeupDetail = !!useMatch("/makeup/:id");

  // 🔹 사장 상품 수정 디테일 페이지 매칭 (동적 파라미터)
  const isOwnerProductEdit = !!useMatch(
    "/my-page/owner/product/edit/:category/:id"
  );

  // 🔹 사장 상품 수정 디테일 페이지 매칭 (동적 파라미터)
  const isOwnerProductDetail = !!useMatch(
    "/my-page/owner/products/:category/:id"
  );

  const isCalendarShared = !!useMatch("/calendar/shared/:id");

  const isCalendarPersonal = !!useMatch("/calendar/personal/:id");

  const isOwnerReservation = !!useMatch("/my-page/owner/reservations/:id");

  // 네비바 숨길 경로 (정적)
  const hideNavOnPaths = [
    "/log-in",
    "/sign-up/step1",
    "/log-in/client",
    "/log-in/owner",
    "/inquiry", // InquiryPage에 Navbar 숨김
  ];

  // 푸터 숨길 경로 (정적)
  const hideFooterOnPaths = [
    "/log-in",
    "/log-in/client",
    "/log-in/owner",
    "/my-page/owner/product/create",
    "/my-page/owner/products/management",
    "/inquiry", // InquiryPage에 Footer 숨김
    "/product-inquiry", // ProductInquiryPage에 Footer 숨김
    "/notification",
    "/checkout",
    "/checkout/coupon",
    "/checkout/payment",
    "/success",
    "/fail",
    "/my-page/owner/coupons/register",
    "/my-page/owner/profile/edit",
    "/my-page/owner/reservations",
    "/my-page/owner/payments",

    "/my-page/client/profile/edit",
    "/my-page/client/payments/review",
    "/sign-up/owner/step1",
    "/sign-up/owner/step2",
    "/sign-up/owner/step3",
    "/sign-up/owner/step4",
    "/sign-up/client/step1",
    "/sign-up/client/step2",
    "/sign-up/client/step3",
    "/sign-up/client/step4",
    "/cart",
    "/calendar",
    "/calendar/personal",
  ];

  // 채팅 버튼 숨길 경로 (정적 prefix 포함)
  const hideChatButtonOnPaths = [
    "/log-in",
    "/log-in/client",
    "/log-in/owner",
    "/sign-up/client/step1",
    "/sign-up/client/step2",
    "/sign-up/client/step3",
    "/sign-up/client/step4",
    "/sign-up/owner/step1",
    "/sign-up/owner/step2",
    "/sign-up/owner/step3",
    "/sign-up/owner/step4",
  ];

  // 네비바 노출 여부
  const showNavbar = !hideNavOnPaths.includes(location.pathname);

  // 푸터 숨김 조건: 정적 + 채팅 디테일 + 디테일 페이지들 + 동적 상품 수정 페이지
  const hideFooter =
    hideFooterOnPaths.includes(location.pathname) ||
    isChatDetail ||
    isWeddingDetail ||
    isStudioDetail ||
    isDressDetail ||
    isMakeupDetail ||
    isOwnerProductEdit ||
    isOwnerProductDetail ||
    isOwnerReservation ||
    isCalendarShared ||
    isCalendarPersonal; // 🔹 추가

  const showFooter = !hideFooter;

  // 채팅 버튼 노출 여부
  const showChatButton =
    !isChatPage &&
    !hideChatButtonOnPaths.some((path) => location.pathname.startsWith(path));

  return (
    <div className="flex flex-col min-h-screen">
      <ToastContainer
        position="bottom-right"
        theme="light"
        pauseOnHover
        autoClose={1000} // autoClose 시간 3초로 조정
        hideProgressBar={true} // 프로그레스 바 숨김
        closeButton={false} // 기본 닫기 버튼 숨김
        // toastClassName="custom-toastify-toast" // CustomNotificationToast에만 적용되도록 여기서 제거
      />
      <ScrollToTop />
      {showNavbar && <Navbar />}
      <main>
        <Outlet />
      </main>

      {isAuth && (
        <div className="hidden md:block">
          {showChatButton && <FloatingChatButton />}
        </div>
      )}

      {showFooter && <Footer />}
    </div>
  );
}

const App = () => {
  const { isAuth } = useAppSelector((state) => state.user); // isAuth만 가져오도록 수정
  const rehydrated = useAppSelector((state) => state._persist?.rehydrated);

  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>(
    []
  );
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); // userId 상태 추가
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null); // userRole 상태 추가

  // AccessToken 변경 및 디코딩
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token !== currentAccessToken) {
      setCurrentAccessToken(token);
    }

    if (token) {
      try {
        const decodedToken: { user_id: number; user_role: string } =
          jwtDecode(token); // 토큰 디코딩
        setCurrentUserId(decodedToken.user_id);
        setCurrentUserRole(decodedToken.user_role);
      } catch (error) {
        console.error("Error decoding access token:", error);
        setCurrentUserId(null);
        setCurrentUserRole(null);
      }
    } else {
      setCurrentUserId(null);
      setCurrentUserRole(null);
    }
  }, [currentAccessToken]); // currentAccessToken이 변경될 때만 실행되도록

  const { refreshAuth } = useRefreshAuth();

  useEffect(() => {
    if (!rehydrated || !isAuth) return;
    refreshAuth();
  }, [rehydrated, isAuth, refreshAuth]);

  // SSE 구독 useEffect
  useEffect(() => {
    let cleanup: () => void = () => {};

    // accessToken, userId, userRole이 모두 있을 때만 구독 시작
    if (
      isAuth &&
      currentAccessToken &&
      currentUserId !== null &&
      currentUserRole !== null
    ) {
      cleanup = subscribeToNotifications(
        (newNotification) => {
          // 현재 로그인한 사용자가 알림의 대상인지 확인
          const isTargetUser =
            newNotification.recipientId === currentUserId &&
            newNotification.recipientRole === currentUserRole;

          if (isTargetUser) {
            setLiveNotifications((prev) => [newNotification, ...prev]);
            toast(
              <CustomNotificationToast message={newNotification.message} />,
              {
                onClick: () => {
                  if (newNotification.type === "PAYMENT_REQUIRED") {
                    window.location.href = "/checkout";
                  } else if (
                    newNotification.type === "PAYMENT_COMPLETED" &&
                    newNotification.actionUrl
                  ) {
                    // 결제 완료 알림 → 결제 상세 페이지로 리다이렉트 (actionUrl 사용)
                    window.location.href = newNotification.actionUrl;
                  } else if (
                    newNotification.type === "RESERVATION_COMPLETED" &&
                    newNotification.recipientRole === "OWNER" &&
                    newNotification.reservationId
                  ) {
                    // 예약 요청 알림 (사장님) → 예약 상세 페이지로 리다이렉트
                    window.location.href = `/my-page/owner/reservations/${newNotification.reservationId}`;
                  } else if (newNotification.actionUrl) {
                    window.location.href = newNotification.actionUrl;
                  } else {
                    window.location.href = "/notification";
                  }
                },
                hideProgressBar: true,
                closeButton: false,
                className: "custom-toastify-toast", // CustomNotificationToast의 루트 요소에 적용
              }
            );
          }
        },
        (error) => {
          console.error("SSE subscription error:", error);
          toast.error("알림 구독 중 오류가 발생했습니다.");
        }
      );
    } else {
      setLiveNotifications([]);
    }

    return cleanup;
  }, [isAuth, currentAccessToken, currentUserId, currentUserRole]); // 디코딩된 userId와 userRole을 의존성 배열에 추가

  // 리덕스 퍼시스트 완료 전까지 렌더링 지연
  if (!rehydrated) return null;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<MainPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/event" element={<EventPage />} />
        <Route path="/wedding" element={<WeddingPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/dress" element={<DressPage />} />
        <Route path="/makeup" element={<MakeupPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/quotation" element={<QuotationPage />} />
        <Route
          path="/notification"
          element={<NotificationPage liveNotifications={liveNotifications} />}
        />
        <Route path="/wedding/:id" element={<ProductDetailPage />} />
        <Route path="/studio/:id" element={<ProductDetailPage />} />
        <Route path="/dress/:id" element={<ProductDetailPage />} />
        <Route path="/makeup/:id" element={<ProductDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/coupon" element={<CouponPage />} />
        <Route path="/checkout/payment" element={<PaymentPage />} />
        <Route path="/success" element={<Success />} />
        <Route path="/fail" element={<Fail />} />
        <Route path="/support" element={<SupportPage />} />

        <Route path="/test" element={<OwnerSignupPage />} />

        {/* 로그인한 사람만 접근 가능 */}
        <Route element={<ProtectedRoutes isAuth={isAuth} />}>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route
            path="/product-inquiry"
            element={<ProductInquiryPage />}
          />{" "}
          <Route
            path="/calendar/personal"
            element={<PersonalScheduleCreatePage />}
          />
          <Route
            path="/calendar/personal/:id"
            element={<PersonalScheduleEditPage />}
          />
          <Route
            path="/calendar/shared/:id"
            element={<SharedScheduleEditPage />}
          />
          {/* 고객 마이페이지 */}
          <Route path="/my-page/client" element={<ClientMyPageMain />} />
          <Route
            path="/my-page/client/profile"
            element={<ClientProfilePage />}
          />
          <Route
            path="/my-page/client/profile/edit"
            element={<ClientProfileEdit />}
          />
          <Route
            path="/my-page/client/coupons"
            element={<ClientCouponPage />}
          />
          <Route
            path="/my-page/client/inquiries"
            element={<InquiryListPage />}
          />
          <Route
            path="/my-page/client/inquiries/:inquiryId"
            element={<InquiryDetailPage />}
          />
          <Route path="/my-page/client/reviews" element={<ReviewPage />} />
          <Route
            path="/my-page/client/payments"
            element={<PaymentListPage />}
          />
          <Route
            path="/my-page/client/payments/refund/:paymentKey"
            element={<RefundRequestPage />}
          />
          <Route
            path="/my-page/client/payments/review"
            element={<ReviewCreate />}
          />
          <Route
            path="/my-page/client/payments/:paymentKey"
            element={<PaymentDetailPage />}
          />
          <Route path="/sign-up/client/step1" element={<ClientSignupPage />} />
          <Route path="/sign-up/client/step2" element={<JoinAddressPage />} />
          <Route path="/sign-up/client/step3" element={<WeddingInfoPage />} />
          <Route
            path="/sign-up/client/step4"
            element={<SignupClientCompletePage />}
          />
          {/* 사장 마이페이지 */}
          <Route path="/my-page/owner" element={<OwnerMyPageMain />} />
          <Route path="/my-page/owner/profile" element={<OwnerProfilePage />} />
          <Route
            path="/my-page/owner/profile/edit"
            element={<OwnerProfileEditPage />}
          />
          <Route path="/my-page/owner/coupons" element={<CouponListPage />} />
          <Route
            path="/my-page/owner/coupons/register"
            element={<CouponRegisterPage />}
          />
          <Route
            path="/my-page/owner/reservations"
            element={<ReservationManagementPage />}
          />
          <Route
            path="/my-page/owner/reservations/:reservationId"
            element={<ReservationDetailPage />}
          />
          <Route
            path="/my-page/owner/products/:category/:id"
            element={<ProductDetail />}
          />
          <Route
            path="/my-page/owner/products/management"
            element={<ProductList />}
          />
          <Route
            path="/my-page/owner/product/create"
            element={<ProductCreate />}
          />
          <Route
            path="/my-page/owner/product/edit/:category/:id"
            element={<ProductEdit />}
          />
          <Route
            path="/my-page/owner/payments"
            element={<OwnerPaymentManagementPage />}
          />
          <Route
            path="/my-page/owner/payments/detail"
            element={<OwnerPaymentDetailPage />}
          />
          <Route path="/my-page/owner/cancels" element={<CancelListPage />} />
          <Route
            path="/my-page/owner/cancels/detail/request"
            element={<CancelDetailPage />}
          />
          <Route
            path="/my-page/owner/cancels/detail/done"
            element={<CanceledDetailPage />}
          />
          <Route path="/sign-up/owner/step1" element={<OwnerSignupPage />} />
          <Route
            path="/sign-up/owner/step2"
            element={<BusinessAddressPage />}
          />
          <Route path="/sign-up/owner/step3" element={<BusinessInfoPage />} />
          <Route
            path="/sign-up/owner/step4"
            element={<SignupOwnerCompletePage />}
          />
        </Route>

        {/* 로그인한 사람은 접근 불가 */}
        <Route element={<NotAuthRoutes isAuth={isAuth} />}>
          <Route path="/log-in" element={<LoginPage />} />
          <Route path="/log-in/client" element={<ClientLoginPage />} />
          <Route path="/log-in/owner" element={<OwnerLoginPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/auth/naver/callback" element={<NaverCallback />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
