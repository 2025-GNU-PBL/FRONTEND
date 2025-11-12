import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && (userData as any).userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** ===== 표시용 포맷터들 ===== */
const formatKoreanDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};

const formatBzNumberDisplay = (raw?: string) => {
  if (!raw) return "-";
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "-";
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 5);
  const part3 = digits.slice(5);
  return [part1, part2, part3].filter(Boolean).join("-");
};

const formatPhone = (raw?: string) => {
  if (!raw) return "-";
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("02") && d.length >= 9) {
    // 서울 국번
    return d.replace(/(02)(\d{3,4})(\d{4})/, "$1-$2-$3");
  }
  if (d.length >= 10) {
    return d.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
  }
  return raw;
};

const formatBankAccountDisplay = (raw?: string) => {
  if (!raw) return "-";
  // "은행명 계좌번호" 또는 "은행명 | 계좌번호" 형태 지원
  const matched = raw.match(/^(.+?)[|\s]+([\d-]+|\d[\d- ]+\d)$/);
  if (!matched) return raw;
  const bank = matched[1].trim();
  const acctDigits = matched[2].replace(/[^\d]/g, "");
  if (acctDigits.length < 6) return `${bank} ${matched[2].trim()}`;
  const masked = acctDigits.slice(0, 2) + "-****-" + acctDigits.slice(-4);
  return `${bank} ${masked}`;
};

/** 공용 카드 컴포넌트 */
function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/5">
              <Icon icon={icon} className="w-5 h-5 text-[#1E2124]" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-gray-900 truncate">
              {title}
            </h3>
            {subtitle ? (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-6">
        <div className="h-px bg-gray-100" />
      </div>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center py-3">
      <div className="text-sm text-gray-500 tracking-[-0.2px]">{label}</div>
      <div
        className={`text-sm text-gray-900 tracking-[-0.2px] break-words ${
          mono ? "font-mono" : ""
        }`}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}

/** 사장(OWNER) 마이페이지 - 내 정보 조회 (Web) */
export default function WebView() {
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const joinedDate = useMemo(
    () => formatKoreanDate(owner?.createdAt),
    [owner?.createdAt]
  );

  // 비로그인/권한 불일치 처리
  if (!owner) {
    return (
      <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
        {/* 상단 그라디언트 바 (디자인 통일) */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />
        <div className="pt-16 pb-16">
          <div className="max-w-[960px] mx-auto px-6">
            <SectionCard
              title="접근 불가"
              subtitle="사장님 계정으로 로그인 후 이용해 주세요."
              icon="solar:shield-warning-bold-duotone"
            >
              <div className="px-2 py-8 text-center text-sm text-gray-500">
                사장님 정보가 없습니다. 다시 로그인해주세요.
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    );
  }

  // OwnerData 기준
  const {
    name,
    email,
    phoneNumber,
    profileImage,
    bzNumber,
    bankAccount,
    socialId,
    socialProvider,
  } = owner;

  const displayPhone = formatPhone(phoneNumber);
  const displayBz = formatBzNumberDisplay(bzNumber);
  const displayBank = formatBankAccountDisplay(bankAccount);

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
      {/* 상단 그라디언트 바 (이전 웹뷰와 통일) */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 프로필 히어로 카드 */}
          <section className="relative rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
            <div className="px-6 py-6">
              <div className="flex items-center gap-5">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="프로필 이미지"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Icon
                      icon="solar:user-bold-duotone"
                      className="w-7 h-7 text-gray-500"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[20px] font-semibold text-gray-900 tracking-[-0.2px] truncate">
                    {name}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 tracking-[-0.2px]">
                    사장님, 환영합니다 👋
                  </div>
                </div>
                <div className="ml-auto hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#FF4646]/10 text-[#FF4646] ring-1 ring-[#FF4646]/20">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="w-3.5 h-3.5"
                    />
                    OWNER
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 회원정보 카드 */}
          <SectionCard
            title="회원정보"
            subtitle="계정 기본 정보"
            icon="solar:card-2-bold-duotone"
          >
            <div className="divide-y divide-gray-100">
              <InfoRow label="이름" value={name} />
              <InfoRow label="전화번호" value={displayPhone} />
              <InfoRow label="이메일" value={email || "-"} />
              <InfoRow label="가입일" value={joinedDate} />
            </div>
          </SectionCard>

          {/* 사업자 정보 카드 */}
          <SectionCard
            title="사업자 정보"
            subtitle="정산 및 세무에 활용됩니다"
            icon="solar:shop-2-bold-duotone"
          >
            <div className="divide-y divide-gray-100">
              <InfoRow label="사업자번호" value={displayBz} mono />
              <InfoRow label="정산 계좌" value={displayBank} mono />
              <InfoRow label="소셜 ID" value={socialId || "-"} mono />
              <InfoRow label="로그인 제공자" value={socialProvider || "-"} />
            </div>
          </SectionCard>

          {/* 하단 액션 */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600 px-2 py-1"
              onClick={() => alert("회원 탈퇴 프로세스를 연결하세요.")}
            >
              <Icon icon="solar:logout-2-bold-duotone" className="w-4 h-4" />
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
