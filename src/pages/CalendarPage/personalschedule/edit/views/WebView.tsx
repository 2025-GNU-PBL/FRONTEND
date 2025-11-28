import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import api from "../../../../../lib/api/axios";

/** ====== 상수: S3 기본 URL ====== */
const S3_BASE_URL = "https://gnubucketgnu.s3.ap-northeast-2.amazonaws.com/";

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

/** 12시간제 포맷 */
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

/** ====== 단건 조회 응답 DTO ====== */
type ScheduleDetailResponse = {
  id: number;
  title: string;
  content: string;
  startScheduleDate: string;
  endScheduleDate: string;
  startTime: string;
  endTime: string;
  scheduleType: "PERSONAL" | "SHARED" | string;
  productName: string;
  customerName: string;
  bzName: string;
  address: string;
  scheduleFiles: {
    id: number;
    name: string;
    s3Key: string;
  }[];
};

/** ====== 수정 요청 DTO ====== */
type ScheduleUpdateRequest = {
  title: string;
  content: string;
  startScheduleDate: string;
  endScheduleDate: string;
  startTime: string;
  endTime: string;
  keepFileIds: number[];
};

export default function WebView() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const scheduleId = id ? Number(id) : NaN;

  /** 보기 / 수정 모드 */
  const [mode, setMode] = useState<"view" | "edit">("view");

  /** 기본 값 */
  const today = useMemo(() => new Date(), []);
  const defaultDate = useMemo(() => toDateInput(today), [today]);

  /** 폼 상태 */
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [memo, setMemo] = useState("");

  /** 파일 상태 */
  const [existingFiles, setExistingFiles] = useState<
    ScheduleDetailResponse["scheduleFiles"]
  >([]);
  const [keepFileIds, setKeepFileIds] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  /** ====== 상세 조회 ====== */
  useEffect(() => {
    if (!scheduleId || Number.isNaN(scheduleId)) return;

    const normalizeDate = (d?: string) =>
      d && d.length >= 10 ? d.slice(0, 10) : defaultDate;

    const normalizeTime = (t: string | undefined, fallback: string) => {
      if (!t) return fallback;
      return t.slice(0, 5);
    };

    const fetchDetail = async () => {
      try {
        setLoading(true);

        const { data } = await api.get<ScheduleDetailResponse>(
          `/api/v1/schedule/${scheduleId}`
        );

        setTitle(data.title ?? "");
        setMemo(data.content ?? "");

        setStartDate(normalizeDate(data.startScheduleDate));
        setEndDate(normalizeDate(data.endScheduleDate));
        setStartTime(normalizeTime(data.startTime, "11:00"));
        setEndTime(normalizeTime(data.endTime, "13:00"));

        const serverFiles = data.scheduleFiles || [];
        setExistingFiles(serverFiles);
        setKeepFileIds(serverFiles.map((f) => f.id));
      } catch (e) {
        console.error("[PersonalScheduleEditWebView] fetch detail error:", e);
        toast.error("일정 정보를 불러오는 중 오류가 발생했습니다.");
        nav(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [scheduleId, defaultDate, nav]);

  /** 라벨들 */
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
      const [sh, sm] = startTime.split(":").map((v) => Number(v));
      const [eh, em] = endTime.split(":").map((v) => Number(v));
      if (
        !Number.isNaN(sh) &&
        !Number.isNaN(sm) &&
        !Number.isNaN(eh) &&
        !Number.isNaN(em)
      ) {
        const startTotal = sh * 60 + sm;
        const endTotal = eh * 60 + em;
        if (startTotal >= endTotal) {
          next.time = "종료 시간은 시작 시간보다 늦게 설정해 주세요.";
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, startDate, endDate, startTime, endTime]);

  const isValid = useMemo(
    () =>
      !!title.trim() && !!startDate && !!endDate && !!startTime && !!endTime,
    [title, startDate, endDate, startTime, endTime]
  );

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

  /** 새 파일 삭제 */
  const handleRemoveNewFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** 기존 파일 삭제 (수정 모드에서만 사용) */
  const handleRemoveExistingFile = useCallback((fileId: number) => {
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
    setKeepFileIds((prev) => prev.filter((id) => id !== fileId));
  }, []);

  /** 기존 파일 열기 (조회/수정 공통, S3 URL 조합) */
  const handleOpenExistingFile = useCallback(
    (file: { id: number; name: string; s3Key: string }) => {
      if (!file.s3Key) return;
      const url = file.s3Key.startsWith("http")
        ? file.s3Key
        : `${S3_BASE_URL}${
            file.s3Key.startsWith("/") ? file.s3Key.slice(1) : file.s3Key
          }`;
      window.open(url, "_blank");
    },
    []
  );

  /** 수정 요청 */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!scheduleId || Number.isNaN(scheduleId)) return;

    if (!validate()) {
      toast.error("입력값을 다시 확인해 주세요.");
      return;
    }

    const requestPayload: ScheduleUpdateRequest = {
      title: title.trim(),
      content: memo.trim(),
      startScheduleDate: startDate,
      endScheduleDate: endDate,
      startTime: startTime,
      endTime: endTime,
      keepFileIds,
    };

    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(requestPayload)], {
        type: "application/json",
      })
    );

    files.forEach((file) => {
      formData.append("file", file);
    });

    try {
      setSubmitting(true);
      await api.patch(`/api/v1/schedule/${scheduleId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("개인 일정이 수정되었습니다.");
      nav(-1);
    } catch (e) {
      console.error("[PersonalScheduleEditWebView] update error:", e);
      toast.error("일정 수정 중 오류가 발생했습니다. 입력값을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    scheduleId,
    validate,
    title,
    memo,
    startDate,
    endDate,
    startTime,
    endTime,
    keepFileIds,
    files,
    nav,
  ]);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* 본문 */}
      <div className="max-w-[1120px] mt-16 mx-auto px-8 py-10">
        {/* 타이틀 */}
        <div className="mb-8 text-center">
          <h1 className="text-[24px] md:text-[26px] font-semibold text-[#111827] tracking-[-0.4px]">
            {mode === "view" ? "개인 일정 상세" : "개인 일정 수정"}
          </h1>
          <p className="mt-3 text-[14px] md:text-[15px] text-[#6B7280] tracking-[-0.2px] leading-[22px]">
            날짜와 시간을 확인하고 필요한 정보와 메모를{" "}
            {mode === "view" ? "확인해 보세요." : "수정해 보세요."}
          </p>
        </div>

        {/* 메인 카드: 카드 자체를 가운데 & 폭 제한 */}
        <div className="flex justify-center">
          <div className="w-full max-w-[900px] bg-white rounded-[24px] shadow-[0_18px_55px_rgba(15,23,42,0.06)] border border-[#E5E7EB] px-10 py-12">
            {loading ? (
              <div className="w-full h-[320px] flex items-center justify-center text-[14px] text-[#9CA3AF]">
                일정 정보를 불러오는 중입니다...
              </div>
            ) : mode === "view" ? (
              <>
                {/* ===== 조회 모드 ===== */}
                {/* 제목 */}
                <div className="mt-1 mb-8 flex items-center gap-4">
                  <div className="w-1.5 h-8 rounded-[4px] bg-[#FF2233]" />
                  <p className="flex-1 bg-transparent text-[24px] md:text-[28px] font-semibold leading-[34px] tracking-[-0.4px] text-[#1E2124]">
                    {title || "-"}
                  </p>
                </div>

                {/* 날짜 */}
                <div className="mt-3">
                  <div className="flex items-center gap-4">
                    <Icon
                      icon="ant-design:calendar-outlined"
                      className="w-6 h-6 text-[#333333]"
                    />
                    <span className="text-[16px] leading-[28px] tracking-[-0.2px] text-[#1E2124]">
                      {sameDay
                        ? startDateLabel
                        : `${startDateLabel} > ${endDateLabel}`}
                    </span>
                  </div>
                </div>

                {/* 시간 */}
                <div className="mt-5">
                  <div className="flex items-center gap-4">
                    <Icon
                      icon="prime:clock"
                      className="w-6 h-6 text-[#333333]"
                    />
                    <span className="text-[16px] leading-[28px] tracking-[-0.2px] text-[#1E2124]">
                      {startTimeLabel} {"-"} {endTimeLabel}
                    </span>
                  </div>
                  <p className="mt-2 ml-[44px] text-[13px] text-[#9CA3AF] leading-[20px]">
                    {timeDateHint}
                  </p>
                </div>

                {/* 메모 */}
                <div className="mt-6">
                  <div className="flex items-center gap-4 mb-2.5">
                    <Icon
                      icon="ph:note-duotone"
                      className="w-6 h-6 text-[#333333]"
                    />
                    <span className="text-[15px] text-[#1E2124] leading-[22px]">
                      메모
                    </span>
                  </div>
                  <p className="ml-[44px] text-[15px] leading-[26px] text-[#111827] whitespace-pre-line">
                    {memo || "-"}
                  </p>
                </div>

                {/* 파일 첨부 */}
                <div className="mt-6 mb-2">
                  <div className="flex items-center gap-4 mb-2.5">
                    <Icon icon="f7:link" className="w-6 h-6 text-[#333333]" />
                    <span className="text-[15px] text-[#1E2124] leading-[22px]">
                      파일 첨부
                    </span>
                  </div>

                  <div className="ml-[44px] w-full max-w-[640px] space-y-1.5">
                    {existingFiles.length === 0 ? (
                      <p className="text-[15px] text-[#9CA3AF]">
                        첨부된 파일이 없습니다.
                      </p>
                    ) : (
                      existingFiles.map((file) => (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => handleOpenExistingFile(file)}
                          className="w-full text-left text-[15px] leading-[24px] text-[#2563EB] underline underline-offset-2 hover:text-[#1D4ED8] active:scale-[0.99]"
                        >
                          {file.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* 하단 수정 버튼 (조회 -> 수정 모드 전환) */}
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="min-w-[260px] h-[56px] rounded-[14px] flex items-center justify-center bg-[#FF2233] text-white text-[16px] font-semibold tracking-[-0.2px] active:scale-95"
                  >
                    수정하기
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ===== 수정 모드 ===== */}
                {/* 제목 입력 */}
                <div className="mt-1 mb-8 flex items-center gap-4">
                  <div className="w-1.5 h-8 rounded-[4px] bg-[#FF2233]" />
                  <input
                    className="flex-1 bg-transparent outline-none text-[24px] md:text-[26px] font-semibold leading-[34px] tracking-[-0.4px] placeholder:text-[#D9D9D9] text-[#1E2124]"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                {errors.title && (
                  <p className="mb-4 text-[13px] text-[#EB5147]">
                    {errors.title}
                  </p>
                )}

                {/* 날짜 */}
                <div className="mt-2">
                  <div className="flex items-center gap-3 mb-2.5">
                    <Icon
                      icon="ant-design:calendar-outlined"
                      className="w-[20px] h-[20px] text-[#333333]"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] leading-[24px] tracking-[-0.2px] text-[#1E2124]">
                        {startDateLabel}
                      </span>
                      <span className="text-[15px] text-[#1E2124]">{">"}</span>
                      <span className="text-[15px] leading-[24px] tracking-[-0.2px] text-[#1E2124]">
                        {endDateLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 ml-[40px] flex gap-4">
                    <div className="w-[300px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center px-3.5">
                      <input
                        type="date"
                        className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="w-[300px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center px-3.5">
                      <input
                        type="date"
                        className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {(errors.startDate || errors.endDate) && (
                    <p className="mt-2 ml-[40px] text-[13px] text-[#EB5147]">
                      {errors.startDate || errors.endDate}
                    </p>
                  )}
                </div>

                {/* 시간 */}
                <div className="mt-6">
                  <div className="flex itemscenter gap-3">
                    <Icon
                      icon="prime:clock"
                      className="w-[20px] h-[20px] text-[#333333]"
                    />
                    <div className="flex items-center gap-4">
                      <span className="text-[15px] leading-[24px] tracking-[-0.2px] text-[#1E2124]">
                        {startTimeLabel}
                      </span>
                      <span className="text-[15px] text-[#1E2124]">{">"}</span>
                      <span className="text-[15px] leading-[24px] tracking-[-0.2px] text-[#1E2124]">
                        {endTimeLabel}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1.5 ml-[40px] text-[12px] text-[#9CA3AF]">
                    {timeDateHint}
                  </p>

                  <div className="mt-3 ml-[40px] flex items-center gap-4">
                    {/* 시작 시간 */}
                    <button
                      type="button"
                      className="relative w-[180px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center justify-between px-3.5"
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

                    <span className="text-[13px] text-[#9CA3AF]">~</span>

                    {/* 종료 시간 */}
                    <button
                      type="button"
                      className="relative w-[180px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center justify-between px-3.5"
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
                    <p className="mt-2 ml-[40px] text-[13px] text-[#EB5147]">
                      {errors.time}
                    </p>
                  )}
                </div>

                {/* 메모 입력 */}
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon
                      icon="ph:note-duotone"
                      className="w-[20px] h-[20px] text-[#333333]"
                    />
                    <span className="text-[13px] text-[#999999] leading-[20px]">
                      메모
                    </span>
                  </div>
                  <div className="ml-[40px] w-full max-w-[760px] h-[160px] bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 py-3">
                    <textarea
                      className="w-full h-full bg-transparent resize-none outline-none text-[14px] text-[#1E2124] placeholder:text-[#C4C4C4]"
                      placeholder="메모를 입력해 주세요"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                    />
                  </div>
                </div>

                {/* 파일 첨부 */}
                <div className="mt-6 mb-2">
                  <div className="flex items-center gap-3 mb-2.5">
                    <Icon
                      icon="f7:link"
                      className="w-[20px] h-[20px] text-[#333333]"
                    />
                    <span className="text-[13px] text-[#999999] leading-[20px]">
                      파일 첨부
                    </span>
                  </div>

                  <div className="ml-[40px] w-full max-w-[760px] space-y-3">
                    {/* 기존 파일 목록 */}
                    {existingFiles.length > 0 && (
                      <div className="space-y-2">
                        {existingFiles.map((file) => (
                          <div
                            key={file.id}
                            className="w-full h-[40px] bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 flex items-center justify-between"
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenExistingFile(file)}
                              className="flex-1 text-left text-[13px] text-[#111827] truncate underline-offset-2 hover:underline"
                            >
                              {file.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingFile(file.id)}
                              className="ml-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E5E7EB] active:scale-95"
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

                    {/* 새 파일 추가 */}
                    <label className="inline-flex items-center justify-center px-4 h-[40px] rounded-[14px] bg-white border border-dashed border-[#E5E7EB] text-[13px] text-[#4B5563] cursor-pointer">
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
                            className="w-full h-[40px] bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 flex items-center justify-between"
                          >
                            <span className="text-[13px] text-[#111827] truncate">
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewFile(index)}
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

                {/* 하단 수정 버튼 (실제 저장) */}
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isValid || submitting || loading}
                    className={[
                      "min-w-[260px] h-[56px] rounded-[14px] flex items-center justify-center",
                      "text-[16px] font-semibold tracking-[-0.2px]",
                      isValid && !submitting && !loading
                        ? "bg-[#FF2233] text-white active:scale-95"
                        : "bg-[#F6F6F6] text-[#ADB3B6]",
                    ].join(" ")}
                  >
                    {submitting ? "수정 중..." : "수정하기"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
