import { Link } from "react-router-dom";
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import { useAppSelector } from "../../../store/hooks";

const WebView = () => {
  const role = useAppSelector((s) => s.user.role); // ★ OWNER / CUSTOMER 확인

  return (
    <div className="hidden md:flex flex-col py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-15 text-center md:text-left">
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
              <Link
                to="/faq"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                to="/event"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                이벤트
              </Link>
            </li>

            {/* ★ OWNER / CUSTOMER 별 마이페이지 분기 */}
            <li>
              <Link
                to={role === "OWNER" ? "/my-page/owner" : "/my-page/client"}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                마이페이지
              </Link>
            </li>
          </ul>
        </div>

        {/* 서비스 */}
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-4">서비스</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/wedding"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                웨딩홀
              </Link>
            </li>
            <li>
              <Link
                to="/studio"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                스튜디오
              </Link>
            </li>
            <li>
              <Link
                to="/dress"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                드레스
              </Link>
            </li>
            <li>
              <Link
                to="/makeup"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                메이크업
              </Link>
            </li>
          </ul>
        </div>

        {/* 소셜 미디어 */}
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-4">팔로우</h4>
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
        © {new Date().getFullYear()} WeddingPICK. All rights reserved.
      </div>
    </div>
  );
};

export default WebView;
