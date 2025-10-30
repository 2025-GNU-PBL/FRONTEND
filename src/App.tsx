import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClientLoginPage from "./pages/LoginPage/ClientLoginPage";
import OwnerLoginPage from "./pages/LoginPage/OwnerLoginPage";
import KakaoCallback from "./pages/LoginPage/callbacks/KakaoCallback";
import NaverCallback from "./pages/LoginPage/callbacks/NaverCallback";
import WeddingPage from "./pages/WeddingPage/WeddingPage";
import CalendarPage from "./pages/CalendarPage/CalendarPage";
import FaqPage from "./pages/FaqPage/FaqPage";
import EventPage from "./pages/EventPage/EventPage";
import CartPage from "./pages/CartPage/CartPage";
import ChatPage from "./pages/ChatPage/ChatPage";
import MyPage from "./pages/MyPage/MyPage";
import ScrollToTop from "./components/ScrollToTop";
import MainPage from "./pages/MainPage/MainPage";
import StudioPage from "./pages/StudioPage/StudioPage";
import DressPage from "./pages/DressPage/DressPage";
import MakeupPage from "./pages/MakeupPage/MakeupPage";
import QuotationPage from "./pages/QuotationPage/QuotationPage";
import SearchPage from "./pages/SearchPage/SearchPage";
import LoginPage from "./pages/LoginPage/SelectRolePage";
import SignUpPage from "./pages/SignupPage/SignupPage";
import { useEffect } from "react";
import { authUser } from "./store/thunkFunctions";
import ProtectedRoutes from "./components/ProtectedRoutes";
import NotAuthRoutes from "./components/NotAuthRoutes.";
import { useAppDispatch, useAppSelector } from "./store/hooks";

function Layout() {
  const location = useLocation();
  const hideNavOnPaths = [
    "/log-in",
    "/sign-up",
    "/log-in/client",
    "/log-in/owner",
  ]; // 네비 숨길 페이지 경로 리스트
  const hideFooterOnPaths = ["/log-in", "/log-in/client", "/log-in/owner"];

  const showNavbar = !hideNavOnPaths.includes(location.pathname);
  const showFooter = !hideFooterOnPaths.includes(location.pathname);

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
  const { pathname } = useLocation();

  // ✅ persist rehydration 여부와 isAuth
  const isAuth = useAppSelector((s) => s.user.isAuth);
  const rehydrated = useAppSelector((s: any) => s._persist?.rehydrated);

  useEffect(() => {
    // ✅ 앱(또는 라우트) 진입 시: 토큰이 있고 아직 isAuth가 아니면 서버와 동기화
    const token = localStorage.getItem("accessToken");
    if (rehydrated && token && !isAuth) {
      dispatch(authUser());
    }
  }, [rehydrated, pathname, isAuth, dispatch]);
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

        {/* 로그인한 사람만 갈 수 있는 경로 */}
        <Route element={<ProtectedRoutes isAuth={isAuth} />}>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/my-page" element={<MyPage />} />
        </Route>
        {/* 로그인한 사람은 갈 수 없는 경로 */}
        <Route element={<NotAuthRoutes isAuth={isAuth} />}>
          <Route path="/log-in" element={<LoginPage />} />
          <Route path="/log-in/client" element={<ClientLoginPage />} />
          <Route path="/log-in/owner" element={<OwnerLoginPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/auth/naver/callback" element={<NaverCallback />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/users/:id/home" element={<SignUpPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
