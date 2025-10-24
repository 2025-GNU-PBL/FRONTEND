import { Link } from "react-router-dom";

const LoginClientPage = () => {
  return (
    <div>
      {/* mobile */}
      <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4 md:hidden">
        {/* 로고 */}
        <div className="flex flex-col mb-[430px] mt-[130px] items-center font-semibold">
          <h2>스드메, 한 번에</h2>
          <h2>비교하고 예약하세요</h2>
          <h3>비교·예약·상담까지 웨딩픽으로 간편하게</h3>
        </div>

        {/* 로그인 버튼들 */}
        <div className="w-full max-w-xs space-y-4">
          <Link
            to="/log-in/client"
            className="w-full flex items-center justify-center space-x-3 py-3 rounded-[50px] bg-[#FF2233] text-white font-semibold"
          >
            고객 로그인
          </Link>

          <Link
            to="/log-in/owner"
            className="w-full flex items-center justify-center space-x-3 py-3 rounded-[50px] border border-[#FF2233] text-[#FF2233] font-semibold bg-white"
          >
            사장님 로그인
          </Link>
        </div>
      </div>

      {/* web */}
      <div></div>
    </div>
  );
};

export default LoginClientPage;
