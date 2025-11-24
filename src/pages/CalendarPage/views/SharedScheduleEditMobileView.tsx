import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  scheduleType: "PERSONAL" | "SHARED" | string;
  productName: string;
  customerName: string;
  bzName: string;
  address: string;
  keepFileIds: number[];
};

export default function SharedScheduleEditMobileView() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const scheduleId = id ? Number(id) : NaN;

  const onBack = useCallback(() => nav(-1), [nav]);

  /** 기본 값 */
  const today = useMemo(() => new Date(), []);
  const defaultDate = useMemo(() => toDateInput(today), [today]);

  /** 폼 상태 */
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState(""); // bzName
  const [customerName, setCustomerName] = useState(""); // customerName
  const [locationText, setLocationText] = useState(""); // address
  const [productName, setProductName] = useState(""); // productName
  const [scheduleType, setScheduleType] =
    useState<ScheduleDetailResponse["scheduleType"]>("SHARED");

  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [memo, setMemo] = useState("");

  /** 기존 파일 + 새 파일 */
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

    const normalizeTime = (t?: string, fallback: string) => {
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
        setCompanyName(data.bzName ?? "");
        setCustomerName(data.customerName ?? "");
        setLocationText(data.address ?? "");
        setProductName(data.productName ?? "");
        setScheduleType(data.scheduleType ?? "SHARED");

        setStartDate(normalizeDate(data.startScheduleDate));
        setEndDate(normalizeDate(data.endScheduleDate));
        setStartTime(normalizeTime(data.startTime, "11:00"));
        setEndTime(normalizeTime(data.endTime, "13:00"));

        const serverFiles = data.scheduleFiles || [];
        setExistingFiles(serverFiles);
        setKeepFileIds(serverFiles.map((f) => f.id));
      } catch (e) {
        console.error("[SharedScheduleEditMobileView] fetch detail error:", e);
        alert("일정 정보를 불러오는 중 오류가 발생했습니다.");
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

  /** ====== 유효성 검사 (실제 저장 시) ====== */
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
      // 여러 날짜 범위 허용 (하루로 제한 X)
    }

    if (!startTime || !endTime) {
      next.time = "시작/종료 시간을 모두 선택해 주세요.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, startDate, endDate, startTime, endTime]);

  /** ====== 저장 버튼 활성 여부 ======
   *  -> 필수 값이 비어있지만 않으면 true 로, 날짜 비교는 validate 안에서만 체크
   */
  const isValid = useMemo(
    () =>
      !!title.trim() && !!startDate && !!endDate && !!startTime && !!endTime,
    [title, startDate, endDate, startTime, endTime]
  );

  /** ====== 파일 관련 ====== */
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

  const handleRemoveNewFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleKeepExistingFile = useCallback((fileId: number) => {
    setKeepFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  /** 기존 파일 다운로드 (s3Key 가 URL 이라고 가정) */
  const handleDownloadExistingFile = useCallback(
    (file: { id: number; name: string; s3Key: string }) => {
      if (!file.s3Key) return;
      window.open(file.s3Key, "_blank");
    },
    []
  );

  /** ====== 수정 요청 ====== */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!scheduleId || Number.isNaN(scheduleId)) return;
    if (!validate()) return;

    const requestBody: ScheduleUpdateRequest = {
      title: title.trim(),
      content: memo.trim(),
      startScheduleDate: startDate,
      endScheduleDate: endDate,
      startTime,
      endTime,
      scheduleType,
      productName,
      customerName,
      bzName: companyName,
      address: locationText,
      keepFileIds,
    };

    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(requestBody)], {
        type: "application/json",
      })
    );

    files.forEach((file) => {
      // 서버가 받는 필드명이 "file" 이라고 들었어서 그대로 사용
      formData.append("file", file);
    });

    try {
      setSubmitting(true);
      await api.patch(`/api/v1/schedule/${scheduleId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("공유 일정이 수정되었습니다.");
      nav(-1);
    } catch (e) {
      console.error("[SharedScheduleEdit] update error:", e);
      alert("일정 수정 중 오류가 발생했습니다. 입력값을 확인해 주세요.");
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
    scheduleType,
    productName,
    customerName,
    companyName,
    locationText,
    keepFileIds,
    files,
    nav,
  ]);

  return (
    <div className="w-full bg-[#F4F6FB]">
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col relative">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="공유 일정 수정"
            onBack={onBack}
            showMenu={false}
          />
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center text-[14px] text-[#9CA3AF]">
              일정 정보를 불러오는 중입니다...
            </div>
          ) : (
            <div className="px-5 pt-18 pb-6">
              {/* 제목 */}
              <div className="mt-4 mb-6 flex items-center gap-3">
                <div className="w-1 h-8 rounded-[3px] bg-[#FF2233]" />
                <input
                  className="flex-1 bg-transparent outline-none text-[20px] font-semibold leading-[32px] tracking-[-0.2px] placeholder:text-[#D9D9D9] text-[#1E2124]"
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              {errors.title && (
                <p className="mb-3 text-[12px] text-[#EB5147]">
                  {errors.title}
                </p>
              )}

              {/* 업체명 / 고객명 */}
              <div className="space-y-3 mb-6">
                <div className="w-[350px] h-[58px] bg-[#F6F7FB] rounded-[12px] px-4 py-2 flex flex-col justify-between">
                  <span className="text-[12px] leading-[18px] text-[#000000]">
                    업체명
                  </span>
                  <input
                    className="w-full bg-transparent outline-none text-[14px] leading-[21px] text-[#111827] placeholder:text-[#C4C4C4]"
                    placeholder="업체명을 입력하세요"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="w-[350px] h-[58px] bg-[#F6F7FB] rounded-[12px] px-4 py-2 flex flex-col justify-between">
                  <span className="text-[12px] leading-[18px] text-[#000000]">
                    고객명
                  </span>
                  <input
                    className="w-full bg-transparent outline-none text-[14px] leading-[21px] text-[#111827] placeholder:text-[#C4C4C4]"
                    placeholder="고객명을 입력하세요"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              {/* 날짜 */}
              <div className="mt-2">
                <div className="flex items-center gap-4 mb-2">
                  <Icon
                    icon="ant-design:calendar-outlined"
                    className="w-5 h-5 text-[#333333]"
                  />
                  <div className="flex items-center gap-4">
                    <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      {startDateLabel}
                    </span>
                    <span className="text-[16px] text-[#1E2124]">{" > "}</span>
                    <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      {endDateLabel}
                    </span>
                  </div>
                </div>

                <div className="ml-9 flex flex-col gap-2">
                  <div className="w-[260px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center px-4">
                    <input
                      type="date"
                      className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="w-[260px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center px-4">
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

              {/* 시간 */}
              <div className="mt-6">
                <div className="flex items-center gap-4">
                  <Icon icon="prime:clock" className="w-5 h-5 text-[#333333]" />
                  <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                    {startTimeLabel} {" > "} {endTimeLabel}
                  </span>
                </div>

                <p className="mt-1 ml-9 text-[12px] text-[#9CA3AF]">
                  {timeDateHint}
                </p>

                <div className="mt-3 ml-9 flex items-center gap-3">
                  {/* 시작 시간 */}
                  <button
                    type="button"
                    className="relative w-[150px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center justify-between px-4"
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
                    className="relative w-[150px] h-[44px] rounded-[14px] bg-white border border-[#E5E7EB] flex items-center justify-between px-4"
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

              {/* 위치 */}
              <div className="mt-6">
                <div className="flex items-start gap-4 mb-2">
                  <Icon
                    icon="solar:map-linear"
                    className="w-5 h-5 text-[#333333]"
                  />
                  <span className="text-[12px] text-[#999999] leading-[18px]">
                    위치
                  </span>
                </div>

                <div className="ml-9 w-full max-w-[310px]">
                  <textarea
                    className="w-full h-[56px] bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-3 text-[13px] leading-[20px] resize-none outline-none text-[#111827] placeholder:text-[#C4C4C4]"
                    placeholder="업체 상호 / 주소 등을 입력해 주세요"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                  />
                </div>
              </div>

              {/* 메모 */}
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-2">
                  <Icon
                    icon="ph:note-duotone"
                    className="w-5 h-5 text-[#333333]"
                  />
                  <span className="text-[12px] text-[#999999] leading-[18px]">
                    메모
                  </span>
                </div>

                <div className="ml-9 w-full max-w-[310px]">
                  <textarea
                    className="w-full h-[96px] bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-3 resize-none outline-none text-[14px] text-[#1E2124] placeholder:text-[#C4C4C4]"
                    placeholder="메모를 입력해 주세요"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>
              </div>

              {/* 파일 첨부 */}
              <div className="mt-6 mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <Icon icon="f7:link" className="w-5 h-5 text-[#333333]" />
                  <span className="text-[12px] text-[#999999] leading-[18px]">
                    파일 첨부
                  </span>
                </div>

                <div className="ml-9 w-[310px] max-w-full space-y-3">
                  {/* 기존 파일 목록 */}
                  {existingFiles.length > 0 && (
                    <div className="space-y-2">
                      {existingFiles.map((file) => {
                        const kept = keepFileIds.includes(file.id);
                        return (
                          <div
                            key={file.id}
                            className="w-full h-[40px] bg-white border border-[#E5E7EB] rounded-[12px] px-4 flex items-center justify-between"
                          >
                            <button
                              type="button"
                              onClick={() => handleDownloadExistingFile(file)}
                              className="flex-1 text-left text-[13px] text-[#111827] truncate underline-offset-2 hover:underline"
                            >
                              {file.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleKeepExistingFile(file.id)}
                              className={`ml-3 w-7 h-7 rounded-full border flex items-center justify-center ${
                                kept
                                  ? "bg-[#FF2233] border-[#FF2233]"
                                  : "bg-white border-[#E5E7EB]"
                              }`}
                            >
                              <span className="text-[10px] text-white">
                                {kept ? "ON" : ""}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 새 파일 추가 */}
                  <label className="inline-flex items-center justify-center px-4 h-[40px] rounded-[12px] bg-white border border-dashed border-[#E5E7EB] text-[13px] text-[#4B5563] cursor-pointer">
                    <span>파일 추가</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFilesChange}
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="mt-2 space-y-2">
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
                            onClick={() => handleRemoveNewFile(index)}
                            className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-[#E5E7EB]"
                          >
                            <Icon
                              icon="mynaui:close"
                              className="w-3 h-3 text-[#6B7280]"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 저장 버튼 */}
        <div className="px-5 pb-18 pt-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting || loading}
            className={[
              "w-[350px] h-[56px] mx-auto rounded-[12px] flex items-center justify-center",
              "text-[16px] font-semibold tracking-[-0.2px]",
              isValid && !submitting && !loading
                ? "bg-[#FF2233] text-white active:scale-95"
                : "bg-[#F6F6F6] text-[#ADB3B6]",
            ].join(" ")}
          >
            {submitting ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
