import type React from "react";
import { Icon } from "@iconify/react";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import { updateOwnerInfo } from "../../../../../store/thunkFunctions";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../../../../lib/api/axios";

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

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

/** 라벨 + 인풋 행 (웹 수정용, CUSTOMER InfoRow 스타일로 통일) */
function EditableRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center py-3">
      <div className="text-sm text-gray-500 tracking-[-0.2px]">{label}</div>
      <div className="text-sm text-gray-900 tracking-[-0.2px]">
        <input
          className="w-full bg-transparent outline-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#FF4646] focus:ring-1 focus:ring-[#FF4646]/60 placeholder:text-gray-300"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

/** 라벨 + 값 (읽기 전용 행, CUSTOMER InfoRow 스타일로 통일) */
function ReadonlyRow({
  label,
  value,
  placeholder,
}: {
  label: string;
  value?: string;
  placeholder?: string;
}) {
  const displayValue =
    value && value.trim().length > 0 ? value : placeholder ?? "-";

  return (
    <div className="grid grid-cols-[140px_1fr] items-center py-3">
      <div className="text-sm text-gray-500 tracking-[-0.2px]">{label}</div>
      <div className="text-sm text-gray-900 tracking-[-0.2px] break-words">
        <span>{displayValue}</span>
      </div>
    </div>
  );
}

