import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import MainPage from "./pages/MainPage";
import StudioPage from "./pages/StudioPage";
import DressPage from "./pages/DressPage";
import MakeupPage from "./pages/MakeupPage";
import SearchPage from "./pages/SearchPage";
import LoginPage from "./pages/LoginPage/SelectRolePage";
import SignupPage from "./pages/SignupPage";
import QuotationPage from "./pages/QuotationPage";
import SchedulingPage from "./pages/SchedulingPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginClientPage from "./pages/LoginPage/ClientLoginPage";
import LoginOwnerPage from "./pages/LoginPage/OwnerLoginPage";
import KakaoCallback from "./pages/LoginPage/callbacks/KakaoCallback";
import NaverCallback from "./pages/LoginPage/callbacks/NaverCallback";

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
        <Route path="/main" element={<MainPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/dress" element={<DressPage />} />
        <Route path="/makeup" element={<MakeupPage />} />
        <Route path="/quotation" element={<QuotationPage />} />
        <Route path="/scheduling" element={<SchedulingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/log-in" element={<LoginPage />} />
        <Route path="/log-in/client" element={<LoginClientPage />} />
        <Route path="/log-in/owner" element={<LoginOwnerPage />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        <Route path="/auth/naver/callback" element={<NaverCallback />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route path="/users/:id/home" element={<SignupPage />} />
      </Route>
    </Routes>
  );
};

export default App;
