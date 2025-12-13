import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";
import { toast } from "react-toastify";

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

const MobileView: React.FC = () => {
  const navigate = useNavigate();

  const rawUserData = useAppSelector((state) => state.user.userData);

  // Redux 값으로 초기 owner 설정
  const [owner, setOwner] = React.useState<OwnerData | null>(() =>
    ensureOwner(rawUserData)
  );

  // Redux userData 변경 시 동기화
  React.useEffect(() => {
    setOwner(ensureOwner(rawUserData));
  }, [rawUserData]);

  // Swagger DTO 기준 /api/v1/owner 호출해서 최신 소유자 정보(profileImage 포함) 가져오기
  React.useEffect(() => {
    const fetchOwner = async () => {
      try {
        const { data } = await api.get<OwnerData>("/api/v1/owner");
        // 혹시라도 OWNER가 아닐 수 있으니 한 번 더 필터
        const ensured = ensureOwner(data as unknown as UserData);
        if (ensured) {
          setOwner(ensured);
        }
      } catch (error) {
        console.error(error);
        toast.error("소유자 정보를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchOwner();
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToEdit = () => {
    navigate("/my-page/owner/profile/edit");
  };

  // 회원 탈퇴 모달 상태
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);

  const handleOpenWithdrawModal = () => {
    setShowWithdrawModal(true);
  };

  const handleCancelWithdraw = () => {
    setShowWithdrawModal(false);
  };

  const handleConfirmWithdraw = () => {
    // 실제 탈퇴 로직은 추후 API 연동
    toast.error("회원 탈퇴 프로세스를 연결해주세요.");
    setShowWithdrawModal(false);
  };

  // OWNER가 아닌 경우 안내 화면
  if (!owner) {
    return (
      <div className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between h-[60px] px-5">
          <button
            className="w-8 h-8 flex items-center justify-center"
            type="button"
            onClick={handleGoBack}
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="w-8 h-8 text-[#1E2124]"
            />
          </button>

          <h1 className="font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-[#1E2124]">
            내 정보 조회
          </h1>

          {/* 오른쪽 공간 맞춤용 더미 박스 */}
          <div className="w-6 h-6" />
        </div>

        <div className="flex-1 w-full px-5 flex items-center justify-center text-sm text-gray-500">
          사장님 정보가 없습니다. 다시 로그인해주세요.
        </div>
      </div>
    );
  }

  // OwnerData 기준 필드
  const {
    name,
    email,
    phoneNumber,
    profileImage,
    bzNumber,
    bankAccount,
    bankName,
    bzName,
    roadAddress,
    jibunAddress,
    detailAddress,
    buildingName,
    createdAt,
  } = owner as OwnerData & {
    bzName?: string;
    detailAddress?: string;
  };

  const displayPhone = phoneNumber || "-";
  const displayCreatedAt = createdAt
    ? new Date(createdAt).toLocaleDateString("ko-KR")
    : "-";

  // 주소 문자열 가공
  const displayBzAddress = (() => {
    const baseAddress = roadAddress || jibunAddress || "";
    const parts: string[] = [];

    if (baseAddress) parts.push(baseAddress);
    if (detailAddress) parts.push(detailAddress);
    const addressStr = parts.join(" ");

    if (buildingName) {
      return addressStr
        ? `${addressStr} (${buildingName})`
        : `(${buildingName})`;
    }

    return addressStr || "-";
  })();

  const displayBankName = bankName || "-";
  const displayBankAccount = bankAccount || "-";

  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between h-[60px] px-5">
        <button
          className="w-8 h-8 flex items-center justify-center"
          type="button"
          onClick={handleGoBack}
        >
          <Icon
            icon="solar:alt-arrow-left-linear"
            className="w-8 h-8 text-[#1E2124]"
          />
        </button>

        <h1 className="mr-7 font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-[#1E2124]">
          내 정보 조회
        </h1>

        <div></div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 w-full px-5 overflow-y-auto pb-[80px]">
        <div className="w-full flex flex-col items-start gap-[30px] mt-[30px]">
          {/* 프로필 */}
          <div className="flex flex-row items-center gap-4 h-[64px]">
            {profileImage ? (
              <img
                src={profileImage}
                alt="프로필 이미지"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#D9D9D9]" />
            )}
            <span className="font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-black">
              {name}
            </span>
          </div>

          {/* 정보 섹션 */}
          <div className="w-full flex flex-col items-start gap-[40px]">
            {/* 회원정보 */}
            <div className="w-full flex flex-col items-start gap-5">
              <div className="w-full flex flex-row items-center justify-between">
                <span className="font-[Pretendard] text-[16px] leading-[26px] tracking-[-0.2px] text-black">
                  회원정보
                </span>

                <button
                  className="flex flex-row items-center gap-1"
                  type="button"
                  onClick={handleGoToEdit}
                >
                  <span className="font-[Pretendard] text-[12px] leading-[18px] tracking-[-0.1px] text-[#4170FF]">
                    회원 정보 수정
                  </span>
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-4 h-4 text-[#4170FF] rotate-180"
                  />
                </button>
              </div>

              <div className="w-full border-t border-[#D9D9D9]" />

              <div className="w-full flex flex-col items-start gap-3">
                {/* 이름 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    이름
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {name || "-"}
                  </span>
                </div>

                {/* 전화번호 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    전화번호
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {displayPhone}
                  </span>
                </div>

                {/* 이메일 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    이메일
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {email || "-"}
                  </span>
                </div>

                {/* 가입일 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    가입일
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {displayCreatedAt}
                  </span>
                </div>
              </div>
            </div>

            {/* 사업자 정보 */}
            <div className="w-full flex flex-col items-start gap-5">
              <span className="font-[Pretendard] text-[16px] text-black">
                사업자 정보
              </span>

              <div className="w-full border-t border-[#D9D9D9]" />

              <div className="w-full flex flex-col items-start gap-3">
                {/* 사업장명 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    사업장명
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {bzName || "-"}
                  </span>
                </div>

                {/* 사업자 번호 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    사업자 번호
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {bzNumber || "-"}
                  </span>
                </div>

                {/* 사업장 주소 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    사업장 주소
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {displayBzAddress}
                  </span>
                </div>

                {/* 사업장 메일 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    사업장 메일
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {email || "-"}
                  </span>
                </div>

                {/* 은행명 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    은행명
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {displayBankName}
                  </span>
                </div>

                {/* 정산 계좌(계좌번호) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] text-[#999999]">
                    정산 계좌
                  </span>
                  <span className="text-[14px] text-black ml-3">
                    {displayBankAccount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 아래 고정된 회원 탈퇴 버튼 */}
      <button
        className="absolute bottom-20 right-5 text-[14px] text-[#999999]"
        type="button"
        onClick={handleOpenWithdrawModal}
      >
        회원 탈퇴
      </button>

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[310px] rounded-2xl bg-white px-5 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
            <div className="w-full flex justify-center mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF2F2] flex items-center justify-center">
                <Icon
                  icon="solar:warning-triangle-bold"
                  className="w-6 h-6 text-[#FF4D4F]"
                />
              </div>
            </div>

            <p className="text-center font-[Pretendard] text-[16px] font-semibold text-[#1E2124]">
              정말 탈퇴하시겠어요?
            </p>
            <p className="mt-2 text-center text-[13px] text-[#777777] leading-[20px]">
              탈퇴 후에는 계정 및 매장 정보가
              <br />
              복구되지 않을 수 있어요.
            </p>

            <div className="mt-5 flex flex-row gap-2">
              <button
                type="button"
                className="flex-1 h-11 rounded-full border border-[#D9D9D9] text-[14px] text-[#666666]"
                onClick={handleCancelWithdraw}
              >
                취소
              </button>

              <button
                type="button"
                className="flex-1 h-11 rounded-full bg-[#FF4D4F] text-white text-[14px]"
                onClick={handleConfirmWithdraw}
              >
                탈퇴할래요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileView;
