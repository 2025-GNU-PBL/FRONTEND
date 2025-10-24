import { Link } from "react-router-dom";

const LoginClientPage = () => {
  return (
    <div>
      {/* mobile */}
      <div className="min-h-screen flex flex-col items-center bg-[#ff6566] px-4 md:hidden">
        {/* 로고 */}
        <div className="flex flex-col mb-[400px] mt-[130px] items-start text-white -ml-15">
          <h2 className="font-bold text-[28px] -mb-2">스드메, 한 번에</h2>
          <h2 className="font-bold text-[28px] mb-3">비교하고 예약하세요</h2>
          <h3>비교·예약·상담까지 웨딩픽으로 간편하게</h3>
        </div>

        {/* 로그인 버튼들 */}
        <div className="w-full max-w-xs space-y-4">
          <Link
            to="/log-in/client"
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-[50px] bg-[#FEE500] text-[#4a4a4a] font-semibold"
          >
            <img src="/images/kakao.png" alt="Sample" className="h-[24px]" />
            <span className="font-semibold">카카오톡으로 시작하기</span>
          </Link>

          <Link
            to="/log-in/owner"
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-[50px] text-white font-semibold bg-[#03C75A]"
          >
            <img src="/images/naver.png" alt="Sample" className="h-[24px]" />
            &nbsp; 네이버로 시작하기
          </Link>
        </div>
      </div>

      {/* web */}
      <div></div>
    </div>
  );
};

export default LoginClientPage;
