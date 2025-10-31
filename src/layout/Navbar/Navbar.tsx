import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const menuItems = [
  { name: "웨딩홀", path: "/wedding" },
  { name: "스튜디오", path: "/studio" },
  { name: "메이크업", path: "/makeup" },
  { name: "드레스", path: "/dress" },
  { name: "캘린더", path: "/calendar" },
];

const Navbar = () => {
  return (
    // 데스크톱 전용 네비게이션
    <nav className="fixed top-0 left-0 hidden w-full md:flex z-50 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto flex w-full max-w-6xl h-[64px] items-center justify-between px-6">
        {/* ⭐️ 로고 */}
        <div className="flex items-center gap-2 cursor-pointer">
          <Link
            to="/"
            className="font-allimjang font-bold text-2xl text-[#FF2233] tracking-wider hover:opacity-90 transition"
          >
            웨딩PICK
          </Link>
          <span className="rounded-full bg-[#FF2233]/10 text-[#FF2233] text-xs px-2 py-0.5 hidden lg:inline-block">
            1만 신부님의 선택
          </span>
        </div>

        {/* 메뉴 아이템 */}
        <div className="flex space-x-8">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-[15px] font-medium text-gray-700 hover:text-[#FF2233] transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* 오른쪽 아이콘 */}
        <div className="flex space-x-5 items-center">
          {/* 🔍 검색 */}
          <Link
            to="/search"
            aria-label="검색"
            className="p-1 text-gray-700 hover:text-[#FF2233] transition-colors"
          >
            <Icon icon="iconamoon:search-light" className="h-6 w-6" />
          </Link>

          {/* ❤️ 찜하기 */}
          <Link
            to="/cart"
            aria-label="찜 목록"
            className="p-1 text-gray-700 hover:text-[#FF2233] transition-colors"
          >
            <Icon icon="solar:heart-linear" className="h-6 w-6" />
          </Link>

          {/* 👤 마이페이지 */}
          <Link
            to="/my-page"
            aria-label="마이페이지"
            className="p-1 text-gray-700 hover:text-[#FF2233] transition-colors"
          >
            <Icon icon="solar:user-circle-bold" className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
