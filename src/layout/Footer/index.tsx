import { Icon } from "@iconify/react";
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-700 border-t border-gray-300 py-12 font-sans">
      {/* Mobile */}
      <div className="block lg:hidden fixed bottom-0 left-0 w-full h-[56px] bg-white border-t border-gray-300 shadow-inner z-50">
        <nav className="flex justify-between max-w-md mx-auto py-2 px-6 h-full">
          <button className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-500">
            <Icon icon="solar:home-2-linear" className="w-6 h-6 mb-1" />
          </button>
          <button className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-500">
            <Icon icon="solar:heart-linear" className="w-6 h-6 mb-1" />
          </button>
          <button className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-500">
            <Icon icon="iconamoon:search-light" className="w-6 h-6 mb-1" />
          </button>
          <button className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-500">
            <Icon icon="solar:chat-square-outline" className="w-6 h-6 mb-1" />
          </button>
          <button className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-500">
            <Icon icon="solar:user-rounded-linear" className="w-6 h-6 mb-1" />
          </button>
        </nav>
      </div>

      {/* Web */}
      <div className="hidden lg:flex flex-col">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-10 text-center md:text-left">
          {/* 회사 정보 */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-gray-900 tracking-wide">
              (주)고스페이스
            </h4>
            <p className="text-sm leading-relaxed">
              대표: 김기범
              <br />
              사업자등록번호: 123-45-67890
              <br />
              주소: 경남 진주시 진주대로 501
            </p>
            <p className="text-sm leading-relaxed">
              고객센터:{" "}
              <a
                href="tel:0212345678"
                className="text-gray-600 hover:text-gray-900 underline"
              >
                02-1234-5678
              </a>
              <br />
              이메일:{" "}
              <a
                href="mailto:contact@sdm.com"
                className="text-gray-600 hover:text-gray-900 underline"
              >
                contact@sdm.com
              </a>
            </p>
          </div>

          {/* 회사 소개 */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4">소개</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  회사 소개
                </a>
              </li>
              <li>
                <a
                  href="/partners"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  파트너십
                </a>
              </li>
              <li>
                <a
                  href="/careers"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  인재 채용
                </a>
              </li>
            </ul>
          </div>

          {/* 서비스 */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              서비스
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/service/wedding-hall"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  웨딩홀
                </a>
              </li>
              <li>
                <a
                  href="/service/studio"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  스튜디오
                </a>
              </li>
              <li>
                <a
                  href="/service/dress"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  드레스
                </a>
              </li>
              <li>
                <a
                  href="/service/makeup"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  메이크업
                </a>
              </li>
            </ul>
          </div>

          {/* 소셜 미디어 */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              팔로우
            </h4>
            <div className="flex justify-center md:justify-start space-x-6 text-xl text-gray-600">
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 transition"
              >
                <FaInstagram />
              </a>
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 transition"
              >
                <FaFacebook />
              </a>
              <a
                href="https://youtube.com"
                aria-label="Youtube"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 transition"
              >
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto text-center text-gray-500 text-xs mt-10 select-none font-light tracking-wider">
          © {new Date().getFullYear()} (주)스드메컴퍼니. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
