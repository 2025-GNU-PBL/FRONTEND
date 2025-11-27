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

/** ====== 생성 요청 DTO ====== */
type ScheduleCreateRequest = {
  title: string;
  content: string;
  startScheduleDate: string; // yyyy-MM-dd
  endScheduleDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

type ErrorState = {
  startDate?: string;
  endDate?: string;
  time?: string;
};

export default function PersonalScheduleCreateWebView() {
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

  /** 파일 첨부 (새 파일들만) */
  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});

  /** 필수 값이 모두 채워졌는지만 체크 (버튼 색 결정용) */
  const isAllFilled = useMemo(
    () =>
      !!title.trim() && !!startDate && !!endDate && !!startTime && !!endTime,
    [title, startDate, endDate, startTime, endTime]
  );

  /** 유효성 검사 (제목은 에러 문구 없이 필수, 날짜/시간만 에러 문구) */
  const validate = useCallback(() => {
    const trimmedTitle = title.trim();
    const next: ErrorState = {};

    // 제목은 반드시 입력되어야 하지만 에러 문구는 표시하지 않음
    let valid = !!trimmedTitle;

    // 날짜 검사
    if (!startDate) {
      next.startDate = "시작 일자를 선택해 주세요.";
      valid = false;
    }
    if (!endDate) {
      next.endDate = "종료 일자를 선택해 주세요.";
      valid = false;
    }

    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);
      if (!Number.isNaN(+sd) && !Number.isNaN(+ed) && sd > ed) {
        next.endDate = "종료일은 시작일 이후여야 합니다.";
        valid = false;
      }
    }

    // 시간 검사
    if (!startTime || !endTime) {
      next.time = "시작/종료 시간을 모두 선택해 주세요.";
      valid = false;
    }

    if (startDate && endDate && startTime && endTime) {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${endDate}T${endTime}:00`);

      if (
        !Number.isNaN(+startDateTime) &&
        !Number.isNaN(+endDateTime) &&
        startDateTime >= endDateTime
      ) {
        next.time = "종료 시간은 시작 시간보다 늦게 설정해 주세요.";
        valid = false;
      }
    }

    setErrors(next);
    return valid;
  }, [title, startDate, endDate, startTime, endTime]);

  /** 파일 추가 */
  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const newFiles = Array.from(fileList);
      setFiles((prev) => [...prev, ...newFiles]);
      e.target.value = "";
    },
    []
  );

  /** 파일 삭제 */
  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** 등록 버튼 */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    const ok = validate();
    if (!ok) return;

    const requestPayload: ScheduleCreateRequest = {
      title: title.trim(),
      content: memo.trim(),
      startScheduleDate: startDate,
      endScheduleDate: endDate,
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

    // 개인 일정도 파일 업로드 가능
    files.forEach((file) => {
      formData.append("file", file);
    });

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
      console.error("[PersonalScheduleCreateWebView] create error:", e);
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
    files,
    nav,
  ]);

  /** 날짜/시간 라벨 + 표시용 값 */
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
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 상단 공통 헤더 영역 */}
      <div className="w-full bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1040px] mx-auto">
          <MyPageHeader
            title="개인 일정 추가"
            onBack={onBack}
            showMenu={false}
          />
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-[1040px] mt-20 mx-auto px-6 py-8">
        {/* 상단 타이틀/설명 */}
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">
            개인 일정 등록
          </h1>
          <p className="mt-1 text-[13px] text-[#6B7280] tracking-[-0.2px]">
            날짜와 시간을 선택하고 메모를 남겨 개인 일정을 등록해 보세요.
          </p>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
          <div className="max-w-[720px]">
            {/* 제목 입력 (에러 문구 없음, 필수) */}
            <div className="mt-2 mb-8 flex items-center gap-3">
              <div className="w-1 h-8 rounded-[3px] bg-[#FF2233]" />
              <input
                className="flex-1 bg-transparent outline-none text-[20px] font-semibold leading-[32px] tracking-[-0.2px] placeholder:text-[#D9D9D9] text-[#1E2124]"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* 날짜 선택 라인 */}
            <div className="mt-2">
              {/* 상단 라벨 영역 */}
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

              {/* 날짜 입력 pill (텍스트 박스 배경 흰색) */}
              <div className="mt-3 ml-9 flex gap-3">
                <div className="w-[320px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center px-4">
                  <input
                    type="date"
                    className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setErrors((prev) => ({ ...prev, startDate: "" }));
                    }}
                  />
                </div>
                <div className="w-[320px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center px-4">
                  <input
                    type="date"
                    className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setErrors((prev) => ({ ...prev, endDate: "" }));
                    }}
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
              {/* 상단 라벨 */}
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

              {/* 이 시간이 어떤 날짜인지 설명 */}
              <p className="mt-1 ml-9 text-[12px] text-[#9CA3AF]">
                {timeDateHint}
              </p>

              {/* 시간 pill (텍스트 박스 배경 흰색) */}
              <div className="mt-3 ml-9 flex items-center gap-3">
                {/* 시작 시간 */}
                <button
                  type="button"
                  className="relative w-[180px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center justify-between px-4"
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
                  {/* 실제 입력은 숨김 */}
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setErrors((prev) => ({ ...prev, time: "" }));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </button>

                <span className="text-[14px] text-[#9CA3AF]">~</span>

                {/* 종료 시간 */}
                <button
                  type="button"
                  className="relative w-[180px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center justify-between px-4"
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
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setErrors((prev) => ({ ...prev, time: "" }));
                    }}
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

            {/* 메모 입력 (텍스트 박스 배경 흰색) */}
            <div className="mt-8">
              <div className="w-full h-[180px] bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-3">
                <textarea
                  className="w-full h-full bg-transparent resize-none outline-none text-[14px] text-[#1E2124] placeholder:text-[#C4C4C4]"
                  placeholder="메모를 입력해 주세요"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </div>

            {/* 파일 첨부 (웹 전용, 카드 배경 흰색) */}
            <div className="mt-6">
              <div className="flex items-center gap-4 mb-2">
                <Icon icon="f7:link" className="w-5 h-5 text-[#333333]" />
                <span className="text-[12px] text-[#999999] leading-[18px]">
                  파일 첨부
                </span>
              </div>

              <div className="ml-9 w-full max-w-[720px] space-y-3">
                {/* 파일 추가 버튼 */}
                <label className="inline-flex items-center justify-center px-4 h-[40px] rounded-[12px] bg-white border border-dashed border-[#E5E7EB] text-[13px] text-[#4B5563] cursor-pointer">
                  <span>파일 추가</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                </label>

                {/* 새 첨부 파일 목록 */}
                {files.length > 0 && (
                  <div className="mt-1 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="w-full h-[40px] bg-white border border-[#E5E7EB] rounded-[12px] px-4 flex items-center justify-between"
                      >
                        <span className="text-[13px] text-[#111827] truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E5E7EB] active:scale-95"
                        >
                          <Icon
                            icon="solar:trash-bin-minimalistic-bold"
                            className="w-4 h-4 text-[#9CA3AF]"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 등록 버튼 */}
          <div className="mt-10 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={[
                "min-w-[200px] h-[52px] rounded-[12px] flex items-center justify-center",
                "text-[16px] font-semibold tracking-[-0.2px]",
                !submitting && isAllFilled
                  ? "bg-[#FF2233] text-white active:scale-95"
                  : "bg-[#F6F6F6] text-[#ADB3B6]",
              ].join(" ")}
            >
              {submitting ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
