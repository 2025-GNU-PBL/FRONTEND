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

function Layout() {
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
