import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import { updateOwnerInfo } from "../../../../../store/thunkFunctions";
import { toast } from "react-toastify";
import api from "../../../../../lib/api/axios";

type OwnerFormState = {
  phoneNumber: string;
  bzName: string;
  bzNumber: string;
  detailAddress: string;
  bankName: string;
  bankAccount: string;
};

function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** 사장(OWNER) 마이페이지 - 회원 정보 수정 (Mobile) */
const MobileView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

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
    // 주소 관련 필드 - 기존 값 유지용
    roadAddress = "",
    jibunAddress = "",
    buildingName = "",
    zipCode = "",
  } = (owner as OwnerData | null) ?? {};

  const [formData, setFormData] = useState<OwnerFormState>({
    phoneNumber: phoneNumber ?? "",
    bzName: bzName ?? "",
    bzNumber: bzNumber ?? "",
    detailAddress: detailAddress ?? "",
    bankName: bankName ?? "",
    bankAccount: bankAccount ?? "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로필 이미지 미리보기 + 새 파일
  const [profilePreview, setProfilePreview] = useState<string>(
    profileImage || ""
  );
  const [profileFile, setProfileFile] = useState<File | null>(null);

  // owner 데이터 변경 시 동기화
  useEffect(() => {
    if (!owner) return;

    setFormData({
      phoneNumber: owner.phoneNumber ?? "",
      bzName: owner.bzName ?? "",
      bzNumber: owner.bzNumber ?? "",
      detailAddress: owner.detailAddress ?? "",
      bankName: owner.bankName ?? "",
      bankAccount: owner.bankAccount ?? "",
    });

    // 서버에 저장된 프로필 이미지 기준으로 미리보기 초기화
    setProfilePreview(owner.profileImage || "");
    setProfileFile(null);
  }, [owner]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleChange =
    (field: keyof OwnerFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  // 프로필 이미지 선택 (로컬 미리보기 + 파일 저장)
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 미리보기용
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfilePreview(result); // 화면에 보여줄 이미지
    };
    reader.readAsDataURL(file);

    // 업로드용 파일 저장
    setProfileFile(file);
  };

  // 프로필 이미지 업로드 API (multipart/form-data)
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
    if (!owner) {
      toast.error("사장님 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // 1) 새 프로필 이미지를 선택했다면 먼저 업로드
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

      // 2) 소유자 정보 수정 PATCH
      await dispatch(
        updateOwnerInfo({
          profileImage: finalProfileImage,
          phoneNumber: formData.phoneNumber,
          bzName: formData.bzName,
          bzNumber: formData.bzNumber,
          bankAccount: formData.bankAccount,
          bankName: formData.bankName,
          // 주소 관련 필드 - 기존 값 유지 + 상세 주소만 변경
          detailAddress: formData.detailAddress,
          buildingName: buildingName ?? "",
          zipCode: zipCode ?? "",
          roadAddress: roadAddress ?? "",
          jibunAddress: jibunAddress ?? "",
          // 이메일은 현재 Owner 수정 API 스펙에 없어서 전송하지 않음
        })
      ).unwrap();

      toast.success("회원 정보가 수정되었습니다.");
      navigate(-1);
    } catch (error) {
      console.error(error);
      toast.error(
        "정보 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // OWNER 아닐 때 화면
  if (!owner) {
    return (
      <div className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between h-[60px] px-5">
          {/* Back Button */}
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

          {/* Title */}
          <h1 className="font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-[#1E2124]">
            회원 정보 수정
          </h1>

          {/* 오른쪽 비움 */}
          <div className="w-6 h-6" />
        </div>

        <div className="flex-1 w-full px-5 mt-[30px] flex items-center justify-center text-sm text-gray-500">
          사장님 정보가 없습니다. 다시 로그인해주세요.
        </div>
      </div>
    );
  }

  const baseAddress = roadAddress || jibunAddress || "";

  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between h-[60px] px-5">
        {/* Back Button */}
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

        {/* Title */}
        <h1 className="font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-[#1E2124]">
          회원 정보 수정
        </h1>

        {/* 오른쪽 비워두기 */}
        <div className="w-6 h-6" />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 w-full px-5 mt-[30px] overflow-y-auto pb-[120px]">
        <div className="w-full flex flex-col items-start gap-[30px]">
          {/* 프로필 */}
          <div className="flex flex-row items-center gap-4 h-[64px]">
            {/* 프로필 클릭 시 파일 선택 */}
            <label className="flex flex-row items-center gap-4 h-[64px] cursor-pointer">
              <div className="relative w-16 h-16">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="프로필 이미지"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#D9D9D9]" />
                )}

                {/* 우하단 카메라 아이콘 */}
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#4170FF] flex items-center justify-center">
                  <Icon
                    icon="mdi:camera-outline"
                    className="w-3.5 h-3.5 text-white"
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />
              </div>

              <span className="font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-black">
                {name || "사장님"}
              </span>
            </label>
          </div>

          {/* 정보 섹션 전체 */}
          <div className="w-full flex flex-col items-start gap-[40px]">
            {/* 회원정보 */}
            <div className="w-full flex flex-col items-start gap-5">
              {/* 제목 */}
              <div className="w-full flex flex-row items-center justify-between">
                <span className="font-[Pretendard] text-[16px] leading-[26px] tracking-[-0.2px] text-black">
                  회원정보
                </span>
              </div>

              <div className="w-full border-t border-[#D9D9D9]" />

              {/* 라벨 + 값 두 칼럼 */}
              <div className="w-full flex flex-col items-start gap-3">
                {/* 회원명 (표시만) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    회원명
                  </span>
                  <span className="ml-3 text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                    {name || "사장님"}
                  </span>
                </div>

                {/* 전화번호 (수정 가능) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    전화번호
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.phoneNumber}
                    onChange={handleChange("phoneNumber")}
                    placeholder={phoneNumber || "010-0000-0000"}
                  />
                </div>
              </div>
            </div>

            {/* 사업자 정보 */}
            <div className="w-full flex flex-col items-start gap-5">
              <span className="font-[Pretendard] text-[16px] leading-[26px] tracking-[-0.2px] text-black">
                사업자 정보
              </span>

              <div className="w-full border-t border-[#D9D9D9]" />

              <div className="w-full flex flex-col items-start gap-3">
                {/* 사업장명 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    사업장명
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.bzName}
                    onChange={handleChange("bzName")}
                    placeholder={bzName || "사업장명을 입력하세요"}
                  />
                </div>

                {/* 사업자 번호 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    사업자 번호
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.bzNumber}
                    onChange={handleChange("bzNumber")}
                    placeholder={bzNumber || "숫자와 - 로 입력하세요"}
                  />
                </div>

                {/* 사업장 주소 (기본 주소, 읽기 전용) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    사업장 주소
                  </span>
                  <span className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                    {baseAddress || "주소 검색으로 입력하세요"}
                  </span>
                </div>

                {/* 상세 주소 (detailAddress 입력) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    상세 주소
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.detailAddress}
                    onChange={handleChange("detailAddress")}
                    placeholder={detailAddress || "상세 주소를 입력하세요"}
                  />
                </div>

                {/* 사업장 메일 (read-only, API 연동 X) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    사업장 메일
                  </span>
                  <span className="ml-3 text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                    {email || "메일 주소"}
                  </span>
                </div>

                {/* 은행명 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    은행명
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.bankName}
                    onChange={handleChange("bankName")}
                    placeholder={bankName || "은행명을 입력하세요"}
                  />
                </div>

                {/* 정산 계좌(계좌번호) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    정산 계좌
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.bankAccount}
                    onChange={handleChange("bankAccount")}
                    placeholder={
                      bankAccount || "계좌번호를 입력하세요 (예: 123-456-789)"
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 수정하기 버튼 */}
      <div className="absolute bottom-0 left-0 w-full h-[96px] flex flex-col items-start gap-[10px] px-5 py-5 bg-white">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex flex-col justify-center items-center w-full h-[56px] bg-[#FF2233] rounded-[12px] py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-row justify-center items-center gap-2">
            <span className="font-semibold text-[16px] leading-[24px] tracking-[-0.2px] text-white">
              {isSubmitting ? "수정 중..." : "수정하기"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MobileView;
