import { Icon } from "@iconify/react";
import { useState } from "react";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  category: string;
};

const FAQ_LIST: FaqItem[] = [
  {
    id: 1,
    category: "이용 안내",
    question: "스드메 상담은 어떻게 신청할 수 있나요?",
    answer:
      "메인 페이지에서 웨딩홀/스튜디오/드레스/메이크업 중 원하는 카테고리를 선택한 뒤, 상세 페이지에서 ‘상담 신청’ 버튼을 눌러주시면 됩니다. 신청 후 24시간 이내에 담당 매니저가 순차적으로 연락드립니다.",
  },
  {
    id: 2,
    category: "예약/변경",
    question: "예약 일정 변경이나 취소는 어떻게 하나요?",
    answer:
      "마이페이지 > 예약 내역에서 변경/취소 요청이 가능합니다. 각 업체별 정책에 따라 위약금 및 변경 가능 기간이 상이할 수 있으며, 필요 시 고객센터가 중간에서 조율을 도와드립니다.",
  },
  {
    id: 3,
    category: "견적/비용",
    question: "견적은 언제 확정되나요?",
    answer:
      "AI 맞춤 견적과 1차 상담을 통해 기본 금액이 제안되며, 구성 옵션 선택 및 실제 일정 조율 이후 최종 견적이 확정됩니다. 확정된 견적서는 마이페이지에서 PDF로 확인하실 수 있습니다.",
  },
  {
    id: 4,
    category: "기타",
    question: "오프라인 방문 상담도 가능한가요?",
    answer:
      "일부 제휴 업체의 경우 오프라인 방문 상담이 가능합니다. 상담 신청 시 ‘오프라인 상담 희망’을 체크해 주시면, 담당 매니저가 가능한 지점과 일정을 함께 안내드립니다.",
  },
];

