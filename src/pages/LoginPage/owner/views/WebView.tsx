import { Link } from "react-router-dom";
import KakaoLoginButton from "../../../../components/social/kakaoLoginButton";
import NaverLoginButton from "../../../../components/social/NaverLoginButton";

const WebView = () => {
  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col justify-center">
      {/* ✅ md 구간에서는 1열, lg 이상에서만 2열 */}
      <main className="mx-auto max-w-6xl w-full px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: Hero / Marketing for OWNER */}
        <section className="flex flex-col justify-center order-1 lg:order-none">
          <span className="inline-block rounded-full bg-[#FF2233]/10 text-[#FF2233] text-xs font-semibold px-2 py-1 mb-3 w-fit">
            사장님 전용
          </span>
          <h1 className="font-allimjang text-[48px] md:text-[54px] lg:text-[60px] leading-[1.05] text-[#FF2233] mb-4 text-center lg:text-left">
            웨딩PICK 파트너
          </h1>

          {/* ✅ p/div 구조 수정 (p 안에 div 넣지 않기) 및 반응형 정렬 */}
          <div className="font-pretendard text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 space-y-1 text-center lg:text-left">
            <p>예약·홍보·리뷰 관리를 한 곳에서.</p>
            <div>
              <span className="font-semibold text-gray-900">노쇼 감소</span>와{" "}
              <span className="font-semibold text-gray-900">상담 전환율↑</span>
              을 경험하세요.
            </div>
          </div>

          {/* ✅ 모바일에서는 세부항목 가운데 정렬, lg에서 도트 표시/가로 배치 */}
          <ul className="space-y-3 text-gray-700 text-center lg:text-left">
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF2233]" />
              <span>간편한 캘린더로 스케줄 충돌 없이 예약 관리</span>
            </li>
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF2233]" />
              <span>리뷰/후기 기반 노출 최적화로 신규 고객 유입</span>
            </li>
            <li className="flex flex-col lg:flex-row lg:items-start lg:gap-3 justify-center lg:justify-start">
              <span className="hidden lg:block mt-1 h-2 w-2 rounded-full bg-[#FF2233]" />
              <span>팀원이 함께 쓰는 권한·지점 관리</span>
            </li>
          </ul>

          <div className="mt-10 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-3 text-sm text-gray-500">
            <div className="flex -space-x-2">
              <img
                src="https://cdn.imweb.me/thumbnail/20251013/08398c9a772ba.png"
                alt=""
                className="h-8 w-8 rounded-full border border-white"
              />
              <img
                src="https://newsprime.co.kr/data/photos/cdn/20250625/art_693119_1750298922.png"
                alt=""
                className="h-8 w-8 rounded-full border border-white"
              />
              <img
                src="https://img.freepik.com/free-vector/universal-logo-geometric-abstract-shape-design-template_126523-489.jpg?semt=ais_hybrid&w=740&q=80"
                alt=""
                className="h-8 w-8 rounded-full border border-white"
              />
            </div>
            <span>수천 개 파트너사가 신뢰합니다</span>
          </div>
        </section>

        {/* Right: Auth Card */}
        {/* ✅ md~lg 사이에서는 아래(두 번째)로 내려오고, lg 이상에서 우측 정렬 */}
        <section className="flex justify-center lg:justify-end order-2 lg:order-none">
          <div className="relative w-full max-w-[440px]">
            {/* subtle offset layer */}
            <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-3xl bg-white" />
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="font-pretendard text-2xl font-semibold mb-2 text-center lg:text-left">
                사장님 로그인
              </h2>
              <p className="text-sm text-gray-500 mb-8 text-center lg:text-left">
                소셜 계정으로 빠르게 시작하세요.
              </p>

              {/* Social Login (as-is) */}
              <div className="space-y-3 mb-2">
                <div className="w-full h-[56px]">
                  <KakaoLoginButton role="OWNER" />
                </div>
                <div className="w-full h-[56px]">
                  <NaverLoginButton role="OWNER" />
                </div>
              </div>

              <div className="relative my-6">
                <div className="border-t" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-gray-500">
                  안내
                </span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed text-center lg:text-left">
                웨딩픽 파트너 계정이 없다면 가입 과정에서 자동으로 생성됩니다.
                로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
              </p>

              {/* 보조 링크 */}
              <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                <Link to="/log-in/client" className="hover:text-[#FF2233]">
                  고객으로 로그인
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
