import React from "react";

const LoginOwnerPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4">
      {/* 로그인 버튼들 */}
      <div className="w-full max-w-xs space-y-4">
        {/* 네이버 로그인 */}
        <button className="w-full flex items-center justify-center space-x-3 py-3 bg-[#03C75A] hover:bg-[#02a84a] rounded-md text-white font-semibold shadow-md transition">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/2/23/Naver_Logotype.svg"
            alt="Naver Logo"
            className="h-6 w-auto"
          />
          <span>네이버로 로그인</span>
        </button>

        {/* 카카오 로그인 */}
        <button className="w-full flex items-center justify-center space-x-3 py-3 bg-[#FAE100] hover:bg-[#e5d400] rounded-md text-gray-900 font-semibold shadow-md transition">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/09/KakaoTalk_logo.svg"
            alt="Kakao Logo"
            className="h-6 w-auto"
          />
          <span>카카오로 로그인</span>
        </button>
      </div>
    </div>
  );
};

export default LoginOwnerPage;
