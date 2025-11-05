// WebView.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import { Icon } from "@iconify/react";

declare global {
  interface Window {
    daum?: any;
  }
}

interface WebViewProps {
  onBack?: () => void;
  onNext?: (payload: {
    zipcode: string;
    address: string;
    detailAddress: string;
    extraAddress: string;
  }) => void;
}

export default function WebView({ onBack, onNext }: WebViewProps) {
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [extraAddress, setExtraAddress] = useState("");

  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  const uid = useId();
  const idAddress = `${uid}-address`;
  const idZipcode = `${uid}-zipcode`;
  const idDetail = `${uid}-detailAddress`;
  const idExtra = `${uid}-extraAddress`;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [postcodeReady, setPostcodeReady] = useState(false);

  const canNext = useMemo(
    () => Boolean(zipcode && address && detailAddress),
    [zipcode, address, detailAddress]
  );

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

  const foldDaumPostcode = useCallback(() => {
    setIsPostcodeOpen(false);
  }, []);

  const openPostcode = useCallback(() => {
    if (!postcodeReady) return;
    setIsPostcodeOpen(true);
  }, [postcodeReady]);

  useEffect(() => {
    if (!isPostcodeOpen || !postcodeReady || !wrapRef.current) return;

    const element_wrap = wrapRef.current;
    element_wrap.innerHTML = "";

    // eslint-disable-next-line new-cap
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        // 1) 대표주소: 여러 필드로 안전하게 폴백
        const addressText =
          (data.roadAddress && data.roadAddress.trim()) ||
          (data.jibunAddress && data.jibunAddress.trim()) ||
          (data.autoRoadAddress && data.autoRoadAddress.trim()) ||
          (data.autoJibunAddress && data.autoJibunAddress.trim()) ||
          (data.address && data.address.trim()) ||
          "";

        // 2) 참고항목(동/건물명)
        let extraAddr = "";
        if (data.userSelectedType === "R") {
          if (data.bname && /[동|로|가]$/g.test(data.bname)) {
            extraAddr += data.bname;
          }
          if (data.buildingName && data.apartment === "Y") {
            extraAddr += extraAddr
              ? `, ${data.buildingName}`
              : data.buildingName;
          }
          if (extraAddr) extraAddr = ` (${extraAddr})`;
          setExtraAddress(extraAddr);
        } else {
          setExtraAddress("");
        }

        setZipcode(data.zonecode || "");
        setAddress(addressText);
        setIsPostcodeOpen(false);

        // 상세주소로 포커스
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
    if (!canNext) return;
    onNext?.({ zipcode, address, detailAddress, extraAddress });
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-20">
      {/* 상단 얇은 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* Left — Hero 카피 */}
        <section className="md:col-span-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FF4646]/10 text-[#FF4646] text-xs font-semibold px-3 py-1 w-fit ring-1 ring-[#FF4646]/20">
            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
            간편 회원가입
          </span>

          <h1 className="font-allimjang text-[44px] md:text-[56px] leading-[1.05] mt-3 tracking-[-0.02em]">
            <span className="text-[#FF4646]">주소</span>만 정확히 입력해 주세요
          </h1>

          <p className="font-pretendard text-lg md:text-2xl text-gray-700 mt-4">
            정확한 주소 입력은{" "}
            <span className="font-semibold text-gray-900">맞춤 추천</span>의
            첫걸음이에요.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            {[
              "도로명/지번 모두 검색 가능",
              "건물명 자동 참고항목 입력",
              "모바일·웹 동일 UI",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-[6px] h-2 w-2 rounded-full bg-[#FF4646]" />
                <span className="font-pretendard">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Right — Form 카드 */}
        <section className="md:col-span-6 flex justify-center md:justify-end">
          <div className="relative w-full max-w-[520px]">
            {/* soft glow & offset */}
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
            <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-3xl bg-white" />

            <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur p-7 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* 카드 헤더 */}
              <div className="flex items-center justify-between">
                <button
                  aria-label="back"
                  onClick={() => (onBack ? onBack() : history.back())}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5"
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-6 h-6 text-[#1E2124]"
                  />
                </button>
                <h2 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.2px]">
                  회원가입
                </h2>
                <div className="w-10" />
              </div>

              {/* 진행도 */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm text-[#1E2124]">
                  <span>2 / 3</span>
                  <span className="text-gray-500">주소 입력</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-2/3 bg-[#FF4646] rounded-full" />
                </div>
              </div>

              {/* 타이틀 */}
              <h3 className="mt-6 mb-6 text-[26px] md:text-[28px] leading-[38px] font-bold tracking-[-0.3px] text-[#1E2124]">
                회원님의
                <br />
                주소를 알려주세요
              </h3>

              {/* 우편번호 + 우편번호 찾기 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                    <input
                      id={idZipcode}
                      name="zipcode"
                      type="text"
                      readOnly
                      value={zipcode}
                      placeholder="우편번호"
                      autoComplete="postal-code"
                      className="w-full h-full px-3 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={openPostcode}
                    className="w-full h-[54px] rounded-[12px] border border-[#404040] text-[#404040] text-[14px] font-medium hover:bg-black/5 transition"
                  >
                    우편번호 찾기
                  </button>
                </div>
              </div>

              {/* 주소 / 상세주소 / 참고항목 */}
              <div className="mt-4 space-y-4">
                {/* 주소(대표주소): 읽기 전용 */}
                <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                  <input
                    id={idAddress}
                    name="address"
                    type="text"
                    readOnly
                    value={address}
                    placeholder="예) 연희동 132, 도산대로 33"
                    autoComplete="street-address"
                    className="w-full h-full px-4 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                  />
                </div>

                {/* 상세주소 */}
                <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                  <input
                    id={idDetail}
                    name="detailAddress"
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="상세주소"
                    autoComplete="address-line2"
                    className="w-full h-full px-4 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                  />
                </div>

                {/* 참고항목 */}
                <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                  <input
                    id={idExtra}
                    name="extraAddress"
                    type="text"
                    readOnly
                    value={extraAddress}
                    placeholder="참고항목"
                    className="w-full h-full px-4 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 액션 바 */}
            <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!canNext}
                className={`w-full sm:w-[220px] h-[56px] rounded-[12px] text-white text-[16px] font-semibold transition-transform active:scale-[0.99] ${
                  canNext
                    ? "bg-[#FF4646] hover:brightness-95"
                    : "bg-[#D9D9D9] cursor-not-allowed"
                }`}
              >
                다음
              </button>
            </div>

            {/* 약관 안내 */}
            <p className="mt-5 text-[12px] text-gray-500 text-center">
              계속 진행하면{" "}
              <a
                href="#"
                className="underline underline-offset-2 hover:text-[#FF4646]"
              >
                서비스 이용약관
              </a>
              과{" "}
              <a
                href="#"
                className="underline underline-offset-2 hover:text-[#FF4646]"
              >
                개인정보처리방침
              </a>
              에 동의한 것으로 간주됩니다.
            </p>
          </div>
        </section>
      </main>

      {/* 카카오 우편번호 모달 */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm">
          <div className="h-[60px] flex items-center justify-end px-4 border-b border-[#E5E7EB] bg-white relative z-50">
            <button
              onClick={foldDaumPostcode}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5"
              aria-label="닫기"
            >
              <Icon
                icon="solar:close-circle-line-duotone"
                className="w-7 h-7 text-[#1E2124]"
              />
            </button>
          </div>
          <div
            ref={wrapRef}
            className="absolute left-0 right-0 top-[60px] bottom-0 z-40"
          />
        </div>
      )}
    </div>
  );
}
