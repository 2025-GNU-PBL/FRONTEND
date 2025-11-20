import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation, useMatch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
import ClientCouponPage from "./pages/MyPage/ClientMyPage/Coupons/CouponPage";
import MainPage from "./pages/MainPage/MainPage";
import StudioPage from "./pages/StudioPage/StudioPage";
import MakeupPage from "./pages/MakeupPage/MakeupPage";
import QuotationPage from "./pages/QuotationPage/QuotationPage";
import CalendarPage from "./pages/CalendarPage/CalendarPage";
import SearchPage from "./pages/SearchPage/SearchPage";

import ProtectedRoutes from "./components/ProtectedRoutes";
import NotAuthRoutes from "./components/NotAuthRoutes";

import { useAppDispatch, useAppSelector } from "./store/hooks";
import LoginPage from "./pages/LoginPage/RoleSelection/SelectRolePage";

import Navbar from "./layout/Navbar/Navbar";
import Footer from "./layout/Footer/Footer";
import FavoritesPage from "./pages/FavoritesPage/FavoritesPage";
import DressPage from "./pages/DressPage/DressPage";
import JoinAddressPage from "./pages/SignupPage/client/step2/JoinAddressPage";
import WeddingInfoPage from "./pages/SignupPage/client/step3/WeddingInfoPage";
import SignupClientCompletePage from "./pages/SignupPage/client/step4/SignupCompletePage";
import ClientSignupPage from "./pages/SignupPage/client/step1/ClientSignupPage";
import InquiryPage from "./pages/MyPage/ClientMyPage/Inquiries/InquiryPage";
import ProductInquiryPage from "./pages/ProductInquiryPage/InquiryPage";
import ReviewPage from "./pages/MyPage/ClientMyPage/Reviews/ReviewPage";
import { authCustomer, authOwner } from "./store/thunkFunctions";
import ProductCreate from "./pages/MyPage/OwnerMyPage/ProductManagement/ProductCreate/ProductCreate";
import PaymentListPage from "./pages/MyPage/ClientMyPage/Payments/PaymentListPage";
import PaymentDetailPage from "./pages/MyPage/ClientMyPage/Payments/PaymentDetailPage";
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
import CouponRegisterPage from "./pages/MyPage/OwnerMyPage/CouponManagement/CouponRegisterPage";
import ProductList from "./pages/MyPage/OwnerMyPage/ProductManagement/ProductList/ProductList";
import CouponEditPage from "./pages/MyPage/OwnerMyPage/CouponManagement/CouponEditPage";
import ReservationDetailPage from "./pages/MyPage/OwnerMyPage/ReservationManagement/ReservationDetailPage";
import OwnerPersonalScheduleCreatePage from "./pages/MyPage/OwnerMyPage/ScheduleManagement/OwnerPersonalScheduleCreatePage";
import OwnerSharedScheduleCreatePage from "./pages/MyPage/OwnerMyPage/ScheduleManagement/OwnerSharedScheduleCreatePage";
import CheckoutPage from "./pages/CheckoutPage/main/CheckoutPage";
import CouponPage from "./pages/MyPage/ClientMyPage/Coupons/CouponPage";
import OwnerProfileEditPage from "./pages/MyPage/OwnerMyPage/Profile/OwnerProfileEditPage";
import OwnerPaymentManagementPage from "./pages/MyPage/OwnerMyPage/PaymentManagement/OwnerPaymentManagementPage";
import CancelListPage from "./pages/MyPage/OwnerMyPage/PaymentManagement/CancelDetailPage";
import CancelDetailPage from "./pages/MyPage/OwnerMyPage/PaymentManagement/CancelDetailPage";
import OwnerPaymentDetailPage from "./pages/MyPage/OwnerMyPage/PaymentManagement/OwnerPaymentDetailPage";
import CouponListPage from "./pages/MyPage/OwnerMyPage/CouponManagement/CouponListPage";
import ProductEdit from "./pages/MyPage/OwnerMyPage/ProductManagement/ProductEdit/ProductEdit";
import OwnerPersonalScheduleEditPage from "./pages/MyPage/OwnerMyPage/ScheduleManagement/OwnerPersonalScheduleEditPage";
import Fail from "./pages/CheckoutPage/Fail/Fail";
import Success from "./pages/CheckoutPage/Success/Success";
import PaymentPage from "./pages/CheckoutPage/payment/PaymentPage";
import PaymentPage from "./pages/CheckoutPage/payment/PaymentPage";
import Success from "./pages/CheckoutPage/Success/Success";
import Fail from "./pages/CheckoutPage/Fail/Fail";

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

  // 네비바 숨길 경로 (정적)
  const hideNavOnPaths = [
    "/log-in",
    "/sign-up/step1",
    "/log-in/client",
    "/log-in/owner",
    "/inquiry", // InquiryPage에 Navbar 숨김
    "/product-inquiry", // ProductInquiryPage에 Navbar 숨김
  ];

  // 푸터 숨길 경로 (정적)
  const hideFooterOnPaths = [
    "/log-in",
    "/log-in/client",
    "/log-in/owner",
    "/my-page/owner/product/create",
    "/my-page/owner/product/edit",
    "/my-page/owner/product/list",
    "/test",
    "/inquiry", // InquiryPage에 Footer 숨김
    "/product-inquiry", // ProductInquiryPage에 Footer 숨김
    "/notification",
    "/checkout",
    "/checkout/coupon",
    "/my-page/owner/coupons/register", // 쿠폰 등록 페이지에 Footer 숨김
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

  // 푸터 숨김 조건: 정적 + 채팅 디테일 + 디테일 페이지들
  const hideFooter =
    hideFooterOnPaths.includes(location.pathname) ||
    isChatDetail ||
    isWeddingDetail ||
    isStudioDetail ||
    isDressDetail ||
    isMakeupDetail;

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
        autoClose={1500}
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
  const dispatch = useAppDispatch();

  const { isAuth, role } = useAppSelector((state) => state.user);
  const rehydrated = useAppSelector((state) => state._persist?.rehydrated);

  useEffect(() => {
    if (!rehydrated || !isAuth) return;

    if (role === "CUSTOMER") {
      dispatch(authCustomer());
    } else if (role === "OWNER") {
      dispatch(authOwner());
    } else {
      //  예외 케이스(로그인인데 role이 비어있음). 필요 시 아래 주석을 해제해 포괄 처리 가능.
      // dispatch(authOwner())
      //   .unwrap()
      //   .catch(() => dispatch(authCustomer()).unwrap().catch(() => {}));
    }
  }, [rehydrated, isAuth, role, dispatch]);

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
        <Route path="/notification" element={<NotificationPage />} />
        <Route path="/test" element={<ProductDetailPage />} />
        <Route path="/wedding/:id" element={<ProductDetailPage />} />
        <Route path="/studio/:id" element={<ProductDetailPage />} />
        <Route path="/dress/:id" element={<ProductDetailPage />} />
        <Route path="/makeup/:id" element={<ProductDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/coupon" element={<CouponPage />} />
        <Route path="/checkout/payment" element={<PaymentPage />} />
        <Route path="/success" element={<Success />} />
        <Route path="/fail" element={<Fail />} />

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
          {/* 고객 마이페이지 */}
          <Route path="/my-page/client" element={<ClientMyPageMain />} />
          <Route
            path="/my-page/client/profile"
            element={<ClientProfilePage />}
          />
          <Route
            path="/my-page/client/coupons"
            element={<ClientCouponPage />}
          />
          <Route path="/my-page/client/inquiries" element={<InquiryPage />} />
          <Route path="/my-page/client/reviews" element={<ReviewPage />} />
          <Route
            path="/my-page/client/payments"
            element={<PaymentListPage />}
          />
          <Route
            path="/my-page/client/payments/detail"
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
          <Route
            path="/my-page/owner/schedules"
            element={<OwnerScheduleCalendarPage />}
          />
          <Route
            path="/my-page/owner/schedules/personal"
            element={<OwnerPersonalScheduleCreatePage />}
          />
          <Route
            path="/my-page/owner/schedules/personal/edit/:id"
            element={<OwnerPersonalScheduleEditPage />}
          />
          <Route
            path="/my-page/owner/schedules/shared"
            element={<OwnerSharedScheduleCreatePage />}
          />
          <Route path="/my-page/owner/coupons" element={<CouponListPage />} />
          <Route
            path="/my-page/owner/coupons/register"
            element={<CouponRegisterPage />}
          />
          <Route
            path="/my-page/owner/coupons/edit"
            element={<CouponEditPage />}
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
          <Route
            path="/my-page/owner/payments/cancel"
            element={<CancelListPage />}
          />
          <Route
            path="/my-page/owner/payments/cancel/detail"
            element={<CancelDetailPage />}
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
