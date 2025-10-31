import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClientLoginPage from "./pages/LoginPage/client/ClientLoginPage";
import OwnerLoginPage from "./pages/LoginPage/owner/OwnerLoginPage";
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

  // ✅ persist rehydration 여부와 isAuth
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
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/users/:id/home" element={<SignUpPage />} />
      </Route>
    </Routes>
  );
};

export default App;
