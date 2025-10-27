import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <div>
      {/* mobile */}
      <div
        className="min-h-screen flex flex-col items-center bg-gray-50 px-4 md:hidden"
        style={{
          backgroundImage: "url(/images/login-bg.png)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover", // 화면 전체 덮기
          backgroundPosition: "center", // 중앙 정렬
        }}
      >
        {/* 로고 */}
        <div className="flex flex-col mb-[430px] mt-[130px] items-center font-semibold">
          <h3 className="mb-[8px]">1만 신부님의 선택</h3>
          <h1 className="font-allimjang font-black text-5xl select-none text-[#FF2233]">
            웨딩PICK
          </h1>
        </div>

        {/* 로그인 버튼들 */}
        <div className="w-full max-w-xs space-y-4">
          <Link
            to="/log-in/client"
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-[50px] bg-[#FF2233] text-white font-semibold"
          >
            고객 로그인
          </Link>

          <Link
            to="/log-in/owner"
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-[50px] border border-[#FF2233] text-[#FF2233] font-semibold bg-white"
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

export default LoginPage;
