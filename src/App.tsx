import { Outlet, Route, Routes, useLocation } from "react-router-dom";
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
import SignUpPage from "./pages/SignupPage/step1/SignupPage";
import ClientCouponPage from "./pages/MyPage/ClientMyPage/Coupons/ClientCouponPage";
import Navbar from "./layout/Navbar/Navbar";
import Footer from "./layout/Footer/Footer";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { useEffect } from "react";
import { authUser } from "./store/thunkFunctions";
import MainPage from "./pages/MainPage/MainPage";
import StudioPage from "./pages/StudioPage/StudioPage";
import MakeupPage from "./pages/MakeupPage/MakeupPage";
import SearchPage from "./pages/SearchPage/SearchPage";
import DressPage from "./pages/DressPage/DressPage";
import SelectRolePage from "./pages/LoginPage/RoleSelection/SelectRolePage";
import JoinAddressPage from "./pages/SignupPage/step2/JoinAddressPage";
import WeddingInfoPage from "./pages/SignupPage/step3/WeddingInfoPage";
import SignupCompletePage from "./pages/SignupPage/step4/SignupCompletePage";

function Layout() {
  const location = useLocation();
  const hideNavOnPaths = [
    "/log-in",
    "/sign-up/step1",
    "/log-in/client",
    "/log-in/owner",
  ];
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

  // persist rehydration 여부와 isAuth
  const isAuth = useAppSelector((s) => s.user.isAuth);
  const rehydrated = useAppSelector((s: any) => s._persist?.rehydrated);

  useEffect(() => {
    // 앱(또는 라우트) 진입 시: 토큰이 있고 아직 isAuth가 아니면 서버와 동기화
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
        <Route path="/sign-up/step1" element={<SignUpPage />} />
        <Route path="/sign-up/step2" element={<JoinAddressPage />} />
        <Route path="/sign-up/step3" element={<WeddingInfoPage />} />
        <Route path="/sign-up/step4" element={<SignupCompletePage />} />
        <Route path="/users/:id/home" element={<SignUpPage />} />
      </Route>
    </Routes>
  );
};

export default App;
