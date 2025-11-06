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
import ClientCouponPage from "./pages/MyPage/ClientMyPage/Coupons/ClientCouponPage";
import MainPage from "./pages/MainPage/MainPage";
import StudioPage from "./pages/StudioPage/StudioPage";
import MakeupPage from "./pages/MakeupPage/MakeupPage";
import SearchPage from "./pages/SearchPage/SearchPage";
import SignUpPage from "./pages/SignupPage/SignupPage";
import ProtectedRoutes from "./components/ProtectedRoutes";
import NotAuthRoutes from "./components/NotAuthRoutes";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import LoginPage from "./pages/LoginPage/RoleSelection/SelectRolePage";
import Navbar from "./layout/Navbar/Navbar";
import Footer from "./layout/Footer/Footer";
import FavoritesPage from "./pages/FavoritesPage/FavoritesPage";
import DressPage from "./pages/DressPage/DressPage";
import QuotationPage from "./pages/QuotationPage/QuotationPage";
import CalendarPage from "./pages/CalendarPage/CalendarPage";
import { useEffect } from "react";
import { authUser } from "./store/thunkFunctions";

function Layout() {
  const location = useLocation();
  const isChatDetail = !!useMatch("/chat/:id");

  // 네비바 숨길 경로
  const hideNavOnPaths = [
    "/log-in",
    "/sign-up",
    "/log-in/client",
    "/log-in/owner",
  ];

  // 푸터 숨길 경로 (정적 + 동적)
  const hideFooterOnPaths = ["/log-in", "/log-in/client", "/log-in/owner"];

  const showNavbar = !hideNavOnPaths.includes(location.pathname);
  const showFooter =
    !hideFooterOnPaths.includes(location.pathname) && !isChatDetail;

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
      {showFooter && <Footer />}
    </div>
  );
}

const App = () => {
  const dispatch = useAppDispatch();

  const { isAuth } = useAppSelector((state) => state.user);
  const rehydrated = useAppSelector((state) => state._persist?.rehydrated);

  // ✅ 앱이 복원되고 로그인된 상태라면, 유저 프로필 동기화
  useEffect(() => {
    if (rehydrated && isAuth) {
      dispatch(authUser());
    }
  }, [rehydrated, isAuth, dispatch]);

  // 리덕스 퍼시스트가 완료될 때까지만 기다림 (깜빡임 방지)
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

        {/* 로그인한 사람만 접근 가능 */}
        <Route element={<ProtectedRoutes isAuth={isAuth} />}>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/my-page" element={<ClientMyPageMain />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
        </Route>

        {/* 로그인한 사람은 접근 불가 */}
        <Route element={<NotAuthRoutes isAuth={isAuth} />}>
          <Route path="/log-in" element={<LoginPage />} />
          <Route path="/log-in/client" element={<ClientLoginPage />} />
          <Route path="/log-in/owner" element={<OwnerLoginPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/auth/naver/callback" element={<NaverCallback />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/users/:id/home" element={<SignUpPage />} />
        </Route>

        {/* 기타 중복 경로 제거 */}
        <Route path="/my-page/client/main" element={<ClientMyPageMain />} />
        <Route path="/my-page/client/profile" element={<ClientProfilePage />} />
        <Route path="/my-page/client/coupons" element={<ClientCouponPage />} />
      </Route>
    </Routes>
  );
};

export default App;
