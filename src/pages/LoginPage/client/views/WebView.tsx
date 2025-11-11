import { Link } from "react-router-dom";
import KakaoLoginButton from "../../../../components/social/kakaoLoginButton";
import NaverLoginButton from "../../../../components/social/NaverLoginButton";

const WebView = () => {
  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col justify-center">
      <main className="mx-auto max-w-6xl w-full px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: Hero / Marketing */}
        <section className="flex flex-col justify-center order-1 lg:order-none">
          <span className="inline-block rounded-full bg-[#FF4646]/10 text-[#FF4646] text-xs font-semibold px-2 py-1 mb-3 w-fit">
            고객 전용
          </span>
          <h1 className="font-allimjang text-[48px] md:text-[54px] lg:text-[60px] leading-[1.05] text-[#FF4646] mb-4 text-center lg:text-left">
            스드메, 한 번에 비교
          </h1>

          <div className="font-pretendard text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 space-y-1 text-center lg:text-left">
            <p>후기·가격·혜택을 한눈에.</p>
            <div>
              <span className="font-semibold text-gray-900">딱 맞는 업체</span>
              와 바로 상담해 보세요.
            </div>
          </div>

          <ul className="space-y-3 text-gray-700 text-center lg:text-left">
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF4646]" />
              <span>실시간 비교로 합리적인 선택</span>
            </li>
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF4646]" />
              <span>찜·캘린더 연동으로 일정 관리 끝</span>
            </li>
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF4646]" />
              <span>모바일/웹 어디서나 이어서 진행</span>
            </li>
          </ul>

          <div className="mt-10 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-3 text-sm text-gray-500">
            <div className="flex -space-x-2">
              <img
                src="https://images.icon-icons.com/2643/PNG/512/avatar_female_woman_person_people_white_tone_icon_159360.png"
                alt=""
                className="h-8 w-8 rounded-full border border-white"
              />
              <img
                src="https://cdn-icons-png.flaticon.com/512/2810/2810750.png"
                alt=""
                className="h-8 w-8 rounded-full border border-white"
              />
              <img
                src="https://icons.veryicon.com/png/o/miscellaneous/user-avatar/user-avatar-female-9.png"
                alt=""
                className="h-8 w-8 rounded-full border border-white"
              />
            </div>
            <span>10,000+ 신부님이 사용 중</span>
          </div>
        </section>

        {/* Right: Auth Card */}
        <section className="flex justify-center lg:justify-end order-2 lg:order-none">
          <div className="relative w-full max-w-[440px]">
            {/* subtle offset layer */}
            <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-3xl bg-white" />
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="font-pretendard text-2xl font-semibold mb-2 text-center lg:text-left">
                고객 로그인
              </h2>
              <p className="text-sm text-gray-500 mb-8 text-center lg:text-left">
                소셜 계정으로 간편하게 시작하세요.
              </p>

              {/* Social Login */}
              <div className="space-y-3 mb-2">
                <div className="w-full h-[56px]">
                  <KakaoLoginButton role="CUSTOMER" />
                </div>
                <div className="w-full h-[56px]">
                  <NaverLoginButton role="CUSTOMER" />
                </div>
              </div>

              <div className="relative my-6">
                <div className="border-t" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-gray-500">
                  안내
                </span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed text-center lg:text-left">
                처음 로그인하시는 경우 간단한 정보 입력 후 계정이 생성됩니다.
                로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
              </p>

              <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                <Link to="/log-in/owner" className="hover:text-[#FF4646]">
                  사장님으로 로그인
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} WeddingPICK. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#FF4646]">
              이용약관
            </a>
            <a href="#" className="hover:text-[#FF4646]">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-[#FF4646]">
              고객센터
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebView;
