import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";

export default function MobileView() {
  const [phone, setPhone] = useState("");
  const nav = useNavigate();

  // 🔥 전화번호 자동 하이픈 적용
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const onlyNum = e.target.value.replace(/\D/g, "");

    if (onlyNum.length <= 3) {
      setPhone(onlyNum);
    } else if (onlyNum.length <= 7) {
      setPhone(`${onlyNum.slice(0, 3)}-${onlyNum.slice(3)}`);
    } else {
      setPhone(
        `${onlyNum.slice(0, 3)}-${onlyNum.slice(3, 7)}-${onlyNum.slice(7, 11)}`
      );
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (!phone) return;
    nav("/sign-up/client/step2", {
      state: { phone },
    });
  };

  return (
    <div className="w-full bg-white">
      {/* 바깥 프레임 */}
      <div className="w-full min-h-screen bg-[#F6F7FB] flex flex-col">
        {/* 안쪽 실제 화면 영역 */}
        <div className="flex flex-col flex-1 bg-white w-full">
          {/* 헤더 */}
          <MyPageHeader title="" onBack={() => nav(-1)} showMenu={false} />

          {/* 본문 */}
          <div className="flex-1 flex flex-col px-5 pt-[84px] w-full">
            {/* Step Progress */}
            <div className="text-[14px] text-[#1E2124]">
              <span>1 /</span>
              &nbsp;
              <span className="text-[#999999]">3</span>
            </div>

            {/* Title */}
            <div className="mt-4 w-full text-[24px] font-bold text-[#1E2124] leading-[36px]">
              전화번호를
              <br />
              입력해 주세요
            </div>

            {/* Label */}
            <div className="mt-8 text-[12px] text-[#666666]">전화번호</div>

            {/* Input */}
            <div className="mt-2 w-full h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-4 bg-white">
              <input
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full text-[14px] text-[#1E2124] placeholder:text-[#9D9D9D] focus:outline-none"
              />
            </div>

            {/* 아래 여백 채우기용 */}
            <div className="mt-auto" />
          </div>

          {/* 하단 버튼 영역 */}
          <div className="px-5 pb-5 w-full">
            <button
              type="button"
              onClick={handleNext}
              disabled={!phone}
              className={`w-full h-[56px] rounded-[12px] font-semibold text-[16px] text-white transition
                ${phone ? "bg-[#FF0000]" : "bg-[#D9D9D9] cursor-not-allowed"}`}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
