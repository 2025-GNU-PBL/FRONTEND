// src/pages/Customer/Schedule/CalendarWebView.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../src/components/MyPageHeader";
import api from "../../../../src/lib/api/axios";

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
  if (h === 0 && m === 0) return null; // 시간 정보가 없다고 보고 생략

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

/** ====== 웹뷰 컴포넌트 ====== */
export default function CalendarWebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  /** accessor 쿼리 파라미터 (Reservation 상세와 동일하게 처리) */
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

  /** 현재 월의 일정 조회 */
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, any> = {
          year: currentYear,
          month: currentMonthIndex + 1,
        };

        // accessor가 있다면 함께 전송
        if (accessorParam) {
          params.accessor = accessorParam;
        }

        const { data } = await api.get<ScheduleApiItem[]>("/api/v1/schedule", {
          params,
        });

        // 날짜별로 group
        const grouped: Record<string, ScheduleApiItem[]> = {};
        (data || []).forEach((item) => {
          const key = (item.scheduleDate || "").slice(0, 10); // YYYY-MM-DD
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });

        setScheduleByDate(grouped);

        // 선택된 날짜가 현재 월 밖이면, 이번 달 1일로 이동
        const tempSelected = selectedDate;
        if (
          !tempSelected ||
          tempSelected.getFullYear() !== currentYear ||
          tempSelected.getMonth() !== currentMonthIndex
        ) {
          const firstDay = new Date(currentYear, currentMonthIndex, 1);
          setSelectedDate(firstDay);
        }
      } catch (e) {
        console.error("[Schedule/CalendarWebView] fetchSchedules error:", e);
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

  /** 일정 삭제 (API 스펙이 없어서 일단 UI만) */
  const handleDeleteSchedule = useCallback((scheduleId: number) => {
    // TODO: 삭제 API 연동 필요 시 연결
    // eslint-disable-next-line no-alert
    alert(`일정(ID: ${scheduleId}) 삭제 클릭 (추후 API 연동)`);
  }, []);

  /** 일정 추가하기 클릭 */
  const handleAddSchedule = useCallback(() => {
    // TODO: 일정 생성 페이지 경로에 맞춰 수정
    // eslint-disable-next-line no-alert
    alert("일정 추가하기 클릭 (추후 캘린더/일정 생성 페이지로 연결)");
  }, []);

  /** 선택된 날짜의 일정 목록 */
  const selectedDateKey = formatDateKey(selectedDate);
  const selectedSchedules: ScheduleApiItem[] =
    scheduleByDate[selectedDateKey] || [];

  /** 요일 헤더 텍스트 (월~일) */
  const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* 상단 공통 헤더 영역 (쿠폰 웹뷰 스타일) */}
      <div className="w-full bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1040px] mx-auto">
          <MyPageHeader title="캘린더" onBack={onBack} showMenu={false} />
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-[1040px] mt-20 mx-auto px-6 py-8">
        {/* 상단 타이틀/설명 */}
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">
            한눈에 보는 일정 캘린더
          </h1>
          <p className="mt-1 text-[13px] text-[#6B7280] tracking-[-0.2px]">
            월별 캘린더에서 날짜를 선택하면, 해당 날짜의 예약 일정을 바로 확인할
            수 있어요.
          </p>
        </div>

        {/* 메인 카드 영역 */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
          <div className="grid grid-cols-2 gap-8">
            {/* ===== 왼쪽: 캘린더 ===== */}
            <div>
              {/* 월 제목 + 좌우 이동 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  className="p-2 -ml-2"
                  onClick={goPrevMonth}
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-5 h-5 text-[#1E2124]"
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-medium leading-[27px] tracking-[-0.2px] text-[#1E2124]">
                    {currentYear}년{" "}
                    {formatKoreanMonth(currentYear, currentMonthIndex)}
                  </span>
                </div>
                <button
                  type="button"
                  className="p-2 -mr-2"
                  onClick={goNextMonth}
                >
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="w-5 h-5 text-[#1E2124]"
                  />
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="w-full flex flex-row justify-between mb-1">
                {weekdayLabels.map((label) => (
                  <div
                    key={label}
                    className="flex-1 h-[45.67px] flex items-center justify-center"
                  >
                    <span className="text-[15px] leading-[24px] tracking-[-0.22px] text-[#626262]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* 캘린더 날짜 그리드 (6주) */}
              <div className="w-full">
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
                            className="flex-1 h-[56.35px] flex items-center justify-center"
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
            </div>

            {/* ===== 오른쪽: 선택된 날짜 & 일정 리스트 ===== */}
            <div className="flex flex-col h-full">
              {/* 로딩/에러 */}
              {loading && (
                <div className="mb-4 w-full flex items-center justify-center text-[14px] text-[#999999]">
                  일정 목록을 불러오는 중입니다...
                </div>
              )}
              {!loading && error && (
                <div className="mb-4 w-full flex items-center justify-center text-[14px] text-[#EB5147] text-center whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* 선택된 날짜 텍스트 */}
              <div className="mb-3">
                <div className="text-[16px] font-semibold text-[#6B7280]">
                  선택한 날짜
                </div>
                <div className="mt-1 text-[20px] font-semibold leading-[32px] tracking-[-0.2px] text-[#1E2124]">
                  {formatKoreanDate(selectedDate)}
                </div>
              </div>

              {/* 선택된 날짜의 일정 카드들 */}
              {!loading && !error && (
                <>
                  {selectedSchedules.length === 0 ? (
                    <div className="mt-2 mb-4 text-[14px] leading-[21px] text-[#B0B0B0]">
                      등록된 일정이 없습니다. 아래 버튼을 눌러 새 일정을 추가해
                      보세요.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedSchedules.map((item, index) => {
                        const timeText = formatTimeText(item.scheduleDate);
                        const hasTime = !!timeText;
                        const hasDelete =
                          selectedSchedules.length > 1 && index > 0;

                        return (
                          <div
                            key={item.id}
                            className="w-full min-h-[52px] bg-[#F6F7FB] rounded-[12px] px-4 py-[11px] flex items-center justify-between"
                          >
                            {/* 왼쪽: 시간 + 제목 */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* 시간 */}
                              <div className="w-[80px] shrink-0">
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
                                  <p className="text-[14px] font-semibold leading-[22px] tracking-[-0.16px] text-[#1E2124] truncate">
                                    {item.title}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* 오른쪽: 삭제 버튼 (선택적으로 노출) */}
                            {hasDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSchedule(item.id)}
                                className="ml-2 w-[40px] h-[40px] flex items-center justify-center rounded-[10px] bg-[#F6F7FB]"
                              >
                                <Icon
                                  icon="mynaui:trash"
                                  className="w-5 h-5 text-[#FF2233]"
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 일정 추가하기 카드 */}
                  <button
                    type="button"
                    onClick={handleAddSchedule}
                    className="mt-4 w-full h-[52px] bg-[#F6F7FB] rounded-[12px] px-4 flex items-center"
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
    </div>
  );
}
