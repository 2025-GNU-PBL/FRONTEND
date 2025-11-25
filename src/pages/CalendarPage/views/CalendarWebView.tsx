// === 아래 전체 파일 그대로 사용 ===

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../src/lib/api/axios";

/** ====== 서버 응답 DTO ====== */
type ScheduleApiItem = {
  id: number;
  title: string;
  content: string;
  startScheduleDate: string;
  endScheduleDate: string;
  startTime: string;
  endTime: string;
  scheduleType?: "PERSONAL" | "SHARED" | string;
};

/** 날짜 → key */
function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 문자열 → Date */
function parseYmdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** 연속 날짜 생성 */
function buildDateRangeKeys(startYmd: string, endYmd?: string): string[] {
  const result: string[] = [];
  const start = parseYmdToDate(startYmd);
  const end = endYmd ? parseYmdToDate(endYmd) : start;

  const cur = new Date(start.getTime());
  while (cur.getTime() <= end.getTime()) {
    result.push(formatDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function formatKoreanDate(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatKoreanMonth(y: number, m: number): string {
  return `${m + 1}월`;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTimeText(time: string): string | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  if (isNaN(h) || isNaN(m)) return null;

  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")}${ampm}`;
}

/** 캘린더 6주 생성 */
type CalendarCell = { date: Date; isCurrentMonth: boolean };

function buildCalendarMatrix(y: number, m: number): CalendarCell[] {
  const first = new Date(y, m, 1);
  const weekday = (first.getDay() + 6) % 7;

  const startDate = new Date(y, m, 1 - weekday);

  const list: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    list.push({ date: d, isCurrentMonth: d.getMonth() === m });
  }
  return list;
}

/** 색상 */
function getSchedulePalette(type?: string) {
  if (type === "SHARED") {
    return {
      accent: "#FFB4B4",
      bg: "#FFE3E3",
      text: "#D64545",
    };
  }
  return {
    accent: "#C9C6FF",
    bg: "#E9E8FF",
    text: "#4C3FE3",
  };
}

/** 주간 이벤트 스타일 */
type WeekEventSegment = {
  schedule: ScheduleApiItem;
  colStart: number;
  colEnd: number;
  lane: number;
  accent: string;
  bg: string;
  textColor: string;
};

export default function CalendarWebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const accessorParam = useMemo(() => {
    try {
      const raw = localStorage.getItem("accessor");
      if (!raw) return undefined;
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }, []);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [swipedScheduleId, setSwipedScheduleId] = useState<number | null>(null);

  const [scheduleByDate, setScheduleByDate] = useState<
    Record<string, ScheduleApiItem[]>
  >({});

  const [weekSegments, setWeekSegments] = useState<WeekEventSegment[][]>(() =>
    Array.from({ length: 6 }, () => [])
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curY = currentDate.getFullYear();
  const curM = currentDate.getMonth();

  const calendarCells = useMemo(
    () => buildCalendarMatrix(curY, curM),
    [curY, curM]
  );

  /** ================= 일정 조회 ================= */
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = { year: curY, month: curM + 1 };
        if (accessorParam) params.accessor = accessorParam;

        const { data } = await api.get("/api/v1/schedule", { params });
        const schedules: ScheduleApiItem[] = data || [];

        /** 날짜별 그룹 */
        const grouped: Record<string, ScheduleApiItem[]> = {};
        schedules.forEach((item) => {
          const start = item.startScheduleDate.slice(0, 10);
          const end = (item.endScheduleDate || start).slice(0, 10);
          buildDateRangeKeys(start, end).forEach((key) => {
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
          });
        });
        setScheduleByDate(grouped);

        /** 주별 세그먼트 */
        const indexMap: Record<string, number> = {};
        calendarCells.forEach((c, i) => (indexMap[formatDateKey(c.date)] = i));

        const weekSegs: WeekEventSegment[][] = Array.from(
          { length: 6 },
          () => []
        );

        schedules.forEach((schedule) => {
          const start = schedule.startScheduleDate.slice(0, 10);
          const end = (schedule.endScheduleDate || start).slice(0, 10);

          const keys = buildDateRangeKeys(start, end);
          const indexes = keys
            .map((k) => indexMap[k])
            .filter((v) => v !== undefined);

          if (indexes.length === 0) return;

          const first = Math.min(...indexes);
          const last = Math.max(...indexes);

          const { accent, bg, text } = getSchedulePalette(
            schedule.scheduleType
          );

          for (let row = 0; row < 6; row++) {
            const rowStart = row * 7;
            const rowEnd = rowStart + 6;

            const s = Math.max(first, rowStart);
            const e = Math.min(last, rowEnd);

            if (s <= e) {
              weekSegs[row].push({
                schedule,
                colStart: s - rowStart,
                colEnd: e - rowStart,
                lane: 0,
                accent,
                bg,
                textColor: text,
              });
            }
          }
        });

        /** lane 계산 */
        for (let row = 0; row < 6; row++) {
          const segs = weekSegs[row];
          const laneEnds: number[] = [];

          segs.sort((a, b) => a.colStart - b.colStart);

          segs.forEach((seg) => {
            let lane = 0;
            while (lane < laneEnds.length && laneEnds[lane] >= seg.colStart) {
              lane++;
            }
            laneEnds[lane] = seg.colEnd;
            seg.lane = lane;
          });
        }

        setWeekSegments(weekSegs);

        /** 선택 날짜 보정 */
        if (
          selectedDate.getFullYear() !== curY ||
          selectedDate.getMonth() !== curM
        ) {
          setSelectedDate(new Date(curY, curM, 1));
        }

        setSwipedScheduleId(null);
      } catch (e) {
        console.error(e);
        setError("일정 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [curY, curM, accessorParam, calendarCells, selectedDate]);

  /** ================= 삭제 ================= */
  const handleDeleteSchedule = async (item: ScheduleApiItem) => {
    if (!window.confirm("해당 일정을 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/api/v1/schedule/${item.id}`);

      setScheduleByDate((prev) => {
        const next: any = {};
        Object.entries(prev).forEach(([key, list]) => {
          const filtered = list.filter((x) => x.id !== item.id);
          if (filtered.length) next[key] = filtered;
        });
        return next;
      });

      setSwipedScheduleId(null);
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  /** ================= 슬라이드 ================= */
  const handlePressCard = (item: ScheduleApiItem) => {
    if (swipedScheduleId === item.id) {
      if (item.scheduleType === "SHARED") nav(`/calendar/shared/${item.id}`);
      else nav(`/calendar/personal/${item.id}`);
    } else {
      setSwipedScheduleId(item.id);
    }
  };

  const selectedKey = formatDateKey(selectedDate);
  const selectedSchedules = scheduleByDate[selectedKey] || [];

  const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="w-full min-h-screen bg-white mt-17">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* ================== 상단 타이틀 ================== */}
        <div className="mb-5">
          <h1 className="text-[22px] font-semibold text-[#111827]">
            월간 일정 한눈에 보기
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            한 달 일정과 예약을 확인하고 날짜를 눌러 관리하세요.
          </p>
        </div>

        {/* ================== 1. 달력 ================== */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-8 pt-6 pb-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() =>
                setCurrentDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                )
              }
              className="p-2 rounded-full hover:bg-[#F3F4F6]"
            >
              <Icon icon="solar:alt-arrow-left-linear" className="w-5 h-5" />
            </button>

            <div className="text-[18px] font-semibold">
              {curY}년 {formatKoreanMonth(curY, curM)}
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                )
              }
              className="p-2 rounded-full hover:bg-[#F3F4F6]"
            >
              <Icon icon="solar:alt-arrow-right-linear" className="w-5 h-5" />
            </button>
          </div>

          {/* 요일 */}
          <div className="grid grid-cols-7 text-center text-[13px] text-[#6B7280] mb-2">
            {weekdayLabels.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="border-t border-[#F3F4F6]" />

          {Array.from({ length: 6 }).map((_, row) => {
            const segs = weekSegments[row] || [];
            const laneCount = segs.length
              ? Math.max(...segs.map((s) => s.lane)) + 1
              : 0;

            const rowHeight = 76 + laneCount * 18;

            return (
              <div
                key={row}
                className="relative border-b border-[#F3F4F6]"
                style={{ height: rowHeight }}
              >
                {/* 날짜 */}
                <div className="grid grid-cols-7 h-[32px] px-[2px] pt-[6px]">
                  {calendarCells.slice(row * 7, row * 7 + 7).map((cell) => {
                    const { date, isCurrentMonth } = cell;

                    const isSel = isSameDate(date, selectedDate);
                    const isToday = isSameDate(date, new Date());

                    return (
                      <button
                        key={formatDateKey(date)}
                        onClick={() => {
                          setSelectedDate(date);
                          setSwipedScheduleId(null);
                        }}
                        className="flex flex-col items-start px-[4px]"
                      >
                        {isSel ? (
                          <div className="w-[26px] h-[26px] rounded-full bg-[#FF2233] text-white flex items-center justify-center text-[13px] font-semibold">
                            {date.getDate()}
                          </div>
                        ) : (
                          <span
                            className={`text-[13px] ${
                              isCurrentMonth
                                ? "text-[#111827]"
                                : "text-[#D1D5DB]"
                            } ${isToday ? "font-semibold" : ""}`}
                          >
                            {date.getDate()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 연속 일정 막대 */}
                {segs.map((seg, idx) => {
                  const left = (seg.colStart / 7) * 100;
                  const width = ((seg.colEnd - seg.colStart + 1) / 7) * 100;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSwipedScheduleId(null);
                        if (seg.schedule.scheduleType === "SHARED")
                          nav(`/calendar/shared/${seg.schedule.id}`);
                        else nav(`/calendar/personal/${seg.schedule.id}`);
                      }}
                      className="absolute flex items-center overflow-hidden text-left"
                      style={{
                        top: 36 + seg.lane * 18,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: "14px",
                        backgroundColor: seg.bg,
                        borderRadius: "4px",
                        padding: "0 6px",
                      }}
                    >
                      <span
                        className="text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: seg.textColor }}
                      >
                        {seg.schedule.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ================== 2. 일정 목록 (슬라이드 적용) ================== */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] text-[#6B7280]">선택한 날짜</p>
              <p className="text-[20px] font-semibold text-[#111827] mt-1">
                {formatKoreanDate(selectedDate)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => nav("/calendar/personal")}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#F3F4F6] text-[13px] font-semibold hover:bg-[#E5E7EB]"
            >
              <Icon icon="mynaui:plus" className="w-4 h-4" />
              일정 추가하기
            </button>
          </div>

          {loading && (
            <div className="py-8 text-center text-[#9CA3AF]">
              일정 목록을 불러오는 중입니다...
            </div>
          )}

          {!loading && error && (
            <div className="py-8 text-center text-[#EB5147] whitespace-pre-line">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {selectedSchedules.length === 0 ? (
                <div className="py-6 text-[#9CA3AF] text-[14px]">
                  등록된 일정이 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedSchedules.map((item) => {
                    const timeText = formatTimeText(item.startTime);
                    const hasTime = !!timeText;
                    const { accent } = getSchedulePalette(item.scheduleType);
                    const isSwiped = swipedScheduleId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="relative w-full h-[56px] overflow-hidden rounded-xl"
                      >
                        {/* 뒤: 삭제 버튼 */}
                        <div className="absolute inset-y-0 right-0 flex items-center bg-[#F9FAFB]">
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(item)}
                            className="w-[84px] h-full flex items-center justify-center bg-[#F9FAFB]"
                          >
                            <Icon
                              icon="solar:trash-bin-minimalistic-bold"
                              className="w-5 h-5 text-[#FF2233]"
                            />
                          </button>
                        </div>

                        {/* 앞: 카드 */}
                        <button
                          type="button"
                          onClick={() => handlePressCard(item)}
                          className="absolute inset-0 bg-[#F9FAFB] flex items-center px-4 transition-transform"
                          style={{
                            transform: isSwiped
                              ? "translateX(-84px)"
                              : "translateX(0px)",
                            transition: "transform .2s ease-out",
                          }}
                        >
                          {/* 시간 */}
                          <div className="w-[90px] shrink-0 text-left">
                            {hasTime && (
                              <span className="text-[14px] font-medium text-[#111827]">
                                {timeText}
                              </span>
                            )}
                          </div>

                          {/* 바 + 제목 */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-[3px] h-[22px] rounded-full"
                              style={{ backgroundColor: accent }}
                            />

                            <p className="text-[14px] font-semibold text-[#111827] truncate">
                              {item.title}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
