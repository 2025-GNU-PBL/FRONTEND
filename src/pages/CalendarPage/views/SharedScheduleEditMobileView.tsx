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

/** ====== 단건 조회 응답 DTO (GET /api/v1/schedule/{id}) ====== */
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
  bzName: string;
  address: string;
  scheduleFiles: {
    id: number;
    name: string;
    s3Key: string;
  }[];
};

/** ====== 수정 요청 DTO (request.request) ====== */
type ScheduleUpdateRequest = {
  title: string;
  content: string;
  startScheduleDate: string; // yyyy-MM-dd
  endScheduleDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  keepFileIds: number[]; // 유지할 기존 파일 id
};

export default function SharedScheduleCreateMobileView() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const scheduleId = id ? Number(id) : NaN;

  const onBack = useCallback(() => nav(-1), [nav]);

  /** 기본 값: 오늘 날짜, 11:00 ~ 13:00 */
  const today = useMemo(() => new Date(), []);
  const defaultDate = useMemo(() => toDateInput(today), [today]);

  /** 폼 상태 */
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState(""); // bzName
  const [customerName, setCustomerName] = useState(""); // productName
  const [locationText, setLocationText] = useState(""); // address

  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [memo, setMemo] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [keepFileIds, setKeepFileIds] = useState<number[]>([]); // 기존 파일 id 목록

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  /** ====== id가 있으면 단건 조회해서 폼 초기값 세팅 ====== */
  useEffect(() => {
    if (!scheduleId || Number.isNaN(scheduleId)) {
      return;
    }

    const normalizeDate = (d?: string) =>
      d && d.length >= 10 ? d.slice(0, 10) : defaultDate;

    const normalizeTime = (t?: string, fallback: string) => {
      if (!t) return fallback;
      return t.slice(0, 5); // "HH:mm"만 사용
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
        setCustomerName(data.productName ?? "");
        setLocationText(data.address ?? "");

        setStartDate(normalizeDate(data.startScheduleDate));
        setEndDate(normalizeDate(data.endScheduleDate));

        setStartTime(normalizeTime(data.startTime, "11:00"));
        setEndTime(normalizeTime(data.endTime, "13:00"));

        // 기존 파일 유지용 id 저장
        const ids = (data.scheduleFiles || []).map((f) => f.id);
        setKeepFileIds(ids);
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
      } else if (sd.getTime() !== ed.getTime()) {
        next.endDate = "현재는 하루 단위 일정만 수정할 수 있어요.";
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
    return sd <= ed && sd.getTime() === ed.getTime();
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

  /** 파일 삭제 (현재는 새로 업로드한 파일만 삭제, 기존 파일은 keepFileIds 그대로 유지) */
  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** 수정 버튼 */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!scheduleId || Number.isNaN(scheduleId)) return;
    if (!validate()) return;

    // content 에 부가 정보들을 합쳐서 넣음
    const contentLines = [
      companyName && `업체명: ${companyName}`,
      customerName && `고객명: ${customerName}`,
      locationText && `위치: ${locationText}`,
      sameDay
        ? `시간: ${startTime} ~ ${endTime} (${startDate})`
        : `시간: ${startTime} ~ ${endTime} (${startDate} ~ ${endDate})`,
      memo && `메모: ${memo}`,
    ].filter(Boolean);

    const requestBody: ScheduleUpdateRequest = {
      title: title.trim(),
      content: contentLines.join("\n"),
      startScheduleDate: startDate,
      endScheduleDate: endDate,
      startTime,
      endTime,
      keepFileIds, // 기존 파일 유지
    };

    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(requestBody)], {
        type: "application/json",
      })
    );

    // 새로 첨부한 파일
    files.forEach((file) => {
      formData.append("file", file);
    });

    try {
      setSubmitting(true);
      // PATCH /api/v1/schedule/{id}
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
    companyName,
    customerName,
    locationText,
    memo,
    sameDay,
    startTime,
    endTime,
    startDate,
    endDate,
    keepFileIds,
    files,
    nav,
  ]);

  return (
    <div className="w-full bg-[#F4F6FB]">
      {/* 390 × 844 고정 프레임 */}
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col relative">
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader
            title="공유 일정 수정"
            onBack={onBack}
            showMenu={false}
          />
        </div>

        {/* 콘텐츠 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center text-[14px] text-[#9CA3AF]">
              일정 정보를 불러오는 중입니다...
            </div>
          ) : (
            <div className="px-5 pt-18 pb-6">
              {/* 제목 입력 */}
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
                    className="w-full bg-transparent outline-none text-[14px] leading-[21px] text-[#949494] placeholder:text-[#C4C4C4]"
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
                    className="w-full bg-transparent outline-none text-[14px] leading-[21px] text-[#949494] placeholder:text-[#C4C4C4]"
                    placeholder="고객명을 입력하세요"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              {/* 날짜 선택 */}
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
                    <span className="text-[16px] text-[#1E2124]">{">"}</span>
                    <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      {endDateLabel}
                    </span>
                  </div>
                </div>

                <div className="ml-9 flex flex-col gap-2">
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

              {/* 시간 선택 */}
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

              {/* 위치 */}
              <div className="mt-6">
                <div className="flex items-start gap-4 mb-2">
                  <Icon
                    icon="solar:map-linear"
                    className="w-5 h-5 text-[#333333]"
                  />
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#999999] leading-[18px]">
                      위치
                    </span>
                  </div>
                </div>

                <div className="ml-9 w-full max-w-[310px]">
                  <textarea
                    className="w-full h-[56px] bg-transparent border border-[#E5E7EB] rounded-[12px] px-4 py-3 text-[13px] leading-[20px] resize-none outline-none text-[#111827] placeholder:text-[#C4C4C4]"
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

                <div className="ml-9 w-full max-w-[310px] bg-[#F6F7FB] rounded-[12px] px-4 py-3">
                  <textarea
                    className="w-full h-[96px] bg-transparent resize-none outline-none text-[14px] text-[#1E2124] placeholder:text-[#C4C4C4]"
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

                <div className="ml-9 w-[310px] max-w-full">
                  <label className="inline-flex items-center justify-center px-4 h-[40px] rounded-[12px] bg-[#F6F7FB] border border-dashed border-[#E5E7EB] text-[13px] text-[#4B5563] cursor-pointer">
                    <span>파일 추가</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFilesChange}
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="w-full h-[40px] bg-[#F6F7FB] rounded-[12px] px-4 flex items-center justify-between"
                        >
                          <span className="text-[13px] text-[#111827] truncate">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
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

        {/* 하단 수정 버튼 */}
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
            {submitting ? "수정 중..." : "수정하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
