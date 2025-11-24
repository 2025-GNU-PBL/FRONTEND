import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../components/MyPageHeader";
import api from "../../../lib/api/axios";

/** ====== 서버 응답 DTO ====== */
type ScheduleApiItem = {
  id: number;
  title: string;
  content: string;
  startScheduleDate: string; // "2025-11-21"
  endScheduleDate: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  scheduleType?: "PERSONAL" | "SHARED" | string;
};

/** 날짜 → key (YYYY-MM-DD) */
function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "YYYY-MM-DD" → Date */
function parseYmdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** 시작~끝 날짜 범위 key 배열 */
function buildDateRangeKeys(startYmd: string, endYmd?: string): string[] {
  const result: string[] = [];
  const start = parseYmdToDate(startYmd);
  const end = endYmd ? parseYmdToDate(endYmd) : parseYmdToDate(startYmd);

  const cur = new Date(start.getTime());
  while (cur.getTime() <= end.getTime()) {
    result.push(formatDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

/** 선택된 날짜 텍스트 */
function formatKoreanDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}

/** 월 텍스트: 4월 */
function formatKoreanMonth(year: number, monthIndex: number): string {
  return `${monthIndex + 1}월`;
}

/** 같은 날 비교 */
function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 시간 텍스트: 11:00AM */
function formatTimeText(time: string): string | null {
  if (!time) return null;

  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");

  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");

  return `${hour12}:${mm}${ampm}`;
}

/** 한 달 캘린더용 날짜 배열 (6주) */
type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

function buildCalendarMatrix(year: number, monthIndex: number): CalendarCell[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const weekdayOfFirst = (firstOfMonth.getDay() + 6) % 7; // 월=0

  const startDate = new Date(year, monthIndex, 1 - weekdayOfFirst);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push({
      date: d,
      isCurrentMonth: d.getMonth() === monthIndex,
    });
  }
  return cells;
}

/** 공유/개인에 따른 리스트용 색상
 *  - SHARED: 빨강
 *  - 그 외(개인): 파랑
 */
function getScheduleColor(type?: string) {
  if (type === "SHARED") {
    return {
      barClass: "bg-[#FF2233]", // 공유 일정: 빨간색
    };
  }
  return {
    barClass: "bg-[#4F46E5]", // 개인 일정: 파란색
  };
}

/** 달력 셀 막대 색상
 *  - SHARED: 빨강
 *  - 그 외(개인): 파랑
 */
function getCellBarColor(type?: string): string {
  if (type === "SHARED") return "#FF2233"; // 공유 일정 빨강
  return "#4F46E5"; // 개인 일정 파랑
}

/** 주 단위 연속막대 정보 */
type WeekBar = {
  scheduleId: number;
  colStart: number; // 0 ~ 6
  colEnd: number; // 0 ~ 6
  color: string;
};

export default function CalendarMobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  /** accessor param */
  const accessorParam = useMemo(() => {
    try {
      const raw = localStorage.getItem("accessor");
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  /** 날짜별 일정 */
  const [scheduleByDate, setScheduleByDate] = useState<
    Record<string, ScheduleApiItem[]>
  >({});

  /** 주별 연속 막대 */
  const [weekBars, setWeekBars] = useState<WeekBar[][]>(() =>
    Array.from({ length: 6 }, () => [])
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [swipedScheduleId, setSwipedScheduleId] = useState<number | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  const calendarCells = useMemo(
    () => buildCalendarMatrix(currentYear, currentMonthIndex),
    [currentYear, currentMonthIndex]
  );

  /** ====== 월별 일정 조회 ====== */
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, any> = {
          year: currentYear,
          month: currentMonthIndex + 1,
        };
        if (accessorParam) params.accessor = accessorParam;

        const { data } = await api.get<ScheduleApiItem[]>("/api/v1/schedule", {
          params,
        });

        /** 날짜별 그룹핑 */
        const grouped: Record<string, ScheduleApiItem[]> = {};
        (data || []).forEach((item) => {
          const start = (item.startScheduleDate || "").slice(0, 10);
          const end = (item.endScheduleDate || "").slice(0, 10) || start;
          const dateKeys = buildDateRangeKeys(start, end);

          dateKeys.forEach((key) => {
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
          });
        });
        setScheduleByDate(grouped);

        /** 연속 일정용 주별 막대 계산 */
        const dateIndexMap: Record<string, number> = {};
        calendarCells.forEach((cell, idx) => {
          const key = formatDateKey(cell.date);
          dateIndexMap[key] = idx;
        });

        const newWeekBars: WeekBar[][] = Array.from({ length: 6 }, () => []);

        (data || []).forEach((item) => {
          const start = (item.startScheduleDate || "").slice(0, 10);
          const end = (item.endScheduleDate || "").slice(0, 10) || start;
          const dateKeys = buildDateRangeKeys(start, end);

          const indices: number[] = [];
          dateKeys.forEach((key) => {
            const idx = dateIndexMap[key];
            if (idx !== undefined) indices.push(idx);
          });
          if (indices.length === 0) return;

          const firstIdx = Math.min(...indices);
          const lastIdx = Math.max(...indices);
          const color = getCellBarColor(item.scheduleType);

          for (let row = 0; row < 6; row += 1) {
            const rowStart = row * 7;
            const rowEnd = rowStart + 6;
            const overlapStart = Math.max(firstIdx, rowStart);
            const overlapEnd = Math.min(lastIdx, rowEnd);
            if (overlapStart <= overlapEnd) {
              newWeekBars[row].push({
                scheduleId: item.id,
                colStart: overlapStart - rowStart,
                colEnd: overlapEnd - rowStart,
                color,
              });
            }
          }
        });

        setWeekBars(newWeekBars);

        /** 선택 날짜 월 보정 */
        if (
          !selectedDate ||
          selectedDate.getFullYear() !== currentYear ||
          selectedDate.getMonth() !== currentMonthIndex
        ) {
          setSelectedDate(new Date(currentYear, currentMonthIndex, 1));
        }

        setSwipedScheduleId(null);
      } catch (e) {
        console.error("[Schedule/CalendarMobileView] fetchSchedules error:", e);
        setError("일정 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonthIndex, accessorParam, calendarCells]);

  /** 이전/다음 달 */
  const goPrevMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m - 1, 1);
    });
    setSwipedScheduleId(null);
  }, []);

  const goNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m + 1, 1);
    });
    setSwipedScheduleId(null);
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setSwipedScheduleId(null);
  }, []);

  const handleAddSchedule = useCallback(() => {
    setSwipedScheduleId(null);
    nav("/calendar/personal");
  }, [nav]);

  const handleClickSchedule = useCallback(
    (item: ScheduleApiItem) => {
      if (item.scheduleType === "SHARED") {
        nav(`/my-page/calendar/shared/${item.id}`);
      } else {
        nav(`/calendar/personal/edit/${item.id}`);
      }
    },
    [nav]
  );

  const handleDeleteSchedule = useCallback(async (item: ScheduleApiItem) => {
    if (!window.confirm("해당 일정을 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/api/v1/schedule/${item.id}`);

      setScheduleByDate((prev) => {
        const next: Record<string, ScheduleApiItem[]> = {};
        Object.entries(prev).forEach(([key, list]) => {
          const filtered = list.filter((s) => s.id !== item.id);
          if (filtered.length > 0) next[key] = filtered;
        });
        return next;
      });

      setSwipedScheduleId(null);
    } catch (e) {
      console.error("[Schedule/CalendarMobileView] deleteSchedule error:", e);
      setError("일정 삭제 중 오류가 발생했습니다.");
    }
  }, []);

  /** 카드 클릭 → 슬라이더 / 수정 이동 */
  const handleSchedulePress = useCallback(
    (item: ScheduleApiItem) => {
      if (swipedScheduleId === item.id) {
        handleClickSchedule(item);
      } else {
        setSwipedScheduleId(item.id);
      }
    },
    [swipedScheduleId, handleClickSchedule]
  );

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedSchedules: ScheduleApiItem[] =
    scheduleByDate[selectedDateKey] || [];

  const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col relative">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-white">
          <MyPageHeader title="캘린더" onBack={onBack} showMenu={false} />
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-4 pb-10">
            {/* 월 제목 + 좌우 이동 */}
            <div className="flex items-center justify-center mb-4 mt-4">
              <button type="button" className="p-2 -ml-2" onClick={goPrevMonth}>
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="w-5 h-5 text-[#1E2124]"
                />
              </button>
              <div className="mx-4 text-[18px] font-medium leading-[27px] tracking-[-0.2px] text-[#1E2124]">
                {formatKoreanMonth(currentYear, currentMonthIndex)}
              </div>
              <button type="button" className="p-2 -mr-2" onClick={goNextMonth}>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="w-5 h-5 text-[#1E2124]"
                />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="w-[350px] mx-auto flex flex-row justify-between mb-1">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="w-[50px] h-[45.67px] flex items-center justify-center"
                >
                  <span className="text-[15px] leading-[24px] tracking-[-0.22px] text-[#626262]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* 캘린더 (날짜 + 연속 막대) */}
            <div className="w-[350px] mx-auto">
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="relative w-full h-[62px] mb-[4px]"
                >
                  {/* 연속 일정 막대 (얇은 선) */}
                  {weekBars[rowIndex] &&
                    weekBars[rowIndex].map((bar, idx) => (
                      <div
                        key={`${bar.scheduleId}-${idx}`}
                        className="absolute h-[3px] rounded-full"
                        style={{
                          left: `${(bar.colStart / 7) * 100}%`,
                          width: `${
                            ((bar.colEnd - bar.colStart + 1) / 7) * 100
                          }%`,
                          top: 38 + idx * 5, // 날짜 아래 얇게
                          backgroundColor: bar.color,
                          opacity: 0.8,
                        }}
                      />
                    ))}

                  {/* 날짜 버튼들 */}
                  <div className="relative flex flex-row justify-between h-full">
                    {calendarCells
                      .slice(rowIndex * 7, rowIndex * 7 + 7)
                      .map((cell) => {
                        const { date, isCurrentMonth } = cell;
                        const isSelected = isSameDate(date, selectedDate);
                        const isToday = isSameDate(date, new Date());

                        const baseTextClass =
                          "text-[15px] leading-[24px] tracking-[-0.22px]";
                        const textColor = isCurrentMonth
                          ? "text-[#1E2124]"
                          : "text-[#C5C5C5]";

                        const key = formatDateKey(date);

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectDate(date)}
                            className="w-[50px] h-full flex items-start justify-center pt-[6px]"
                          >
                            <div className="flex flex-col items-center">
                              {/* 날짜 숫자 */}
                              {isSelected ? (
                                <div className="w-[32px] h-[32px] rounded-full bg-[#FF2233] flex items-center justify-center">
                                  <span
                                    className={`${baseTextClass} text-white font-medium`}
                                  >
                                    {date.getDate()}
                                  </span>
                                </div>
                              ) : (
                                <span
                                  className={`${baseTextClass} ${textColor} ${
                                    isToday ? "font-semibold" : "font-normal"
                                  }`}
                                >
                                  {date.getDate()}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            {/* 로딩/에러 */}
            {loading && (
              <div className="mt-8 mb-4 w-full flex items-center justify-center text-[14px] text-[#999999]">
                일정 목록을 불러오는 중입니다...
              </div>
            )}
            {!loading && error && (
              <div className="mt-8 mb-4 w-full flex items-center justify-center text-[14px] text-[#EB5147] text-center whitespace-pre-line">
                {error}
              </div>
            )}

            {/* 선택된 날짜 텍스트 */}
            <div className="mt-6 mb-3">
              <span className="text-[20px] font-semibold leading-[32px] tracking-[-0.2px] text-[#1E2124]">
                {formatKoreanDate(selectedDate)}
              </span>
            </div>

            {/* 선택 날짜 일정 카드들 */}
            {!loading && !error && (
              <>
                {selectedSchedules.length === 0 ? (
                  <div className="mt-2 mb-4 text-[14px] leading-[21px] text-[#B0B0B0]">
                    등록된 일정이 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedSchedules.map((item) => {
                      const timeText = formatTimeText(item.startTime);
                      const hasTime = !!timeText;
                      const { barClass } = getScheduleColor(item.scheduleType);
                      const isSwiped = swipedScheduleId === item.id;

                      return (
                        <div
                          key={item.id}
                          className="relative w-[350px] min-h-[52px] overflow-hidden rounded-[12px]"
                        >
                          {/* 뒤: 삭제 버튼 영역*/}
                          <div className="absolute inset-y-0 right-0 flex items-stretch">
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(item)}
                              className="w-[84px] flex items-center justify-center bg-[#F6F7FB] active:opacity-90"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Icon
                                  icon="solar:trash-bin-minimalistic-bold"
                                  className="w-5 h-5 text-[#FF2233]"
                                />
                              </div>
                            </button>
                          </div>

                          {/* 앞: 일정 카드 (슬라이드) */}
                          <button
                            type="button"
                            onClick={() => handleSchedulePress(item)}
                            className="w-full bg-[#F6F7FB] px-4 py-[11px] flex items-center justify-between active:scale-[0.99] transition-transform"
                            style={{
                              transform: isSwiped
                                ? "translateX(-84px)"
                                : "translateX(0px)",
                              transition: "transform 0.18s ease-out",
                            }}
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* 시간 */}
                              <div className="w-[70px] shrink-0">
                                {hasTime && (
                                  <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                                    {timeText}
                                  </span>
                                )}
                              </div>

                              {/* 세로 바 + 제목 */}
                              <div className="flex items-center gap-[9.6px] flex-1 min-w-0">
                                <div
                                  className={`w-[3.2px] h-[25.6px] rounded-[2.4px] ${barClass}`}
                                />
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="text-[14px] font-semibold leading-[22px] tracking-[-0.16px] text-[#1E2124] truncate">
                                    {item.title}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 일정 추가하기 카드 */}
                <button
                  type="button"
                  onClick={handleAddSchedule}
                  className="mt-3 mb-10 w-[350px] h-[52px] bg-[#F6F7FB] rounded-[12px] px-4 flex items-center"
                >
                  <div className="w-6 h-6 flex items-center justify-center mr-3">
                    <Icon
                      icon="mynaui:plus"
                      className="w-6 h-6 text-[#1E2124]"
                    />
                  </div>
                  <span className="text-[14px] font-semibold leading-[22px] tracking-[-0.16px] text-[#1E2124]">
                    일정 추가하기
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