/** 사장(OWNER) 마이페이지 Web - 회원 정보 수정 */
export default function WebView() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  // owner 유무와 상관없이, 기본값을 먼저 풀어서 써준다
  const {
    name = "",
    email = "",
    phoneNumber = "",
    profileImage = "",
    bzNumber = "",
    bankAccount = "",
    bankName = "",
    bzName = "",
    detailAddress = "",
    // 주소 관련 필드 (기본 주소는 read-only, 상세 주소만 수정)
    roadAddress = "",
    jibunAddress = "",
    buildingName = "",
    zipCode = "",
  } = (owner as OwnerData | null) ?? {};

  const baseAddress = roadAddress || jibunAddress || "";

  // 모든 훅은 조건보다 위에서 호출
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 최초 진입 시 owner 값으로 초기화
  const [memberPhone, setMemberPhone] = useState(phoneNumber);
  const [bizName, setBizName] = useState(bzName);
  const [bizNumber, setBizNumber] = useState(bzNumber);
  const [bizDetailAddress, setBizDetailAddress] = useState(detailAddress);
  const [bizBankName, setBizBankName] = useState(bankName);
  const [bizAccount, setBizAccount] = useState(bankAccount);

  // 프로필 이미지 미리보기 + 새 파일 (모바일 기준으로 추가)
  const [profilePreview, setProfilePreview] = useState<string>(
    profileImage || ""
  );
  const [profileFile, setProfileFile] = useState<File | null>(null);

  // owner 변경 시 값 동기화 (프로필 포함)
  useEffect(() => {
    if (!owner) return;

    setMemberPhone(owner.phoneNumber ?? "");
    setBizName(owner.bzName ?? "");
    setBizNumber(owner.bzNumber ?? "");
    setBizDetailAddress(owner.detailAddress ?? "");
    setBizBankName(owner.bankName ?? "");
    setBizAccount(owner.bankAccount ?? "");

    setProfilePreview(owner.profileImage || "");
    setProfileFile(null);
  }, [owner]);

  // 프로필 이미지 선택 (로컬 미리보기 + 파일 저장) - 모바일 기준
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfilePreview(result);
    };
    reader.readAsDataURL(file);

    setProfileFile(file);
  };

  // 프로필 이미지 업로드 API (multipart/form-data) - 모바일 기준
  const uploadProfileImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post<{
      key: string;
      imageUrl: string;
    }>("/api/v1/owner/profile/image", formData);

    if (!data.imageUrl) {
      throw new Error("이미지 URL이 응답에 없습니다.");
    }

    return data.imageUrl;
  };

  // =============================
  //   회원 정보 수정 요청
  // =============================
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // 혹시 모를 방어 코드 (owner 없는데 버튼 눌리면)
    if (!owner) {
      toast.error("사장님 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1) 새 프로필 이미지를 선택했다면 먼저 업로드 (모바일과 동일 로직)
      let finalProfileImage = profileImage;

      if (profileFile) {
        try {
          const uploadedUrl = await uploadProfileImage(profileFile);
          finalProfileImage = uploadedUrl || profileImage;
        } catch (err) {
          console.error(err);
          toast.error(
            "프로필 이미지 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
          // 업로드 실패 시에도 나머지 정보 수정은 그대로 진행 (원래 이미지 유지)
        }
      }

      // 2) 회원 정보 수정 PATCH
      await dispatch(
        updateOwnerInfo({
          profileImage: finalProfileImage,
          phoneNumber: memberPhone,
          bzName: bizName,
          bzNumber: bizNumber,
          bankAccount: bizAccount,
          bankName: bizBankName,
          // 주소 관련 필드 - 기본 주소는 유지, 상세 주소만 수정
          detailAddress: bizDetailAddress,
          buildingName: buildingName ?? "",
          zipCode: zipCode ?? "",
          roadAddress: roadAddress ?? "",
          jibunAddress: jibunAddress ?? "",
          // 이메일은 현재 Owner 수정 API 스펙에 없어서 여기선 전송하지 않음
        })
      ).unwrap();

      toast.success("회원 정보가 수정되었습니다.");
      nav(-1);
    } catch (error) {
      console.error(error);
      toast.error(
        "정보 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-15">
      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 프로필 히어로 카드 */}
          <section className="relative rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
            <div className="px-6 py-6 flex items-center gap-5">
              {/* 프로필 영역: 디자인 유지 + 클릭 시 파일 선택만 추가 */}
              <label className="inline-block cursor-pointer">
                {profilePreview ? (
                  <img
                    src={profilePreview}
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
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />
              </label>

              <div className="min-w-0 flex-1">
                <div className="text-[20px] font-semibold text-gray-900 tracking-[-0.2px] truncate">
                  {name || "게스트"}
                </div>
                <div className="mt-1 text-sm text-gray-600 tracking-[-0.2px]">
                  {owner
                    ? "정보를 최신으로 업데이트해 보세요 ✏️"
                    : "사장님 계정으로 로그인 후 이용해 주세요."}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                {owner ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#FF4646]/10 text-[#FF4646] ring-1 ring-[#FF4646]/20">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="w-3.5 h-3.5"
                    />
                    OWNER
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 ring-1 ring-gray-200">
                    <Icon icon="solar:lock-bold" className="w-3.5 h-3.5" />
                    GUEST
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* owner 없을 때: 접근 불가 카드만 */}
          {!owner ? (
            <SectionCard
              title="접근 불가"
              subtitle="사장님 계정으로 로그인 후 이용해 주세요."
              icon="solar:shield-warning-bold-duotone"
            >
              <div className="px-2 py-8 text-center text-sm text-gray-500">
                사장님 정보가 없습니다. 다시 로그인해주세요.
              </div>
            </SectionCard>
          ) : (
            <>
              {/* 회원정보 카드 (이름은 read-only, 전화번호 수정 가능) */}
              <SectionCard
                title="회원정보"
                subtitle="계정 기본 정보를 수정할 수 있습니다"
                icon="solar:card-2-bold-duotone"
              >
                <div className="divide-y divide-gray-100">
                  <ReadonlyRow
                    label="회원명"
                    value={name}
                    placeholder="사장님"
                  />
                  <EditableRow
                    label="전화번호"
                    value={memberPhone}
                    onChange={setMemberPhone}
                    placeholder="전화번호를 입력하세요"
                  />
                </div>
              </SectionCard>

              {/* 사업자 정보 카드 */}
              <SectionCard
                title="사업자 정보"
                subtitle="정산 및 세무에 활용되니 정확히 입력해주세요"
                icon="solar:shop-2-bold-duotone"
              >
                <div className="divide-y divide-gray-100">
                  <EditableRow
                    label="사업장명"
                    value={bizName}
                    onChange={setBizName}
                    placeholder="사업장명을 입력하세요"
                  />
                  <EditableRow
                    label="사업자 번호"
                    value={bizNumber}
                    onChange={setBizNumber}
                    placeholder="숫자와 - 로 입력하세요"
                  />
                  {/* 기본 사업장 주소 (road/jibunAddress) - 읽기 전용 */}
                  <ReadonlyRow
                    label="사업장 주소"
                    value={baseAddress}
                    placeholder="주소 검색으로 입력하세요"
                  />
                  {/* 상세 주소(detailAddress) - 수정 가능 */}
                  <EditableRow
                    label="상세 주소"
                    value={bizDetailAddress}
                    onChange={setBizDetailAddress}
                    placeholder="상세 주소를 입력하세요"
                  />
                  {/* 사업장 메일 - API로는 안 보내므로 읽기 전용 */}
                  <ReadonlyRow
                    label="사업장 메일"
                    value={email}
                    placeholder="메일 주소"
                  />
                  {/* 은행명 */}
                  <EditableRow
                    label="은행명"
                    value={bizBankName}
                    onChange={setBizBankName}
                    placeholder="은행명을 입력하세요"
                  />
                  {/* 정산 계좌(계좌번호) */}
                  <EditableRow
                    label="정산 계좌"
                    value={bizAccount}
                    onChange={setBizAccount}
                    placeholder="계좌번호를 입력하세요 (예: 123-456-789)"
                  />
                </div>
              </SectionCard>

              {/* 하단 액션 */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#FF4646] hover:bg-[#FF2233] shadow-[0_10px_25px_rgba(255,70,70,0.35)] transition-all ${
                    isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <Icon icon="solar:pen-bold-duotone" className="w-4 h-4" />
                  {isSubmitting ? "수정 중..." : "정보 수정하기"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
