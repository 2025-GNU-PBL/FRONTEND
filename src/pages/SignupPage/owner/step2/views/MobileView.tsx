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

// Daum 우편번호 타입들
interface DaumPostcodeData {
  userSelectedType: "R" | "J";
  roadAddress: string;
  jibunAddress: string;
  bname: string;
  buildingName: string;
  apartment: "Y" | "N";
  zonecode: string;
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void;
  width?: string | number;
  height?: string | number;
}

interface DaumPostcodeInstance {
  embed: (element: HTMLElement) => void;
}

interface DaumPostcodeConstructor {
  new (options: DaumPostcodeOptions): DaumPostcodeInstance;
}

interface DaumNamespace {
  Postcode: DaumPostcodeConstructor;
}

type DaumWindow = Window & {
  daum?: DaumNamespace;
};

const getDaum = (): DaumNamespace | undefined => (window as DaumWindow).daum;

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
  if (getDaum()?.Postcode) return Promise.resolve();
  if (DAUM_POSTCODE_LOADING) return DAUM_POSTCODE_LOADING;

  DAUM_POSTCODE_LOADING = new Promise<void>((resolve, reject) => {
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
  const { phoneNumber } =
    (location.state as { phoneNumber?: string } | null) || {};

  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

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

    if (getDaum()?.Postcode) {
      setPostcodeReady(true);
      return;
    }

    loadDaumPostcodeOnce()
      .then(() => mounted && setPostcodeReady(true))
      .catch((e) => console.error("[daum postcode] load failed:", e));

    return () => {
      mounted = false;
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

    const daum = getDaum();
    if (!daum?.Postcode) return;

    new daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
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

    navigate("/sign-up/owner/step3", {
      state: { phoneNumber, zipcode, address, detailAddress, extraAddress },
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-white flex flex-col overflow-hidden">
      {/* 헤더 */}
      <MyPageHeader title="" onBack={onBack} showMenu={false} />

      {/* 콘텐츠 영역 */}
      <div className="pt-[60px] flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-[20px] pb-[120px]">
          <div className="mt-[24px] text-[14px] text-[#1E2124]">
            <span>2 /</span>
            &nbsp;
            <span className="text-[#999999]">3</span>
          </div>

          <h2 className=" whitespace-pre-line mt-[8px] text-[24px] font-bold leading-[36px] text-[#1E2124]">
            사업장{"\n"}주소를 알려주세요
          </h2>

          <div className="mt-[50px] space-y-[12px]">
            {/* 우편번호 */}
            <div className="grid grid-cols-3 gap-[8px]">
              <div className="col-span-1">
                <div className="h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center bg-white">
                  <input
                    id={idZipcode}
                    type="text"
                    readOnly
                    value={zipcode}
                    placeholder="우편번호"
                    className="w-full h-full px-[16px] text-[14px] outline-none"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <button
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
                type="text"
                readOnly
                value={address}
                placeholder="예) 연희동 132, 도산대로 33"
                className="w-full h-full px-[16px] text-[14px] outline-none"
              />
            </div>

            {/* 상세주소 */}
            <div className="h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center bg-white">
              <input
                id={idDetail}
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder="상세주소"
                className="w-full h-full px-[16px] text-[14px] outline-none"
              />
            </div>

            {/* 참고항목 */}
            <div className="h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center bg-white">
              <input
                id={idExtra}
                type="text"
                readOnly
                value={extraAddress}
                placeholder="참고항목"
                className="w-full h-full px-[16px] text-[14px] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        {!isPostcodeOpen && (
          <div className="w-full px-[20px] pb-[20px] bg-white">
            <button
              onClick={handleNext}
              disabled={!isComplete}
              className={`w-full h-[56px] rounded-[12px] text-white font-semibold text-[16px] transition 
                ${
                  isComplete
                    ? "bg-[#FF2233] shadow-[0_8px_20px_rgba(255,34,51,0.3)]"
                    : "bg-[#D9D9D9] cursor-not-allowed"
                }`}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 카카오 주소 검색 */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-[56px] flex items-center justify-end px-3 border-b border-[#E5E7EB] bg-white">
            <button
              onClick={foldDaumPostcode}
              className="w-10 h-10 flex items-center justify-center text-[18px] rounded-full hover:bg-black/5"
            >
              ✕
            </button>
          </div>

          <div
            ref={wrapRef}
            className="absolute top-[56px] left-0 right-0 bottom-0"
          />
        </div>
      )}
    </div>
  );
}
