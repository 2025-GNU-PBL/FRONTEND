import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  useId,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";

/** Daum 우편번호 데이터 타입 정의 */
interface DaumPostcodeData {
  zonecode: string; // 우편번호
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  userSelectedType: "R" | "J"; // 선택한 주소 타입 (R: 도로명, J: 지번)
  bname: string; // 법정동/법정리 이름
  buildingName: string; // 건물명
  apartment: "Y" | "N"; // 공동주택 여부
}

/** Postcode 생성자 옵션 타입 */
interface DaumPostcodeConstructorOptions {
  oncomplete: (data: DaumPostcodeData) => void;
  width?: string | number;
  height?: string | number;
}

/** Postcode 인스턴스 타입 */
interface DaumPostcodeInstance {
  embed: (element: HTMLElement) => void;
}

/** window.daum 네임스페이스 타입 */
interface DaumPostcodeNamespace {
  Postcode: new (
    options: DaumPostcodeConstructorOptions
  ) => DaumPostcodeInstance;
}

declare global {
  interface Window {
    daum?: DaumPostcodeNamespace;
  }
}

/** 상위에서 받는 props */
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

let DAUM_POSTCODE_LOADING: Promise<void> | null = null;

function loadDaumPostcodeOnce(): Promise<void> {
  // 이미 로드 완료
  if (window.daum?.Postcode) return Promise.resolve();

  // 로딩 중이면 같은 Promise 반환
  if (DAUM_POSTCODE_LOADING) return DAUM_POSTCODE_LOADING;

  DAUM_POSTCODE_LOADING = new Promise<void>((resolve, reject) => {
    // 기존 스크립트 태그가 있으면 그 이벤트를 기다림
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-daum-postcode="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("daum postcode load error")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.setAttribute("data-daum-postcode", "true");

    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;

    script.onload = () => resolve();

    script.onerror = () => {
      console.warn("[daum postcode] first load failed, retrying...");
      script.remove();

      const retry = document.createElement("script");
      retry.setAttribute("data-daum-postcode", "true");
      retry.src =
        "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      retry.async = true;
      retry.onload = () => resolve();
      retry.onerror = () =>
        reject(new Error("Failed to load daum postcode script."));
      document.head.appendChild(retry);
    };

    document.head.appendChild(script);
  });

  return DAUM_POSTCODE_LOADING;
}

export default function MobileView({ onBack, onNext }: MobileViewProps) {
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [extraAddress, setExtraAddress] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { phone } = location.state || {};

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

  useEffect(() => {
    let mounted = true;

    if (window.daum?.Postcode) {
      setPostcodeReady(true);
      return;
    }

    loadDaumPostcodeOnce()
      .then(() => mounted && setPostcodeReady(true))
      .catch((e) => {
        console.error("[daum postcode] load failed:", e);
      });

    return () => {
      mounted = false;
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

    new window.daum!.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        let addr = "";
        let extraAddr = "";

        // 도로명/지번 선택 처리
        if (data.userSelectedType === "R") {
          addr = data.roadAddress;
        } else {
          addr = data.jibunAddress;
        }

        // 참고항목
        if (data.userSelectedType === "R") {
          if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
            extraAddr += data.bname;
          }
          if (data.buildingName !== "" && data.apartment === "Y") {
            extraAddr += extraAddr
              ? ", " + data.buildingName
              : data.buildingName;
          }
          if (extraAddr) extraAddr = " (" + extraAddr + ")";
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

    navigate("/sign-up/client/step3", {
      state: {
        phone,
        zipcode,
        address,
        detailAddress,
        extraAddress,
      },
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-white flex flex-col overflow-hidden">
      {/* 헤더 */}
      <MyPageHeader title="" onBack={onBack} showMenu={false} />

      {/* 콘텐츠 영역 */}
      <div className="pt-[60px] flex-1 flex flex-col">
        {/* 스크롤 되는 본문 */}
        <div className="flex-1 overflow-y-auto px-[20px] pb-[120px]">
          {/* Step Progress */}
          <div className="mt-[24px] text-[14px] text-[#1E2124]">
            <span>2 /</span>
            &nbsp;
            <span className="text-[#999999]">3</span>
          </div>

          {/* 타이틀 */}
          <h2 className="whitespace-pre-line mt-[8px] text-[24px] font-bold leading-[36px] text-[#1E2124]">
            회원님의{"\n"}주소를 알려주세요
          </h2>

          {/* 입력 영역 */}
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

            {/* 참고항목 */}
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

        {/* 하단 버튼 (owner용 반응형 스타일 적용) */}
        {!isPostcodeOpen && (
          <div className="w-full px-[20px] pb-[20px] bg-white">
            <button
              onClick={handleNext}
              disabled={!isComplete}
              className={`w-full h-[56px] rounded-[12px] text-white font-semibold text-[16px] transition
                ${
                  isComplete
                    ? "bg-[#FF2233] shadow-[0_8px_20px_rgba(255,34,51,0.3)]"
                    : "bg-[#D9D9D9] cursor-not-allowed shadow-none"
                }`}
            >
              다음
            </button>
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
