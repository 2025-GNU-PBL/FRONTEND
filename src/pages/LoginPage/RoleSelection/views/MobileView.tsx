import { Link } from "react-router-dom";

// ✅ Mobile 전용 뷰
const MobileView = () => {
  return (
    // 화면 크기 무관하게 중앙에 390x844 프레임 고정 노출
    <div className="min-h-screen w-full flex items-center justify-center overflow-auto bg-[#F6F7FB]">
      {/* 모바일 프레임 */}
      <div className="relative w-[390px] h-[844px] bg-[#F6F7FB] overflow-hidden">
        {/* BG 이미지 레이어 (561x844, left:-86, top:0) */}
        <div
          className="absolute w-[561px] h-[844px] left-[-86px] top-0 bg-no-repeat bg-cover"
          style={{ backgroundImage: "url(/images/login-bg.png)" }}
          aria-hidden
        />

        {/* 문구: 1만 신부님의 선택 */}
        <div className="absolute left-[140px] top-[130px] w-[109px] h-[21px] text-center">
          <span className="font-pretendard font-semibold text-[16px] leading-[21px] tracking-[-0.32px]">
            1만 신부님의 선택
          </span>
        </div>

        {/* 로고: 웨딩PICK */}
        <h1
          className="absolute left-[92px] top-[155px] w-[205px] h-[60px] 
               font-allimjang font-[700] text-[50px] leading-[60px] text-[#FF2233] select-none"
        >
          웨딩PICK
        </h1>

        {/* 고객 로그인 버튼 */}
        <Link
          to="/log-in/client"
          className="absolute left-[20px] top-[646px] w-[350px] h-[56px] rounded-[50px] bg-[#FF2233] flex items-center justify-center px-0"
        >
          <span className="font-pretendard font-semibold text-[16px] text-white">
            고객 로그인
          </span>
        </Link>

        {/* 사장님 로그인 버튼 */}
        <Link
          to="/log-in/owner"
          className="absolute left-[20px] top-[714px] w-[350px] h-[56px] rounded-[50px] bg-white border border-[#FF2233] flex items-center justify-center px-0"
        >
          <span className="text-[#FF2233] font-semibold text-[16px] leading-[150%] tracking-[-0.2px]">
            사장님 로그인
          </span>
        </Link>
      </div>
    </div>
  );
};

export default MobileView;
