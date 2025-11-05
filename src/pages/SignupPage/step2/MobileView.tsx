// MobileView.tsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  useId,
} from "react";
import MyPageHeader from "../../../components/MyPageHeader";

declare global {
  interface Window {
    daum?: any;
  }
}

interface MobileViewProps {
  onBack?: () => void;
  onNext?: (payload: {
    zipcode: string;
    address: string;
    detailAddress: string;
    extraAddress: string;
  }) => void;
  title?: string;
}

export default function MobileView({
  onBack,
  onNext,
  title = "주소 입력",
}: MobileViewProps) {
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [extraAddress, setExtraAddress] = useState("");

  // 우편번호 레이어 오픈 상태
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  // 고유 id 생성
  const uid = useId();
  const idZipcode = `${uid}-zipcode`;
  const idAddress = `${uid}-Address`;
  const idDetail = `${uid}-detailAddress`;
  const idExtra = `${uid}-extraAddress`;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [postcodeReady, setPostcodeReady] = useState(false);

  const isComplete = useMemo(
    () => Boolean(zipcode && address && detailAddress),
    [zipcode, address, detailAddress]
  );

  // 카카오 우편번호 스크립트 로드
  useEffect(() => {
    if (window.daum?.Postcode) {
      setPostcodeReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => setPostcodeReady(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 닫기
  const foldDaumPostcode = useCallback(() => {
    setIsPostcodeOpen(false);
  }, []);

  // 열기
  const openPostcode = useCallback(() => {
    if (!postcodeReady) return;
    setIsPostcodeOpen(true);
  }, [postcodeReady]);

  // 오버레이가 렌더된 뒤에 embed 실행
  useEffect(() => {
    if (!isPostcodeOpen || !postcodeReady || !wrapRef.current) return;

    const element_wrap = wrapRef.current;
    element_wrap.innerHTML = ""; // 중복 embed 방지

    new window.daum.Postcode({
      oncomplete: (data: any) => {
        let addr = "";
        let extraAddr = "";

        if (data.userSelectedType === "R") {
          addr = data.roadAddress;
        } else {
          addr = data.jibunAddress;
        }

        if (data.userSelectedType === "R") {
          if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
            extraAddr += data.bname;
          }
          if (data.buildingName !== "" && data.apartment === "Y") {
            extraAddr +=
              extraAddr !== "" ? ", " + data.buildingName : data.buildingName;
          }
          if (extraAddr !== "") extraAddr = " (" + extraAddr + ")";
          setExtraAddress(extraAddr);
        } else {
          setExtraAddress("");
        }

        setZipcode(data.zonecode);
        setAddress(addr);
        setIsPostcodeOpen(false);

        // 상세주소 포커스
        setTimeout(() => {
          const input = document.getElementById(
            idDetail
          ) as HTMLInputElement | null;
          input?.focus();
        }, 0);
      },
      width: "100%",
      height: "100%",
    }).embed(element_wrap);
  }, [isPostcodeOpen, postcodeReady, idDetail]);

  const handleNext = () => {
    if (!isComplete) {
      alert("우편번호/주소/상세주소를 모두 입력해주세요.");
      return;
    }
    onNext?.({ zipcode, address, detailAddress, extraAddress });
  };

  return (
    <div className="relative w-[390px] h-[844px] bg-white overflow-hidden">
      {/* 헤더 */}
      <MyPageHeader title={title} onBack={onBack} showMenu={false} />

      {/* 본문 */}
      <div className="pt-[60px] h-full flex flex-col">
        <div className="flex-1 overflow-y-auto px-[20px] pb-[210px]">
          <div className="mt-[24px] text-[14px] leading-[22px] text-[#1E2124]">
            2 / 3
          </div>

          <h2 className="mt-[8px] text-[24px] font-bold leading-[36px] text-[#1E2124]">
            회원님의{"\n"}주소를 알려주세요
          </h2>

          <div className="mt-[50px] space-y-[12px]">
            {/* 우편번호 */}
            <div className="grid grid-cols-3 gap-[8px]">
              <div className="col-span-1">
                <div className="h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center bg-white">
                  <input
                    id={idZipcode}
                    name="zipcode"
                    type="text"
                    readOnly
                    value={zipcode}
                    placeholder="우편번호"
                    autoComplete="postal-code"
                    className="w-full h-full px-[16px] text-[14px] text-[#1E2124] placeholder:text-[#9D9D9D] outline-none"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={openPostcode}
                  className="w-full h-[54px] rounded-[10px] border border-[#404040] text-[#404040] text-[14px] font-medium hover:bg-black/5 transition"
                >
                  우편번호 찾기
                </button>
              </div>
            </div>

            {/* 주소 */}
            <div className="h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center bg-white">
              <input
                id={idAddress}
                name="address"
                type="text"
                readOnly
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예) 연희동 132, 도산대로 33"
                autoComplete="street-address"
                className="w-full h-full px-[16px] text-[14px] text-[#1E2124] placeholder:text-[#9D9D9D] outline-none"
              />
            </div>

            {/* 상세주소 */}
            <div className="h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center bg-white">
              <input
                id={idDetail}
                name="detailAddress"
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder="상세주소"
                autoComplete="address-line2"
                className="w-full h-full px-[16px] text-[14px] text-[#1E2124] placeholder:text-[#9D9D9D] outline-none"
              />
            </div>

            {/* 참고항목 (읽기 전용) */}
            <div className="h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center bg-white">
              <input
                id={idExtra}
                name="extraAddress"
                type="text"
                readOnly
                value={extraAddress}
                placeholder="참고항목"
                className="w-full h-full px-[16px] text-[14px] text-[#1E2124] placeholder:text-[#9D9D9D] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        {!isPostcodeOpen && (
          <div className="pointer-events-none">
            <div className="absolute left-0 right-0 bottom-[70px] px-[20px] pb-[20px] pt-[10px] bg-gradient-to-t from-white to-white/80">
              <button
                onClick={handleNext}
                disabled={!isComplete}
                className={`pointer-events-auto w-full h-[56px] rounded-[12px] text-white text-[16px] font-semibold tracking-[-0.2px] active:scale-[0.99] transition
                  ${
                    isComplete
                      ? "bg-[#FF2233] shadow-[0_8px_20px_rgba(255,34,51,0.3)]"
                      : "bg-[#D9D9D9] cursor-not-allowed shadow-none"
                  }`}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 카카오 우편번호 오버레이 */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          {/* 상단 닫기 버튼 */}
          <div className="h-[56px] flex items-center justify-end px-3 border-b border-[#E5E7EB] relative z-50 bg-white">
            <button
              onClick={foldDaumPostcode}
              className="w-10 h-10 flex items-center justify-center text-[18px] rounded-full hover:bg-black/5"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* iframe 임베드 영역 */}
          <div
            ref={wrapRef}
            className="absolute left-0 right-0 top-[56px] bottom-0 z-40"
          />
        </div>
      )}
    </div>
  );
}
