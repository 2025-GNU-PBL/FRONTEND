import { Link } from "react-router-dom";

const WebView = () => {
  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col justify-center">
      {/* ✅ md 구간에서는 1열, lg 이상에서만 2열 */}
      <main className="mx-auto max-w-6xl w-full px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: Hero / Marketing */}
        <section className="flex flex-col justify-center order-1 lg:order-none">
          <Link to="/" className="text-center lg:text-left">
            <h1 className="font-allimjang text-[48px] md:text-[54px] lg:text-[60px] leading-[1.05] text-[#FF2233] mb-4">
              웨딩PICK
            </h1>
          </Link>

          <div className="font-pretendard text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 space-y-1 text-center lg:text-left">
            <p>
              1만 신부님의 선택, 실시간으로 비교하고{" "}
              <span className="font-semibold text-gray-900">딱 맞는 업체</span>
              를 고르세요.
            </p>
          </div>

          {/* ✅ 모바일에서는 중앙정렬, lg 이상에서는 좌측정렬 */}
          <ul className="space-y-3 text-gray-700 text-center lg:text-left">
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF2233]" />
              <span>검증된 후기와 투명한 가격으로 합리적인 선택</span>
            </li>
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF2233]" />
              <span>맞춤 추천으로 상담 시간 절약</span>
            </li>
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF2233]" />
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
        {/* ✅ md~lg 사이에서는 아래쪽, lg 이상에서는 오른쪽 정렬 */}
        <section className="flex justify-center lg:justify-end order-2 lg:order-none">
          <div className="relative w-full max-w-[440px]">
            {/* subtle offset layer */}
            <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-3xl bg-white" />
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="font-pretendard text-2xl font-semibold mb-2 text-center lg:text-left">
                로그인
              </h2>
              <p className="text-sm text-gray-500 mb-8 text-center lg:text-left">
                계정 유형을 선택하세요.
              </p>

              {/* 고객 로그인 */}
              <div className="space-y-3">
                <Link
                  to="/log-in/client"
                  className="block w-full text-center rounded-xl bg-[#FF2233] px-4 py-3 font-semibold text-white hover:opacity-95 active:opacity-90 transition"
                >
                  고객 로그인
                </Link>
              </div>

              <div className="relative my-6">
                <div className="border-t" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-gray-500">
                  또는
                </span>
              </div>

              {/* 사장님 로그인 */}
              <div className="space-y-3">
                <Link
                  to="/log-in/owner"
                  className="block w-full text-center rounded-xl border border-[#FF2233] px-4 py-3 font-semibold text-[#FF2233] hover:bg-[#FF2233]/5 transition"
                >
                  사장님 로그인
                </Link>
              </div>
            </div>

            {/* 작은 캡션 */}
            <p className="mt-4 text-xs text-gray-500 text-center lg:text-left">
              로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
            </p>
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
            <a href="#" className="hover:text-[#FF2233]">
              이용약관
            </a>
            <a href="#" className="hover:text-[#FF2233]">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-[#FF2233]">
              고객센터
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebView;
