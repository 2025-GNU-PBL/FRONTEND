import { Outlet, Route, Routes } from "react-router-dom";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import MainPage from "./pages/MainPage";
import StudioPage from "./pages/StudioPage";
import DressPage from "./pages/DressPage";
import MakeupPage from "./pages/MakeupPage";
import SearchPage from "./pages/SearchPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import QuotationPage from "./pages/QuotationPage";
import SchedulingPage from "./pages/SchedulingPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import { FaComments } from "react-icons/fa";

function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleIconClick = () => {
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <ToastContainer
        position="bottom-right"
        theme="light"
        pauseOnHover
        autoClose={1500}
      />

      <Navbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />

      {/* 채팅 아이콘과 채팅창을 조건부로 렌더링 */}
      {!isChatOpen && (
        <button
          onClick={handleIconClick}
          className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg transition-transform transform hover:scale-110 active:scale-95"
          aria-label="Open chat"
        >
          <FaComments className="w-8 h-8" />
        </button>
      )}

      {isChatOpen && (
        <div className="fixed bottom-0 right-0 z-50 w-full md:w-96 h-full md:h-2/3 bg-white rounded-t-xl md:rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out transform">
          {/* 채팅 헤더 */}
          <div className="bg-blue-600 text-white p-4 rounded-t-xl md:rounded-t-lg flex justify-between items-center shadow-md">
            <h3 className="text-lg font-semibold">채팅 상담</h3>
            <button
              onClick={handleChatClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 채팅 내용 영역 */}
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
            <p className="text-gray-500 text-center my-4">
              관리자와 실시간 채팅을 시작해보세요!
            </p>
          </div>

          {/* 채팅 입력 영역 */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                className="flex-grow px-4 py-3 mr-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <button className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<MainPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/dress" element={<DressPage />} />
        <Route path="/makeup" element={<MakeupPage />} />
        <Route path="/quotation" element={<QuotationPage />} />
        <Route path="/scheduling" element={<SchedulingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/log-in" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route path="/users/:id/home" element={<SignupPage />} />
      </Route>
    </Routes>
  );
};

export default App;
