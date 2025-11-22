import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
};

const stagger = (delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: {
      delay,
      staggerChildren: 0.06,
      when: "beforeChildren",
    },
  },
});

type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

const FAQ_LIST: FaqItem[] = [
  {
    id: 1,
    question: "스드메 상담은 어떻게 신청하나요?",
    answer:
      "메인에서 원하는 카테고리를 선택한 뒤, 상세 페이지 하단의 ‘상담 신청’ 버튼을 눌러주시면 됩니다. 신청 후 담당 매니저가 순차적으로 연락드립니다.",
  },
  {
    id: 2,
    question: "예약 일정 변경/취소가 가능한가요?",
    answer:
      "마이페이지 > 예약 내역에서 변경/취소 요청이 가능하며, 업체별 정책에 따라 위약금 및 변경 가능일이 달라질 수 있습니다.",
  },
  {
    id: 3,
    question: "전화로도 상담을 받을 수 있나요?",
    answer:
      "네, 고객센터 대표번호(02-000-0000)로 전화 주시거나 ‘전화 상담 예약’ 버튼을 통해 콜백을 신청하실 수 있습니다.",
  },
];

export default function MobileView() {
  const navigate = useNavigate();
  const [activeFaqId, setActiveFaqId] = useState<number | null>(1);

  const handleToggleFaq = (id: number) => {
    setActiveFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <motion.div
      className="flex min-h-screen flex-col bg-white text-[15px] text-black/80 mb-10"
      variants={stagger()}
      initial="hidden"
      animate="show"
    >
      {/* 헤더 */}
      <motion.header
        className="flex items-center justify-between px-5 pt-4 pb-3"
        variants={fadeUp}
      >
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F5] active:scale-95"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
        >
          <Icon
            icon="solar:alt-arrow-left-linear"
            className="h-5 w-5 text-black/80"
          />
        </button>
        <h1 className="font-allimjang text-xl font-bold text-[#FF2233]">
          웨딩PICK
        </h1>
        <div className="h-9 w-9" /> {/* 균형용 빈 박스 */}
      </motion.header>

      {/* 상단 히어로 / 콜센터 카드 */}
      <motion.section className="px-5" variants={fadeUp}>
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFE4E6] via-[#FFF7F2] to-[#F3ECFF] p-5 shadow-[0_10px_25px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium text-[#FF4B5C]">고객센터</p>
              <h2 className="mt-1 text-[20px] font-bold leading-snug text-black/90">
                궁금한 점이 있으신가요?
                <br />
                <span className="text-[#FF2233]">웨딩PICK</span>이 함께
                도와드릴게요
              </h2>
              <p className="mt-2 text-[12px] text-black/60">
                채팅, 카카오톡, 전화 예약 중 편한 방법으로
                <br />
                빠르게 문의를 남겨보세요.
              </p>
            </div>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80">
              <Icon
                icon="solar:lifebuoy-bold-duotone"
                className="h-7 w-7 text-[#FF4B5C]"
              />
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF2233] text-[10px] font-semibold text-white">
                24h
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
            <button className="flex flex-col items-center rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm transition active:scale-[0.97]">
              <Icon
                icon="solar:chat-round-dots-bold"
                className="mb-1.5 h-5 w-5 text-[#FF2233]"
              />
              <span className="font-semibold text-black/85">1:1 채팅</span>
              <span className="mt-0.5 text-[10px] text-black/50">
                평균 5분 이내
              </span>
            </button>
            <button className="flex flex-col items-center rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm transition active:scale-[0.97]">
              <Icon
                icon="ri:kakao-talk-fill"
                className="mb-1.5 h-5 w-5 text-[#FEE500]"
              />
              <span className="font-semibold text-black/85">카카오톡</span>
              <span className="mt-0.5 text-[10px] text-black/50">
                웨딩PICK 채널
              </span>
            </button>
            <button className="flex flex-col items-center rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm transition active:scale-[0.97]">
              <Icon
                icon="solar:phone-bold"
                className="mb-1.5 h-5 w-5 text-[#FF8A65]"
              />
              <span className="font-semibold text-black/85">전화 예약</span>
              <span className="mt-0.5 text-[10px] text-black/50">
                콜백 신청
              </span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-black/60">
            <div>
              <span className="font-medium text-black/80">운영시간</span>
              <span className="ml-1.5">평일 10:00 ~ 18:00</span>
            </div>
            <div>
              <span className="font-medium text-black/80">대표번호</span>
              <span className="ml-1.5">02-000-0000</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FAQ 섹션 */}
      <motion.section className="mt-7 px-5" variants={stagger(0.05)}>
        <motion.div
          className="mb-3 flex items-center justify-between"
          variants={fadeUp}
        >
          <h3 className="text-[17px] font-semibold text-black/90">
            자주 묻는 질문
          </h3>
          <button className="flex items-center text-[12px] text-black/40">
            전체 보기
            <Icon
              icon="solar:alt-arrow-right-linear"
              className="ml-1 h-3.5 w-3.5"
            />
          </button>
        </motion.div>

        <div className="space-y-3">
          {FAQ_LIST.map((item) => {
            const isActive = activeFaqId === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                variants={fadeUp}
                onClick={() => handleToggleFaq(item.id)}
                className="w-full rounded-2xl border border-[#F0F0F0] bg-[#FDFDFD] px-4 py-3 text-left shadow-[0_1px_8px_rgba(15,23,42,0.03)] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-black/85">
                      {item.question}
                    </p>
                    {isActive && (
                      <p className="mt-2 text-[12px] leading-relaxed text-black/65">
                        {item.answer}
                      </p>
                    )}
                  </div>
                  <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F3F4F5] text-black/60">
                    <Icon
                      icon={
                        isActive
                          ? "solar:minus-linear"
                          : "solar:alt-arrow-down-linear"
                      }
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* 1:1 문의 폼 */}
      <motion.section className="mt-8 px-5 pb-10" variants={stagger(0.05)}>
        <motion.h3
          className="mb-3 text-[17px] font-semibold text-black/90"
          variants={fadeUp}
        >
          1:1 문의 남기기
        </motion.h3>

        <motion.div className="rounded-2xl bg-[#F7F7F8] p-4" variants={fadeUp}>
          <div className="space-y-3 text-[13px]">
            <div>
              <label className="mb-1 inline-block text-[12px] font-medium text-black/70">
                이름
              </label>
              <input
                type="text"
                className="h-9 w-full rounded-[10px] border border-[#E2E4E8] bg-white px-3 text-[13px] text-black/80 placeholder:text-[#C0C4CC] focus:border-[#FF2233] focus:outline-none focus:ring-1 focus:ring-[#FF2233]/60"
                placeholder="예: 김신부"
              />
            </div>
            <div>
              <label className="mb-1 inline-block text-[12px] font-medium text-black/70">
                연락처 (또는 이메일)
              </label>
              <input
                type="text"
                className="h-9 w-full rounded-[10px] border border-[#E2E4E8] bg-white px-3 text-[13px] text-black/80 placeholder:text-[#C0C4CC] focus:border-[#FF2233] focus:outline-none focus:ring-1 focus:ring-[#FF2233]/60"
                placeholder="답변을 받으실 연락처를 입력해주세요"
              />
            </div>
            <div>
              <label className="mb-1 inline-block text-[12px] font-medium text-black/70">
                문의 내용
              </label>
              <textarea
                className="h-24 w-full resize-none rounded-[10px] border border-[#E2E4E8] bg-white px-3 py-2 text-[13px] text-black/80 placeholder:text-[#C0C4CC] focus:border-[#FF2233] focus:outline-none focus:ring-1 focus:ring-[#FF2233]/60"
                placeholder="예: 11월 토요일 저녁 예식 가능한 웨딩홀과 스드메 패키지 견적이 궁금합니다."
              />
            </div>
            <div className="flex items-start gap-2 text-[11px] text-black/50">
              <input
                id="agree"
                type="checkbox"
                className="mt-[3px] h-3.5 w-3.5 rounded border-[#D1D5DB] text-[#FF2233] focus:ring-[#FF2233]"
              />
              <label htmlFor="agree">
                문의 접수 및 답변을 위해 이름과 연락처를 수집·이용하는 것에
                동의합니다. (필수)
              </label>
            </div>

            <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-[999px] bg-[#FF2233] py-2.5 text-[13px] font-semibold text-white shadow-md transition active:scale-[0.97]">
              <Icon
                icon="solar:paper-plane-bold-duotone"
                className="h-4.5 w-4.5"
              />
              문의 보내기
            </button>

            <p className="text-[11px] text-black/45">
              영업일 기준 24시간 이내에 입력하신 연락처로
              <br /> 답변을 드리며, 마이페이지 &gt; 문의 내역에서도 확인
              가능합니다.
            </p>
          </div>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
