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
  return h < 12 ? "오전" : "오후";
}

/** 12시간제 */
function formatTime12h(timeStr: string) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = Number(hStr);
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${String(h).padStart(2, "0")}:${mStr}`;
}

/** ====== 생성 요청 DTO ====== */
type ScheduleCreateRequest = {
  title: string;
  content: string;
  startScheduleDate: string;
  endScheduleDate: string;
  startTime: string;
  endTime: string;
};

/** ====== 컴포넌트 시작 ====== */
export default function PersonalScheduleCreateMobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  /** 기본값 */
  const today = useMemo(() => new Date(), []);
  const defaultDate = useMemo(() => toDateInput(today), [today]);

  /** 상태 */
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [memo, setMemo] = useState("");

  /** 파일 */
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /** ====== 유효성 검사 ====== */
  const validate = useCallback(() => {
    const next: Record<string, string> = {};

    if (!title.trim()) next.title = "제목을 입력해 주세요.";
    if (!startDate) next.startDate = "시작 일자를 선택해 주세요.";
    if (!endDate) next.endDate = "종료 일자를 선택해 주세요.";

    /** 날짜 유효성 검사: 시작일 ≤ 종료일 */
    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);
      if (sd > ed) next.endDate = "종료일은 시작일 이후여야 합니다.";
    }

    /** 시간 유효성 검사: 시작 < 종료 */
    if (!startTime || !endTime) {
      next.time = "시작/종료 시간을 모두 선택해 주세요.";
    } else {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        next.time = "종료 시간은 시작 시간보다 늦게 설정해 주세요.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, startDate, endDate, startTime, endTime]);

  /** 날짜/시간 라벨 */
  const startDateLabel = formatKoreanDateLabel(startDate);
  const endDateLabel = formatKoreanDateLabel(endDate);

  const startAmPm = getAmPmLabel(startTime);
  const endAmPm = getAmPmLabel(endTime);
  const startDisplayTime = formatTime12h(startTime);
  const endDisplayTime = formatTime12h(endTime);

  const sameDay =
    new Date(startDate).toDateString() === new Date(endDate).toDateString();

  const timeDateHint = sameDay
    ? `${startDateLabel} 일정의 시간입니다.`
    : `${startDateLabel} ~ ${endDateLabel} 일정의 시간입니다.`;

  /** ====== 파일 추가 ====== */
  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fl = e.target.files;
      if (!fl) return;
      const arr = Array.from(fl);
      setFiles((prev) => [...prev, ...arr]);
      e.target.value = "";
    },
    []
  );

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="w-full bg-[#F4F6FB]">
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col relative">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="개인 일정 추가"
            onBack={onBack}
            showMenu={false}
          />
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-20 pb-6">
            {/* 제목 */}
            <div className="mt-4 mb-8 flex items-center gap-3">
              <div className="w-1 h-8 rounded-[3px] bg-[#FF2233]" />
              <input
                className="flex-1 bg-transparent outline-none text-[20px] font-semibold text-[#1E2124]"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {errors.title && (
              <p className="mb-3 text-[12px] text-[#EB5147]">{errors.title}</p>
            )}

            {/* 날짜 */}
            <div className="mt-2">
              <div className="flex items-center gap-4">
                <Icon icon="ant-design:calendar-outlined" className="w-5 h-5" />
                <span className="text-[16px] text-[#1E2124]">
                  {startDateLabel} {" > "} {endDateLabel}
                </span>
              </div>

              <div className="mt-3 ml-9 flex flex-col gap-2">
                <div className="w-[260px] h-[44px] bg-white border border-[#E5E7EB] rounded-[14px] flex items-center px-4">
                  <input
                    type="date"
                    className="flex-1 bg-transparent outline-none text-[14px]"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="w-[260px] h-[44px] bg-white border border-[#E5E7EB] rounded-[14px] flex items-center px-4">
                  <input
                    type="date"
                    className="flex-1 bg-transparent outline-none text-[14px]"
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

            {/* 시간 */}
            <div className="mt-6">
              <div className="flex items-center gap-4">
                <Icon icon="prime:clock" className="w-5 h-5" />
                <span className="text-[16px] text-[#1E2124]">
                  {startTime} {" ~ "} {endTime}
                </span>
              </div>

              <p className="mt-1 ml-9 text-[12px] text-[#9CA3AF]">
                {timeDateHint}
              </p>

              <div className="mt-3 ml-9 flex items-center gap-3">
                {/* 시작 */}
                <button
                  type="button"
                  className="relative w-[150px] h-[44px] bg-white border border-[#E5E7EB] rounded-[14px] flex items-center justify-between px-4"
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

                {/* 종료 */}
                <button
                  type="button"
                  className="relative w-[150px] h-[44px] bg-white border border-[#E5E7EB] rounded-[14px] flex items-center justify-between px-4"
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

            {/* 메모 */}
            <div className="mt-8">
              <textarea
                className="w-full h-[160px] bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-3 outline-none text-[14px]"
                placeholder="메모를 입력해 주세요"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            {/* 파일 첨부 */}
            <div className="mt-8 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Icon icon="f7:link" className="w-5 h-5 text-[#333]" />
                <span className="text-[14px] text-[#1E2124]">파일 첨부</span>
              </div>

              <div className="ml-8 w-[310px] space-y-3">
                {/* 파일 추가 버튼 */}
                <label className="inline-flex items-center justify-center px-4 h-[40px] rounded-[12px] bg-white border border-dashed border-[#E5E7EB] text-[13px] text-[#4B5563] cursor-pointer">
                  파일 추가
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                </label>

                {/* 업로드한 파일 목록 */}
                {files.length > 0 &&
                  files.map((file, i) => (
                    <div
                      key={i}
                      className="w-full h-[40px] bg-white border border-[#E5E7EB] rounded-[12px] px-4 flex items-center justify-between"
                    >
                      <span className="text-[13px] text-[#111827] truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E5E7EB]"
                      >
                        <Icon
                          icon="solar:trash-bin-minimalistic-bold"
                          className="w-4 h-4 text-[#9CA3AF]"
                        />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            {/* ==== PART 1 끝 / PART 2 시작 ==== */}
          </div>
        </div>

        {/* ===== 하단 등록 버튼 ===== */}
        <div className="px-5 pb-20 pt-3">
          <button
            type="button"
            onClick={async () => {
              if (submitting) return;
              if (!validate()) return;

              const payload: ScheduleCreateRequest = {
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
                new Blob([JSON.stringify(payload)], {
                  type: "application/json",
                })
              );

              /** 새 파일들 append */
              files.forEach((f) => {
                formData.append("file", f);
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
                console.error("[PersonalScheduleCreate] error:", e);
                alert("일정 등록 중 오류가 발생했습니다.");
              } finally {
                setSubmitting(false);
              }
            }}
            className={[
              "w-[350px] h-[56px] mx-auto rounded-[12px] flex items-center justify-center",
              "text-[16px] font-semibold tracking-[-0.2px]",
              "bg-[#FF2233] text-white active:scale-95",
            ].join(" ")}
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
