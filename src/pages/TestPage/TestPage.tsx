import React from "react";

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen flex justify-center bg-[#F5F5F5]">
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col">
        {/* 헤더 */}
        <header className="relative flex h-[60px] items-center justify-between px-5">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center"
          >
            <div className="w-8 h-8 bg-black rounded-full opacity-20" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 text-center text-[18px] font-semibold text-[#1E2124]">
            쿠폰함
          </div>

          <div className="h-6 w-6" />
        </header>

        {/* 메인 */}
        <main className="flex-1 px-5 pt-5 pb-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            {/* 이미지 */}
            <div className="w-20 h-20 opacity-50">
              <img
                src="/images/coupon.png"
                alt="쿠폰 없음"
                className="w-full h-full object-contain"
              />
            </div>

            {/* 텍스트 */}
            <p className="text-[18px] font-semibold text-[#333333] text-center">
              보유중인 쿠폰이 없어요
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TestPage;
