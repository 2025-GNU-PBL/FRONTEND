import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";

const MobileView = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const menuItems = [
    { icon: "solar:home-2-linear", path: "/", label: "홈" },
    { icon: "solar:heart-linear", path: "/cart", label: "찜" },
    { icon: "iconamoon:search-light", path: "/search", label: "검색" },
    { icon: "solar:chat-square-outline", path: "/chat", label: "채팅" },
    {
      icon: "solar:user-rounded-linear",
      path: "/my-page",
      label: "마이페이지",
    },
  ];

  const handleNav = (to: string) => {
    if (pathname === to) {
      // 같은 경로면 라우팅 변화가 없으니 직접 스크롤만 올림
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // 다른 경로면 이동 + (전역 ScrollToTop이 최상단으로 올림)
      navigate(to);
    }
  };

  return (
    <div className="block md:hidden fixed bottom-0 left-0 w-full h-[56px] bg-white border-t border-gray-300 shadow-inner z-30">
      <nav className="flex justify-between max-w-md mx-auto py-2 px-6 h-full">
        {menuItems.map(({ icon, path, label }) => (
          <button
            key={label}
            onClick={() => handleNav(path)}
            className="flex flex-col items-center justify-center text-gray-700 hover:text-[#FF2233] active:scale-95 transition"
          >
            <Icon icon={icon} className="w-6 h-6 mb-1" />
          </button>
        ))}
      </nav>
    </div>
  );
};

export default MobileView;
