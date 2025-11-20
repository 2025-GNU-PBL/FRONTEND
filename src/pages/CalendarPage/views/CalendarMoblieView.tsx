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
  scheduleDate: string; // "2025-11-14" 또는 "2025-11-14T11:00:00"
};

/** 날짜 → key (YYYY-MM-DD) */
function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 선택된 날짜 텍스트: 2025년 4월 9일 */
function formatKoreanDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}

/** 월 텍스트: 4월 */
function formatKoreanMonth(year: number, monthIndex: number): string {
  // monthIndex: 0 = 1월
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

/** 시간 텍스트: 11:00AM (scheduleDate에 시간이 있을 때만) */
function formatTimeText(iso: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(+d)) return null;

  const h = d.getHours();
  const m = d.getMinutes();

  // 백엔드가 날짜만 줄 때(00:00)는 시간 표시 X
  if (h === 0 && m === 0) return null;

  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return `${hour12}:${mm}${ampm}`;
}

/** 한 달 캘린더용 날짜 배열 생성(월~일, 6주 고정) */
type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

function buildCalendarMatrix(year: number, monthIndex: number): CalendarCell[] {
  // monthIndex: 0 = 1월
  const firstOfMonth = new Date(year, monthIndex, 1);

  // Monday-first 보정 (JS는 일요일=0)
  const weekdayOfFirst = (firstOfMonth.getDay() + 6) % 7; // 0=월, 6=일

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

/** ====== 캘린더 모바일 뷰 ====== */
export default function CalendarMobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  /** accessor 쿼리 파라미터 (고객/사장 구분용이라면 여기서 같이 전송) */
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

  /** 현재 보고 있는 월 (year, monthIndex) */
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  /** 캘린더에서 선택된 날짜 */
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  /** 월별 일정: key(YYYY-MM-DD) → ScheduleApiItem[] */
  const [scheduleByDate, setScheduleByDate] = useState<
    Record<string, ScheduleApiItem[]>
  >({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth(); // 0 ~ 11

  /** 한 달 캘린더 셀 */
  const calendarCells = useMemo(
    () => buildCalendarMatrix(currentYear, currentMonthIndex),
    [currentYear, currentMonthIndex]
  );

  /** ====== 월별 일정 조회 API 연동 ====== */
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, any> = {
          year: currentYear,
          month: currentMonthIndex + 1,
        };

        if (accessorParam) {
          params.accessor = accessorParam;
        }

        // GET /api/v1/schedule?year=2025&month=11
        const { data } = await api.get<ScheduleApiItem[]>("/api/v1/schedule", {
          params,
        });

        // 날짜별로 그룹핑 (YYYY-MM-DD 단위)
        const grouped: Record<string, ScheduleApiItem[]> = {};
        (data || []).forEach((item) => {
          const key = (item.scheduleDate || "").slice(0, 10); // YYYY-MM-DD
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });

        setScheduleByDate(grouped);

        // 선택된 날짜가 이번 달이 아니면 이번 달 1일로 맞춰줌
        if (
          !selectedDate ||
          selectedDate.getFullYear() !== currentYear ||
          selectedDate.getMonth() !== currentMonthIndex
        ) {
          const firstDay = new Date(currentYear, currentMonthIndex, 1);
          setSelectedDate(firstDay);
        }
      } catch (e) {
        console.error("[Schedule/CalendarMobileView] fetchSchedules error:", e);
        setError("일정 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonthIndex, accessorParam]);

  /** 이전/다음 달 이동 */
  const goPrevMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m - 1, 1);
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m + 1, 1);
    });
  }, []);

  /** 날짜 선택 */
  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  /** 일정 추가하기 클릭 → 개인 일정 추가 페이지로 이동 */
  const handleAddSchedule = useCallback(() => {
    nav("/my-page/owner/schedules/personal");
  }, [nav]);

  /** 일정 클릭 → 수정 페이지로 이동 */
  const handleClickSchedule = useCallback(
    (scheduleId: number) => {
      nav(`/my-page/owner/schedules/personal/edit/${scheduleId}`);
    },
    [nav]
  );

  /** 선택된 날짜의 일정 목록 */
  const selectedDateKey = formatDateKey(selectedDate);
  const selectedSchedules: ScheduleApiItem[] =
    scheduleByDate[selectedDateKey] || [];

  /** 요일 헤더 텍스트 (월~일) */
  const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="w-full bg-white">
      {/* 390 × 844 프레임 */}
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

            {/* 캘린더 날짜 그리드 (6주) */}
            <div className="w-[350px] mx-auto">
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex flex-row justify-between h-[56.35px]"
                >
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

                      return (
                        <button
                          key={formatDateKey(date)}
                          type="button"
                          onClick={() => handleSelectDate(date)}
                          className="w-[50px] h-[56.35px] flex items-center justify-center"
                        >
                          <div className="flex items-center justify-center">
                            {isSelected ? (
                              <div className="w-[30px] h-[30px] rounded-full bg-[#FF2233] flex items-center justify-center">
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

            {/* 선택된 날짜의 일정 카드들 */}
            {!loading && !error && (
              <>
                {selectedSchedules.length === 0 ? (
                  <div className="mt-2 mb-4 text-[14px] leading-[21px] text-[#B0B0B0]">
                    등록된 일정이 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedSchedules.map((item) => {
                      const timeText = formatTimeText(item.scheduleDate);
                      const hasTime = !!timeText;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleClickSchedule(item.id)}
                          className="w-[350px] min-h-[52px] bg-[#F6F7FB] rounded-[12px] px-4 py-[11px] flex items-center justify-between active:scale-[0.99] transition-transform"
                        >
                          {/* 왼쪽: 시간 + 제목 */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* 시간 영역 */}
                            <div className="w-[70px] shrink-0">
                              {hasTime && (
                                <span className="text-[16px] leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                                  {timeText}
                                </span>
                              )}
                            </div>

                            {/* 세로 바 + 제목 */}
                            <div className="flex items-center gap-[9.6px] flex-1 min-w-0">
                              <div className="w-[3.2px] h-[25.6px] rounded-[2.4px] bg-[#FF2233]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-semibold leading-[22px] tracking-[-0.16px] text-[#1E2124] truncate text-left">
                                  {item.title}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 일정 추가하기 카드 */}
                <button
                  type="button"
                  onClick={handleAddSchedule}
                  className="mt-3 w-[350px] h-[52px] bg-[#F6F7FB] rounded-[12px] px-4 flex items-center"
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
