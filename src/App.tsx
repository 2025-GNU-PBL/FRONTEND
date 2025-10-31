import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import MainPage from "./pages/MainPage/MainPage";
import StudioPage from "./pages/StudioPage/StudioPage";
import DressPage from "./pages/DressPage/DressPage";
import MakeupPage from "./pages/MakeupPage/MakeupPage";
import SearchPage from "./pages/SearchPage/SearchPage";
import SelectRolePage from "./pages/LoginPage/SelectRolePage";
import QuotationPage from "./pages/QuotationPage/QuotationPage";
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
import ScrollToTop from "./components/ScrollToTop";
import ClientMyPageMain from "./pages/MyPage/ClientMyPage/Main/ClientMyPageMain";
import ClientProfilePage from "./pages/MyPage/ClientMyPage/Profile/ClientProfilePage";
import SignUpPage from "./pages/SignupPage/SignupPage";
import ClientCouponPage from "./pages/MyPage/ClientMyPage/Coupons/ClientCouponPage";

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
        <Route path="/quotation" element={<QuotationPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/my-page/client/main" element={<ClientMyPageMain />} />
        <Route path="/my-page/client/profile" element={<ClientProfilePage />} />
        <Route path="/my-page/client/coupons" element={<ClientCouponPage />} />
        <Route path="/log-in" element={<SelectRolePage />} />
        <Route path="/log-in/client" element={<ClientLoginPage />} />
        <Route path="/log-in/owner" element={<OwnerLoginPage />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        <Route path="/auth/naver/callback" element={<NaverCallback />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/users/:id/home" element={<SignUpPage />} />
      </Route>
    </Routes>
  );
};

export default App;
