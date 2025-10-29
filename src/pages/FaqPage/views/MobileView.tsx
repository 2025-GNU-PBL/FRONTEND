import { useState } from "react";
import { Icon } from "@iconify/react";

const MobileView = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "웨딩홀 예약은 어떻게 하나요?",
      a: "웨딩홀 상세 페이지에서 원하시는 날짜와 조건을 선택 후, 예약 신청 버튼을 눌러 진행할 수 있습니다.",
    },
    {
      q: "스튜디오, 드레스, 메이크업은 함께 예약이 가능한가요?",
      a: "네! 스드메 패키지로 묶어서 예약할 수 있으며, 개별 예약도 가능합니다.",
    },
    {
      q: "예약 취소 시 환불 규정은 어떻게 되나요?",
      a: "각 업체별 취소 정책에 따라 다르며, 예약 페이지에서 상세 규정을 확인하실 수 있습니다.",
    },
    {
      q: "회원가입 없이 견적을 볼 수 있나요?",
      a: "간단한 조건 입력만으로 비회원 견적 조회가 가능합니다. 단, 예약 진행은 회원만 가능합니다.",
    },
    {
      q: "고객센터 운영시간이 어떻게 되나요?",
      a: "평일 오전 10시부터 오후 6시까지 운영됩니다. (주말 및 공휴일 휴무)",
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col text-black/80">
      {/* 헤더 */}
      <header className="flex justify-between items-center m-5">
        <h1 className="font-allimjang text-[#FF2233] text-2xl font-bold">
          웨딩PICK
        </h1>
      </header>

      {/* 바디 */}
      <main className="flex-1 px-5 pb-28">
        <div className="text-[20px] font-semibold mb-5">
          <span className="text-[#FF2233]">FAQ</span>
          <span className="ml-1 text-black/70"> 자주 묻는 질문</span>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-[12px] overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center px-4 py-3 text-left text-[15px] font-medium text-[#333333] hover:bg-[#F9F9F9] transition"
                onClick={() => toggle(idx)}
              >
                <span>{item.q}</span>
                <Icon
                  icon={
                    openIndex === idx
                      ? "solar:alt-arrow-up-linear"
                      : "solar:alt-arrow-down-linear"
                  }
                  className="w-5 h-5 text-gray-500"
                />
              </button>

              {openIndex === idx && (
                <div className="px-4 py-3 text-sm text-[#595F63] bg-[#FAFAFA] border-t border-gray-100 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 문의 CTA */}
        <div className="mt-10 rounded-[12px] bg-[#F3F4F5] p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Icon
              icon="solar:chat-square-outline"
              className="w-6 h-6 text-[#FF2233] mr-2"
            />
            <div>
              <p className="text-sm text-black font-medium">
                해결되지 않은 문의가 있으신가요?
              </p>
              <p className="text-xs text-[#666666]">고객센터로 문의하세요</p>
            </div>
          </div>
          <button className="text-white bg-[#FF2233] px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-[#e61e2d] transition">
            문의하기
          </button>
        </div>
      </main>
    </div>
  );
};

export default MobileView;
