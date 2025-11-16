import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../../components/MyPageHeader";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";

type SalesStatus = "PAID" | "CANCELED";

interface SalesItem {
  id: number;
  date: string; // "10.01"
  name: string;
  dateTime: string; // "2025.10.01 22:12"
  amount: string; // "2,550,500원"
  status: SalesStatus;
}

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

export default function MobileView() {
  const nav = useNavigate();

  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  // 임시 더미 데이터 (실제 매출 데이터 연동 시 이 부분만 교체하면 됨)
  const totalSales = "1,250,000원";
  const cancelCount = 1;

  const salesList: SalesItem[] = [
    {
      id: 1,
      date: "10.01",
      name: "김지원",
      dateTime: "2025.10.01 22:12",
      amount: "2,550,500원",
      status: "PAID",
    },
    {
      id: 2,
      date: "10.01",
      name: "김지원",
      dateTime: "2025.10.01 22:12",
      amount: "2,550,500원",
      status: "PAID",
    },
    {
      id: 3,
      date: "10.01",
      name: "김지원",
      dateTime: "2025.10.01 22:12",
      amount: "2,550,500원",
      status: "CANCELED",
    },
  ];

  // 로그인 안 됐거나 OWNER가 아니면 안내
  if (!owner) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col">
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <MyPageHeader
              title="매출 관리"
              onBack={() => nav(-1)}
              showMenu={false}
            />
          </div>
          <div className="flex-1 px-5 pt-20 flex items-center justify-center text-sm text-gray-500">
            사장님 정보가 없습니다. 다시 로그인해주세요.
          </div>
        </div>
      </div>
    );
  }

  const storeName = (owner as OwnerData & { bzName?: string }).bzName;

  return (
    <div className="w-full bg-white">
      {/* 390 x 844 디바이스 프레임 */}
      <div className="mx-auto w-[390px] h-[844px] bg-white flex flex-col">
        {/* 헤더 (StatusBar, Dynamic Island 등은 사용하지 않고 공통 헤더만 사용) */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <MyPageHeader
            title="매출 관리"
            onBack={() => nav(-1)}
            showMenu={true}
          />
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-auto px-5 pt-20 pb-8 space-y-4">
          {/* 상단 매출 요약 카드 (Rectangle 34626035) */}
          <section className="w-full rounded-lg bg-[#F6F7FB] px-5 py-4 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-bold text-[#333333] tracking-[-0.2px]">
                {storeName}
              </span>
              <div className="flex flex-col gap-[2px] mt-1">
                <span className="text-[14px] font-normal text-black/60 tracking-[-0.2px]">
                  총매출
                </span>
                <span className="text-[20px] font-semibold text-black/80 tracking-[-0.2px] leading-[32px]">
                  {totalSales}
                </span>
              </div>
            </div>
            {/* 우측 이미지 (image 3201) */}
            <div className="w-20 h-20 rounded-2xl bg-white/60 flex items-center justify-center">
              {/* 실제 이미지가 있다면 src 교체 */}
              <div className="w-14 h-14 rounded-xl bg-[#E0ECFF]" />
            </div>
          </section>

          {/* 취소 내역 카드 (Rectangle 34626036) */}
          <button
            type="button"
            className="w-full rounded-lg bg-[#F6F7FB] px-5 h-[50px] flex items-center justify-between"
          >
            <span className="text-[16px] font-normal text-[#333333] tracking-[-0.2px]">
              취소 내역
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[14px] text-[#999999]">
                {cancelCount}건
              </span>
              <Icon
                icon="solar:alt-arrow-left-linear"
                className="w-4 h-4 rotate-180 text-[#C5C5C5]"
              />
            </div>
          </button>

          {/* 상·하단 구분 라인 (Rectangle 34626037 / 33) */}
          <div className="w-[390px] -mx-5 h-2 bg-[#F7F9FA]" />

          {/* 월 선택 영역 + 필터 (Frame 2085665795, 5796) */}
          <div className="flex items-center justify-between mt-2">
            {/* 왼쪽: 이전/다음 달 화살표 + 현재 월 */}
            <div className="flex items-center gap-4">
              <button type="button">
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="w-4 h-4 text-[#1E2124]"
                />
              </button>
              <span className="text-[20px] font-semibold text-[#1E2124] tracking-[-0.2px]">
                2025년 10월
              </span>
              <button type="button">
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="w-4 h-4 rotate-180 text-[#E4E4E4]"
                />
              </button>
            </div>

            {/* 오른쪽: 필터 드롭다운 (전체) */}
            <button
              type="button"
              className="flex items-center gap-1 text-[14px] text-black tracking-[-0.2px]"
            >
              <span>전체</span>
              <Icon
                icon="solar:alt-arrow-down-linear"
                className="w-4 h-4 text-[#999999]"
              />
            </button>
          </div>

          {/* 매출 리스트 (Frame 2085665797) */}
          <div className="mt-2">
            {salesList.map((item) => {
              const isCanceled = item.status === "CANCELED";
              return (
                <div
                  key={item.id}
                  className="flex flex-col border-b border-[#F0F0F0] first:pt-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between py-5">
                    {/* 날짜 + 이름 + 시간 */}
                    <div className="flex items-start gap-3">
                      <span className="text-[16px] font-medium text-[#1E2124] leading-[26px] tracking-[-0.2px]">
                        {item.date}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[16px] text-[#1E2124] tracking-[-0.2px] leading-[26px]">
                          {item.name}
                        </span>
                        <span className="text-[14px] text-[#999999] tracking-[-0.2px] leading-[21px]">
                          {item.dateTime}
                        </span>
                      </div>
                    </div>

                    {/* 금액/취소 상태 */}
                    <div className="flex flex-col items-end">
                      <span
                        className={[
                          "text-[18px] font-semibold tracking-[-0.2px] leading-[29px]",
                          isCanceled
                            ? "text-[#999999] line-through"
                            : "text-[#4170FF]",
                        ].join(" ")}
                      >
                        {item.amount}
                      </span>
                      {isCanceled && (
                        <span className="text-[14px] text-[#999999] tracking-[-0.2px] leading-[21px]">
                          취소
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
