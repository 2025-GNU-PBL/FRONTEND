import { useState } from "react";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";
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
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-50 drop-shadow-sm">
      {/* Logo */}
      <div className="font-bold text-xl text-pink-600 tracking-widest cursor-pointer">
        <Link to="/">연(緣)</Link>
      </div>

      {/* Menu Items */}
      <div className="hidden lg:flex space-x-6">
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

        {/* mobile menu */}
        <button
          className="flex lg:hidden text-2xl rounded-lg hover:bg-blue-100 transition"
          onClick={toggleMenu}
          aria-label="모바일 메뉴"
        >
          {isOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      <div
        className={`fixed top-16 left-0 w-full overflow-hidden bg-white text-[#36454F] transition-all duration-300 ease-in-out z-20 ${
          isOpen ? "max-h-96" : "max-h-0"
        } lg:hidden`}
      >
        <div className="p-4">
          <ul className="space-y-4 text-lg font-semibold text-center">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-pink-600"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
