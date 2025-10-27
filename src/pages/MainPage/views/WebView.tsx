// src/pages/MainPage/views/WebView.tsx
export default function WebView() {
  return (
    <>
      {/* Hero Section */}
      <section
        className="relative h-[50vh] lg:h-[90vh] bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://www.beaches.com/blog/content/images/2025/02/BTC_Kaylah-Tyler_RealWedding_Beach_Ceremony_024.jpg")',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            당신이 꿈꾸던 완벽한 결혼식
          </h1>
          <p className="text-lg sm:text-xl font-light mb-8 drop-shadow-md">
            스튜디오, 드레스, 메이크업을 한 번에 만나보세요.
          </p>
          <button className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors duration-300">
            상담 신청하기
          </button>
        </div>
      </section>

      {/* Services Showcase Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              스드메, 무엇을 원하세요?
            </h2>
            <p className="text-gray-600">
              세심하게 선별된 최고의 스튜디오, 드레스, 메이크업을 소개합니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Studio Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <img
                src="https://cdn.dailysecu.com/news/photo/201911/78605_77275_1340.jpg"
                alt="웨딩 스튜디오"
                className="w-full h-64 object-cover"
              />
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">스튜디오</h3>
                <p className="text-gray-500 text-sm">
                  아름다운 순간을 영원히 간직할 특별한 공간.
                </p>
              </div>
            </div>

            {/* Dress Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <img
                src="https://img.bestdealplus.com/ae01/kf/S2abb496bfcb84a2abbd221acc6b2c6726.jpg"
                alt="웨딩 드레스"
                className="w-full h-64 object-cover"
              />
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">드레스</h3>
                <p className="text-gray-500 text-sm">
                  당신을 가장 빛나게 할 꿈의 웨딩 드레스.
                </p>
              </div>
            </div>

            {/* Makeup Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <img
                src="https://cdn.wedding21.co.kr/news/photo/202312/300535_201736_362.jpg"
                alt="웨딩 메이크업"
                className="w-full h-64 object-cover"
              />
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">메이크업</h3>
                <p className="text-gray-500 text-sm">
                  오랜 경험의 전문가들이 선사하는 완벽한 변신.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Banner */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            왜 우리를 선택해야 할까요?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            믿을 수 있는 파트너십, 투명한 가격, 그리고 고객 한 분 한 분을 위한
            맞춤 서비스로 최고의 순간을 약속드립니다.
          </p>
          <a
            href="/about-us"
            className="text-purple-500 font-semibold hover:text-purple-600 transition-colors duration-300"
          >
            더 알아보기 →
          </a>
        </div>
      </section>
    </>
  );
}
