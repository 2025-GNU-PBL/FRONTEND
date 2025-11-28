import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";

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
export default function MobileView() {
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

  /** 제목 입력 여부로 버튼 활성/비활성 */
  const isSubmitDisabled = !title.trim() || submitting;

  /** ====== 유효성 검사 ====== */
  const validate = useCallback(() => {
    const next: Record<string, string> = {};

    if (!title.trim()) {
      next.title = "제목을 입력해 주세요.";
    }

    if (!startDate) next.startDate = "시작 일자를 선택해 주세요.";
    if (!endDate) next.endDate = "종료 일자를 선택해 주세요.";

    const todayStr = toDateInput(new Date());

    if (startDate && startDate < todayStr) {
      next.startDate = "시작일은 오늘 이후 날짜만 선택할 수 있습니다.";
    }

    if (endDate && endDate < todayStr) {
      next.endDate = "종료일은 오늘 이후 날짜만 선택할 수 있습니다.";
    }

    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);

      if (sd > ed) {
        next.endDate = "종료일은 시작일 이후여야 합니다.";
      }
    }

    if (!startTime || !endTime) {
      next.time = "시작/종료 시간을 모두 선택해 주세요.";
    } else {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = eh * 60 + em;
      if (startTotal >= endTotal) {
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
    <div className="min-h-screen bg-[#F4F6FB]">
      <div className="w-full min-h-screen bg-white flex flex-col relative shadow-sm">
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="개인 일정 추가"
            onBack={onBack}
            showMenu={false}
          />
        </div>

        <div className="flex-1 px-5 pt-15 pb-28">
          {/* 제목 */}
          <section className="mt-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-[3px] bg-[#FF2233]" />
              <input
                className="flex-1 bg-transparent outline-none text-[20px] font-semibold text-[#1E2124] placeholder:text-[#D1D5DB]"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {errors.title && (
              <p className="mt-2 text-[12px] text-[#EB5147]">{errors.title}</p>
            )}
          </section>

          {/* 날짜 */}
          <section className="mt-8">
            <div className="flex items-start gap-3">
              <Icon icon="ant-design:calendar-outlined" className="w-5 h-5" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#111827]">
                    일정 기간
                  </span>
                  <span className="text-[12px] text-[#6B7280]">
                    {startDateLabel} {" > "} {endDateLabel}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  {/* 시작일 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#9CA3AF]">시작일</span>
                    <div className="w-full h-[44px] bg-white border border-[#E5E7EB] rounded-[14px] flex items-center px-4">
                      <input
                        type="date"
                        className="flex-1 bg-transparent outline-none text-[14px]"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 종료일 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#9CA3AF]">종료일</span>
                    <div className="w-full h-[44px] bg-white border border-[#E5E7EB] rounded-[14px] flex items-center px-4">
                      <input
                        type="date"
                        className="flex-1 bg-transparent outline-none text-[14px]"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {(errors.startDate || errors.endDate) && (
                  <p className="mt-2 text-[12px] text-[#EB5147]">
                    {errors.startDate || errors.endDate}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 시간 */}
          <section className="mt-8">
            <div className="flex items-start gap-3">
              <Icon icon="prime:clock" className="w-5 h-5" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#111827]">
                    일정 시간
                  </span>
                  <span className="text-[12px] text-[#6B7280]">
                    {startTime} {" ~ "} {endTime}
                  </span>
                </div>

                <p className="mt-1 text-[12px] text-[#9CA3AF]">
                  {timeDateHint}
                </p>

                <div className="mt-3 flex items-center gap-3 w-full">
                  {/* 시작 */}
                  <button
                    type="button"
                    className="relative flex-1 h-[44px] bg-white border border-[#E5E7EB] rounded-[14px] flex items-center justify-between px-4"
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
                    className="relative flex-1 h-[44px] bg-white border border-[#E5E7EB] rounded-[14px] flex items-center justify-between px-4"
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
                  <p className="mt-2 text-[12px] text-[#EB5147]">
                    {errors.time}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 메모 */}
          <section className="mt-8">
            <div className="flex items-start gap-3">
              <Icon icon="mdi:text-box-outline" className="w-5 h-5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#111827]">
                    메모
                  </span>
                  <span className="text-[12px] text-[#9CA3AF]">
                    선택 입력 사항
                  </span>
                </div>
                <textarea
                  className="mt-3 w-full h-[160px] bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-3 outline-none text-[14px] placeholder:text-[#D1D5DB]"
                  placeholder="메모를 입력해 주세요"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 파일 첨부 */}
          <section className="mt-8">
            <div className="flex items-start gap-3">
              <Icon icon="f7:link" className="w-5 h-5 text-[#333]" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-medium text-[#1E2124]">
                    파일 첨부
                  </span>
                  <span className="text-[11px] text-[#9CA3AF]">
                    선택 입력 사항
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="inline-flex items-center justify-center px-4 h-[40px] rounded-[12px] bg-white border border-dashed border-[#E5E7EB] text-[13px] text-[#4B5563] cursor-pointer">
                    파일 추가
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFilesChange}
                    />
                  </label>

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
            </div>
          </section>
        </div>

        {/* ===== 하단 등록 버튼 ===== */}
        <div className="sticky bottom-0 bg-white px-5 pb-5 pt-3 border-t border-[#E5E7EB]">
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={async () => {
              if (isSubmitDisabled) return;

              if (!validate()) {
                toast.error("입력값을 다시 확인해 주세요.");
                return;
              }

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

              files.forEach((f) => formData.append("file", f));

              try {
                setSubmitting(true);
                await api.post("/api/v1/schedule", formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("개인 일정이 등록되었습니다.");
                nav(-1);
              } catch (e) {
                console.error("[PersonalScheduleCreate] error:", e);
                toast.error("일정 등록 중 오류가 발생했습니다.");
              } finally {
                setSubmitting(false);
              }
            }}
            className={[
              "w-full h-[56px] rounded-[12px] flex items-center justify-center text-[16px] font-semibold tracking-[-0.2px]",
              isSubmitDisabled
                ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                : "bg-[#FF2233] text-white active:scale-95",
            ].join(" ")}
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
