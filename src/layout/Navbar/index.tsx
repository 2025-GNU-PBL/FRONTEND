// Navbar.tsx (전체 폭 상단 고정형 디자인)
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react"; // WebView와의 아이콘 통일을 위해 Iconify 유지

const menuItems = [
  { name: "웨딩홀", path: "/wedding" },
  { name: "스튜디오", path: "/studio" },
  { name: "메이크업", path: "/makeup" },
  { name: "드레스", path: "/dress" },
  { name: "캘린더", path: "/calendar" },
];

const Navbar = () => {
  return (
    // 데스크톱에서만 보이며, z-50으로 최상단 고정
    <nav className="fixed top-0 left-0 hidden w-full md:flex z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex w-full h-16 items-center justify-between px-10">
        {/* ⭐️ 로고 (원래 디자인 복원) */}
        <div className="font-allimjang font-bold text-2xl text-[#FF2233] tracking-widest cursor-pointer">
          <Link to="/">웨딩PICK</Link>
        </div>

        {/* 메뉴 아이템 */}
        <div className="flex space-x-10">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-[15px] font-medium text-black/70 transition-colors hover:text-[#7E57C2]" // 포인트 컬러 유지
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* 아이콘: 찜하기, 마이페이지 (Iconify로 통일) */}
        <div className="flex space-x-6 items-center">
          <Link
            to="/cart"
            aria-label="찜 목록"
            className="p-1 text-black/70 hover:text-[#FF2233] transition-colors"
          >
            <Icon icon="solar:heart-bold" className="h-6 w-6" />
          </Link>

          <Link
            to="/my-page"
            aria-label="마이페이지"
            className="p-1 text-black/70 hover:text-[#7E57C2] transition-colors"
          >
            <Icon icon="solar:user-circle-bold" className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