export default function WebView() {
  const [activeFaqId, setActiveFaqId] = useState<number | null>(1);

  const handleToggleFaq = (id: number) => {
    setActiveFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[15px] text-black/80">
      {/* 상단 네비 여백 (메인웹과 동일 느낌) */}
      <div className="hidden h-16 md:block" />

      <main className="mx-auto w-full max-w-[1120px] px-6 py-10 lg:py-12">
        {/* 상단 헤더 영역 */}
        <section className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* 타이틀 */}
          <div>
            <div className="inline-flex items-center rounded-full bg-[#F5F2FF] px-3 py-1 text-[12px] font-medium text-[#7B61D1]">
              <Icon
                icon="solar:lifebuoy-bold-duotone"
                className="mr-1.5 h-4 w-4"
              />
              고객센터
            </div>
            <h1 className="mt-4 text-3xl font-bold text-black/90 lg:text-[32px]">
              <span className="mr-1 text-[#FF2233]">2030</span>
              <span className="text-[#FF2233]">신부님</span>
              <span className="mx-1 text-black/80">들의</span>
              <span className="text-black/90">도움이 필요할 땐,</span>
              <br />
              <span className="text-black/90">웨딩PICK 고객센터</span>
            </h1>
            <p className="mt-3 text-sm text-black/55">
              자주 묻는 질문부터 1:1 문의까지,
              <br className="block lg:hidden" /> 한 곳에서 빠르게 해결해보세요.
            </p>
          </div>

          {/* 오른쪽 콜센터 카드 */}
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 text-white shadow-xl lg:mt-0">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  icon="solar:call-chat-bold-duotone"
                  className="h-6 w-6 text-[#FFD54F]"
                />
                <span className="text-sm font-medium text-white/80">
                  웨딩PICK 고객 케어팀
                </span>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/80">
                실시간 응답 우선
              </span>
            </div>
            <p className="text-[13px] text-white/75">
              평일 10:00 ~ 18:00 (점심 12:30 ~ 13:30)
              <br />
              주말·공휴일은 카카오톡으로 간편 문의가 가능합니다.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2.5 text-[13px]">
              <button className="flex flex-col items-center rounded-2xl bg-white/5 px-3 py-3 text-center transition hover:bg-white/10 active:scale-[0.97]">
                <Icon
                  icon="solar:chat-round-dots-bold"
                  className="mb-1.5 h-5 w-5 text-[#FFD54F]"
                />
                <span className="font-semibold">1:1 채팅</span>
                <span className="mt-0.5 text-[11px] text-white/65">
                  평균 5분 이내
                </span>
              </button>
              <button className="flex flex-col items-center rounded-2xl bg-white/5 px-3 py-3 text-center transition hover:bg-white/10 active:scale-[0.97]">
                <Icon
                  icon="ri:kakao-talk-fill"
                  className="mb-1.5 h-5 w-5 text-[#FEE500]"
                />
                <span className="font-semibold">카카오톡</span>
                <span className="mt-0.5 text-[11px] text-white/65">
                  웨딩PICK 채널
                </span>
              </button>
              <button className="flex flex-col items-center rounded-2xl bg-white/5 px-3 py-3 text-center transition hover:bg-white/10 active:scale-[0.97]">
                <Icon
                  icon="solar:phone-bold"
                  className="mb-1.5 h-5 w-5 text-[#80D8FF]"
                />
                <span className="font-semibold">전화 예약</span>
                <span className="mt-0.5 text-[11px] text-white/65">
                  콜백 신청
                </span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[12px] text-white/60">
              <div>
                <span className="font-medium text-white/80">대표번호</span>
                <span className="ml-2 font-semibold text-white">
                  02-000-0000
                </span>
              </div>
              <button className="flex items-center text-[11px] text-white/75 underline-offset-2 hover:underline">
                상담 시간 자세히 보기
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="ml-1 h-3.5 w-3.5"
                />
              </button>
            </div>
          </div>
        </section>

        {/* 메인 컨텐츠 영역 */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* 좌측: FAQ & 공지 */}
          <div className="lg:col-span-7 xl:col-span-8">
            {/* 공지 카드 */}
            <div className="mb-6 rounded-2xl border border-[#F0EEF8] bg-[#F9F8FF] p-5 shadow-[0_1px_12px_rgba(124,97,209,0.08)]">
              <div className="mb-2 flex items-center gap-2">
                <Icon
                  icon="solar:megaphone-bold-duotone"
                  className="h-5 w-5 text-[#7B61D1]"
                />
                <span className="text-sm font-semibold text-[#5C4AA8]">
                  고객센터 안내
                </span>
              </div>
              <p className="text-[13px] text-black/65 leading-relaxed">
                웨딩홀/스드메 견적 및 계약 관련 문의는{" "}
                <span className="font-semibold text-[#7B61D1]">마이페이지</span>
                에서 예약 건을 선택 후 문의를 남겨주시면,
                <br className="hidden lg:block" /> 담당 매니저가 예약 정보와
                함께 빠르게 도와드립니다.
              </p>
            </div>

            {/* FAQ 타이틀 */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-black/90">
                자주 묻는 질문
              </h2>
              <button className="flex items-center text-[13px] font-medium text-[#7B61D1] hover:underline">
                전체 보기
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="ml-1 h-4 w-4"
                />
              </button>
            </div>

            {/* FAQ 리스트 (아코디언) */}
            <div className="space-y-3">
              {FAQ_LIST.map((item) => {
                const isActive = activeFaqId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleFaq(item.id)}
                    className="group w-full rounded-2xl border border-[#ECEAF6] bg-white px-4 py-3 text-left shadow-[0_1px_8px_rgba(15,23,42,0.03)] transition hover:border-[#D6D1F3] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 inline-flex items-center rounded-full bg-[#F5F2FF] px-2.5 py-0.5 text-[11px] font-medium text-[#7B61D1]">
                          <Icon
                            icon="solar:folder-with-files-bold-duotone"
                            className="mr-1 h-3.5 w-3.5"
                          />
                          {item.category}
                        </div>
                        <p className="text-[14px] font-semibold text-black/85">
                          {item.question}
                        </p>
                      </div>
                      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F3F4F5] text-black/60 transition group-hover:bg-[#7B61D1] group-hover:text-white">
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

                    {isActive && (
                      <div className="mt-2 border-t border-dashed border-[#E3E0F4] pt-2">
                        <p className="text-[13px] leading-relaxed text-black/65">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우측: 1:1 문의 & 기타 정보 */}
          <aside className="lg:col-span-5 xl:col-span-4">
            {/* 1:1 문의 폼 */}
            <div className="rounded-3xl border border-[#F0EEF8] bg-white p-5 shadow-[0_1px_14px_rgba(15,23,42,0.04)]">
              <h3 className="mb-1.5 text-lg font-bold text-black/90">
                1:1 문의 남기기
              </h3>
              <p className="mb-4 text-[13px] text-black/60">
                웨딩홀, 스튜디오, 드레스, 메이크업 등
                <br className="block lg:hidden" /> 어떤 내용이든 편하게
                남겨주세요.
              </p>

              <div className="space-y-3.5 text-[13px]">
                <div>
                  <label className="mb-1 inline-block text-[12px] font-medium text-black/70">
                    이름
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-[#E3E5E8] bg-[#F9FAFB] px-3 py-2.5 text-[13px] text-black/80 placeholder:text-[#C0C4CC] focus:border-[#7B61D1] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7B61D1]/60"
                    placeholder="예: 김신부"
                  />
                </div>
                <div>
                  <label className="mb-1 inline-block text-[12px] font-medium text-black/70">
                    연락처 (또는 이메일)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-[#E3E5E8] bg-[#F9FAFB] px-3 py-2.5 text-[13px] text-black/80 placeholder:text-[#C0C4CC] focus:border-[#7B61D1] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7B61D1]/60"
                    placeholder="답변을 받으실 연락처를 입력해주세요"
                  />
                </div>
                <div>
                  <label className="mb-1 inline-block text-[12px] font-medium text-black/70">
                    문의 유형
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center rounded-xl border border-[#E3E5E8] bg-[#F9FAFB] px-3 py-2 text-[12px] font-medium text-black/70 transition hover:border-[#7B61D1] hover:bg-[#F5F2FF]">
                      견적 상담
                    </button>
                    <button className="flex items-center justify-center rounded-xl border border-[#E3E5E8] bg-[#F9FAFB] px-3 py-2 text-[12px] font-medium text-black/70 transition hover:border-[#7B61D1] hover:bg-[#F5F2FF]">
                      예약/일정 변경
                    </button>
                    <button className="flex items-center justify-center rounded-xl border border-[#E3E5E8] bg-[#F9FAFB] px-3 py-2 text-[12px] font-medium text-black/70 transition hover:border-[#7B61D1] hover:bg-[#F5F2FF]">
                      결제/환불
                    </button>
                    <button className="flex items-center justify-center rounded-xl border border-[#E3E5E8] bg-[#F9FAFB] px-3 py-2 text-[12px] font-medium text-black/70 transition hover:border-[#7B61D1] hover:bg-[#F5F2FF]">
                      기타 문의
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 inline-block text-[12px] font-medium text-black/70">
                    문의 내용
                  </label>
                  <textarea
                    className="h-28 w-full resize-none rounded-xl border border-[#E3E5E8] bg-[#F9FAFB] px-3 py-2.5 text-[13px] text-black/80 placeholder:text-[#C0C4CC] focus:border-[#7B61D1] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7B61D1]/60"
                    placeholder="예: 11월 토요일 저녁 예식 가능한 웨딩홀과 드레스/메이크업 패키지 견적이 궁금합니다."
                  />
                </div>

                <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7B61D1] px-4 py-2.5 text-[13px] font-semibold text-white shadow-md transition hover:bg-[#6A50C4] hover:shadow-lg active:scale-[0.99]">
                  <Icon
                    icon="solar:paper-plane-bold-duotone"
                    className="h-4.5 w-4.5"
                  />
                  문의 보내기
                </button>

                <p className="mt-1 text-[11px] text-black/45">
                  문의 접수 후, 영업일 기준 24시간 이내에
                  <br className="block lg:hidden" /> 입력하신 연락처로 답변을
                  드립니다.
                </p>
              </div>
            </div>

            {/* 안내 박스 */}
            <div className="mt-5 rounded-2xl bg-[#F3F4F6] p-4 text-[12px] text-black/70">
              <div className="mb-2 flex items-center gap-2">
                <Icon
                  icon="solar:shield-check-bold-duotone"
                  className="h-4.5 w-4.5 text-[#7B61D1]"
                />
                <span className="text-[12px] font-semibold text-black/80">
                  안전한 웨딩 계약을 위해
                </span>
              </div>
              <ul className="space-y-1.5">
                <li className="flex gap-2">
                  <span className="mt-[5px] h-[3px] w-[3px] flex-shrink-0 rounded-full bg-black/30" />
                  <span>
                    웨딩PICK은 모든 상담 내역과 견적서를
                    <span className="font-medium"> 마이페이지에 보관</span>하여
                    분쟁을 예방합니다.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[5px] h-[3px] w-[3px] flex-shrink-0 rounded-full bg-black/30" />
                  <span>
                    계약 및 결제는 반드시
                    <span className="font-medium">
                      {" "}
                      공식 채널(앱/웹, 고객센터)
                    </span>
                    로만 진행해주세요.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[5px] h-[3px] w-[3px] flex-shrink-0 rounded-full bg-black/30" />
                  <span>
                    의심스러운 연락을 받으신 경우,
                    <span className="font-medium"> 즉시 고객센터</span>로
                    알려주세요.
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
