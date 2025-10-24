import { useState } from "react";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { PiShoppingCartBold } from "react-icons/pi";

const menuItems = [
  { name: "스튜디오", path: "/studio" },
  { name: "드레스", path: "/dress" },
  { name: "메이크업", path: "/makeup" },
  { name: "견적", path: "/quotation" },
  { name: "일정관리", path: "/scheduling" },
];

const Navbar = () => {
  const [showMyPage, setShowMyPage] = useState(false);

  return (
    <nav className="hidden md:flex fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 items-center justify-between px-8 z-50 drop-shadow-sm">
      {/* Logo */}
      <div className="font-allimjang font-bold text-xl text-pink-600 tracking-widest cursor-pointer">
        <Link to="/">웨딩PICK</Link>
      </div>

      {/* Menu Items */}
      <div className="flex space-x-6">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="text-gray-700 hover:text-pink-600 transition-all font-semibold"
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Icons + Login Buttons */}
      <div className="flex space-x-4 items-center">
        {/* Search Icon */}
        <Link to="/search" className="hover:text-pink-600">
          <FaSearch size={20} />
        </Link>

        {/* MyPage Icon */}
        <button
          onClick={() => setShowMyPage(!showMyPage)}
          className="hover:text-pink-600"
        >
          <FaUserCircle size={24} />
        </button>

        <PiShoppingCartBold size={24} />
      </div>
    </nav>
  );
};

export default Navbar;
