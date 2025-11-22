import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../components/MyPageHeader";
import api from "../../../lib/api/axios";

/** ====== 유틸 ====== */
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const weekdayKo = ["일", "월", "화", "수", "목", "금", "토"];

function formatKoreanDateLabel(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(+d)) return "";
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = weekdayKo[d.getDay()];
  return `${m}월 ${day}일 (${w})`;
}

/** AM/PM 라벨 */
function getAmPmLabel(timeStr: string) {
  if (!timeStr) return "";
  const [hStr] = timeStr.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return "";
  return h < 12 ? "오전" : "오후";
}

/** 12시간제로 보여줄 시간 (예: "04:00", "01:30") */
function formatTime12h(timeStr: string) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = Number(hStr);
  if (Number.isNaN(h)) return timeStr;
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const hh = String(h).padStart(2, "0");
  return `${hh}:${mStr}`;
}

/** ====== 서버 DTO ====== */
type ScheduleCreateRequest = {
  title: string;
  content: string;
  startScheduleDate: string; // yyyy-MM-dd
  endScheduleDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

export default function PersonalScheduleCreateMobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  /** 기본 값: 오늘 날짜, 11:00 ~ 13:00 */
  const today = useMemo(() => new Date(), []);
  const defaultDate = useMemo(() => toDateInput(today), [today]);

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [memo, setMemo] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** 유효성 검사 */
  const validate = useCallback(() => {
    const next: Record<string, string> = {};

    if (!title.trim()) {
      next.title = "제목을 입력해 주세요.";
    }

    if (!startDate) next.startDate = "시작 일자를 선택해 주세요.";
    if (!endDate) next.endDate = "종료 일자를 선택해 주세요.";

    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);

      if (sd > ed) {
        next.endDate = "종료일은 시작일 이후여야 합니다.";
      }
    }

    if (!startTime || !endTime) {
      next.time = "시작/종료 시간을 모두 선택해 주세요.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, startDate, endDate, startTime, endTime]);

  const isValid = useMemo(() => {
    if (!title.trim() || !startDate || !endDate || !startTime || !endTime) {
      return false;
    }
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    return sd <= ed;
  }, [title, startDate, endDate, startTime, endTime]);

  /** 등록 버튼 */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!validate()) return;

    const requestPayload: ScheduleCreateRequest = {
      title: title.trim(),
      content: memo.trim(),
      startScheduleDate: startDate, // yyyy-MM-dd
      endScheduleDate: endDate, // yyyy-MM-dd
      startTime,
      endTime,
    };

    const formData = new FormData();

    formData.append(
      "request",
      new Blob([JSON.stringify(requestPayload)], {
        type: "application/json",
      })
    );
    // file 필드는 현재 개인 일정에서는 사용 안 해서 append 안 함

    try {
      setSubmitting(true);
      await api.post("/api/v1/schedule", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("개인 일정이 등록되었습니다.");
      nav(-1);
    } catch (e) {
      console.error("[PersonalScheduleCreate] create error:", e);
      alert("일정 등록 중 오류가 발생했습니다. 입력값을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    validate,
    title,
    memo,
    startDate,
    endDate,
    startTime,
    endTime,
    nav,
  ]);

  /** 날짜/시간 라벨 */
  const startDateLabel = formatKoreanDateLabel(startDate) || "날짜 선택";
  const endDateLabel = formatKoreanDateLabel(endDate) || "날짜 선택";

  const startTimeLabel = startTime || "--:--";
  const endTimeLabel = endTime || "--:--";

  const startAmPm = getAmPmLabel(startTime);
  const endAmPm = getAmPmLabel(endTime);
  const startDisplayTime = formatTime12h(startTime);
  const endDisplayTime = formatTime12h(endTime);

  const sameDay =
    new Date(startDate).toDateString() === new Date(endDate).toDateString();
  const timeDateHint = sameDay
    ? `${startDateLabel} 일정의 시간입니다.`
    : `${startDateLabel} ~ ${endDateLabel} 일정의 시간입니다.`;

  return (
    <div className="w-full bg-[#F4F6FB]">
      {/* 390 × 844 프레임 */}
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col relative">
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="개인 일정 추가"
            onBack={onBack}
            showMenu={false}
          />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-20 pb-6">
            {/* 제목 입력 섹션 */}
            <div className="mt-4 mb-8 flex items-center gap-3">
              <div className="w-1 h-8 rounded-[3px] bg-[#FF2233]" />
              <input
                className="flex-1 bg-transparent outline-none text-[20px] font-semibold leading-[32px] tracking-[-0.2px] placeholder:text-[#D9D9D9] text-[#1E2124]"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {errors.title && (
              <p className="mb-3 text-[12px] text-[#EB5147]">{errors.title}</p>
            )}

            {/* 날짜 선택 라인 */}
            <div className="mt-2">
              <div className="flex items-center gap-4">
                <Icon
                  icon="ant-design:calendar-outlined"
                  className="w-5 h-5 text-[#333333]"
                />

                <div className="flex items-center gap-4">
                  <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    {startDateLabel}
                  </span>

                  <span className="text-[16px] text-[#1E2124]">{">"}</span>

                  <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    {endDateLabel}
                  </span>
                </div>
              </div>

              <div className="mt-3 ml-9 flex flex-col gap-2">
                <div className="w-[260px] h-[44px] rounded-[14px] bg-[#F7F8FC] border border-[#E5E7EB] flex items-center px-4">
                  <input
                    type="date"
                    className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="w-[260px] h-[44px] rounded-[14px] bg-[#F7F8FC] border border-[#E5E7EB] flex items-center px-4">
                  <input
                    type="date"
                    className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {(errors.startDate || errors.endDate) && (
                <p className="mt-2 ml-9 text-[12px] text-[#EB5147]">
                  {errors.startDate || errors.endDate}
                </p>
              )}
            </div>

            {/* 시간 선택 라인 */}
            <div className="mt-6">
              <div className="flex items-center gap-4">
                <Icon icon="prime:clock" className="w-5 h-5 text-[#333333]" />

                <div className="flex items-center gap-6">
                  <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    {startTimeLabel}
                  </span>

                  <span className="text-[16px] text-[#1E2124]">{">"}</span>

                  <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    {endTimeLabel}
                  </span>
                </div>
              </div>

              <p className="mt-1 ml-9 text-[12px] text-[#9CA3AF]">
                {timeDateHint}
              </p>

              <div className="mt-3 ml-9 flex items-center gap-3">
                {/* 시작 시간 */}
                <button
                  type="button"
                  className="relative w-[150px] h-[44px] rounded-[14px] bg-[#F7F8FC] border border-[#E5E7EB] flex items-center justify-between px-4"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-[#9CA3AF]">
                      {startAmPm}
                    </span>
                    <span className="text-[14px] font-medium text-[#111827]">
                      {startDisplayTime}
                    </span>
                  </div>
                  <Icon
                    icon="mdi:clock-time-four-outline"
                    className="w-4 h-4 text-[#9CA3AF]"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </button>

                <span className="text-[14px] text-[#9CA3AF]">~</span>

                {/* 종료 시간 */}
                <button
                  type="button"
                  className="relative w-[150px] h-[44px] rounded-[14px] bg-[#F7F8FC] border border-[#E5E7EB] flex items-center justify-between px-4"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-[#9CA3AF]">
                      {endAmPm}
                    </span>
                    <span className="text-[14px] font-medium text-[#111827]">
                      {endDisplayTime}
                    </span>
                  </div>
                  <Icon
                    icon="mdi:clock-time-four-outline"
                    className="w-4 h-4 text-[#9CA3AF]"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </button>
              </div>

              {errors.time && (
                <p className="mt-2 ml-9 text-[12px] text-[#EB5147]">
                  {errors.time}
                </p>
              )}
            </div>

            {/* 메모 입력 */}
            <div className="mt-8">
              <div className="w-full h-[160px] bg-[#F6F7FB] rounded-[12px] px-4 py-3">
                <textarea
                  className="w-full h-full bg-transparent resize-none outline-none text-[14px] text-[#1E2124]"
                  placeholder="메모를 입력해 주세요"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 등록 버튼 */}
        <div className="px-5 pb-20 pt-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={[
              "w-[350px] h-[56px] mx-auto rounded-[12px] flex items-center justify-center",
              "text-[16px] font-semibold tracking-[-0.2px]",
              isValid && !submitting
                ? "bg-[#FF2233] text-white active:scale-95"
                : "bg-[#F6F6F6] text-[#ADB3B6]",
            ].join(" ")}
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
