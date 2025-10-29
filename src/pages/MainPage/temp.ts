export type CategoryKey = "hall" | "studio" | "dress" | "makeup";

export type Product = {
  id: string;
  title: string;
  image: string;
  subtitle?: string;
  price?: string;
  avg_star?: number;
  address?: string;
};

export const productsByCategory: Record<CategoryKey, Product[]> = {
  hall: [
    {
      id: "h1",
      title: "라움 웨딩홀 fnkldan fklnkfle",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1zAAlDnrTclZIxGLtMyZt_qkQ4A1OVdAczA&s",
      subtitle: "청담 | 200~300석",
      avg_star: 4.5,
      address: "서울 강남구 청담동",
    },
    {
      id: "h2",
      title: "드레스가든",
      image:
        "https://www.iwedding.co.kr/center/website/brandplus/fb_1718340275.jpg",
      subtitle: "역삼 | 150~250석",
      price: "₩2,700,000~",
      avg_star: 4.2,
      address: "서울 강남구 역삼동",
    },
    {
      id: "h3",
      title: "아펠가모",
      image: "/images/sample_hall_3.jpg",
      subtitle: "논현 | 200~350석",
      price: "₩3,800,000~",
      avg_star: 4.7,
      address: "서울 강남구 논현동",
    },
    {
      id: "h4",
      title: "더파티움",
      image: "/images/sample_hall_3.jpg",
      subtitle: "성수 | 180~300석",
      price: "₩3,200,000~",
      avg_star: 4.3,
      address: "서울 성동구 성수동",
    },
    {
      id: "h5",
      title: "부띠끄 블랑",
      image: "/images/sample_hall_3.jpg",
      subtitle: "삼성 | 150~220석",
      price: "₩2,950,000~",
      avg_star: 4.4,
      address: "서울 강남구 삼성동",
    },
    {
      id: "h6",
      title: "에버라스트",
      image: "/images/sample_hall_3.jpg",
      subtitle: "여의도 | 200~320석",
      price: "₩3,500,000~",
      avg_star: 4.1,
      address: "서울 영등포구 여의도동",
    },
    {
      id: "h7",
      title: "더베뉴지",
      image: "/images/sample_hall_3.jpg",
      subtitle: "광장 | 170~260석",
      price: "₩3,000,000~",
      avg_star: 4.0,
      address: "서울 광진구 광장동",
    },
    {
      id: "h8",
      title: "더클래스청담",
      image: "/images/sample_hall_3.jpg",
      subtitle: "청담 | 120~200석",
      price: "₩2,700,000~",
      avg_star: 4.6,
      address: "서울 강남구 청담동",
    },
    {
      id: "h9",
      title: "그랜드라움",
      image: "/images/sample_hall_3.jpg",
      subtitle: "논현 | 220~360석",
      price: "₩3,900,000~",
      avg_star: 4.5,
      address: "서울 강남구 논현동",
    },
    {
      id: "h10",
      title: "그랜드라움",
      image: "/images/sample_hall_3.jpg",
      subtitle: "논현 | 220~360석",
      price: "₩3,900,000~",
      avg_star: 4.5,
      address: "서울 강남구 논현동",
    },
  ],
  studio: [
    {
      id: "s1",
      title: "포토시그니처",
      image: "/images/sample_studio_1.jpg",
      subtitle: "감성 스냅",
      price: "₩900,000~",
      avg_star: 4.3,
      address: "서울 성동구 성수동",
    },
    {
      id: "s2",
      title: "원규스튜디오",
      image: "/images/sample_studio_2.jpg",
      subtitle: "클래식",
      price: "₩1,200,000~",
      avg_star: 4.6,
      address: "서울 강남구 논현동",
    },
    {
      id: "s3",
      title: "리유스튜디오",
      image: "/images/sample_studio_3.jpg",
      subtitle: "모던",
      price: "₩1,050,000~",
      avg_star: 4.4,
      address: "서울 강남구 역삼동",
    },
  ],
  dress: [
    {
      id: "d1",
      title: "로자스포사",
      image: "/images/sample_dress_1.jpg",
      subtitle: "프리미엄",
      price: "₩1,800,000~",
      avg_star: 4.7,
      address: "서울 강남구 청담동",
    },
    {
      id: "d2",
      title: "브라이드K",
      image: "/images/sample_dress_2.jpg",
      subtitle: "모던 심플",
      price: "₩1,300,000~",
      avg_star: 4.5,
      address: "서울 강남구 논현동",
    },
    {
      id: "d3",
      title: "아벨바이케이",
      image: "/images/sample_dress_3.jpg",
      subtitle: "엘레강스",
      price: "₩1,600,000~",
      avg_star: 4.6,
      address: "서울 강남구 신사동",
    },
  ],
  makeup: [
    {
      id: "m1",
      title: "제니하우스",
      image: "/images/sample_mu_1.jpg",
      subtitle: "한남",
      price: "₩650,000~",
      avg_star: 4.4,
      address: "서울 용산구 한남동",
    },
    {
      id: "m2",
      title: "순수 청담",
      image: "/images/sample_mu_2.jpg",
      subtitle: "청담",
      price: "₩720,000~",
      avg_star: 4.5,
      address: "서울 강남구 청담동",
    },
    {
      id: "m3",
      title: "청담아이디",
      image: "/images/sample_mu_3.jpg",
      subtitle: "청담",
      price: "₩600,000~",
      avg_star: 4.2,
      address: "서울 강남구 청담동",
    },
  ],
};
