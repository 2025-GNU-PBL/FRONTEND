export type Product = {
  id: number;
  name: string;
  starCount: number;
  address: string;
  detail: string;
  price: number;
  availableTime: string;
  createdAt: string;
  thumbnail: string | null;
  region: string;
  ownerName: string;
  category: string;
  tags: {
    id: number;
    tagName: string;
  }[];
};

/* ========================= 공통 타입 ========================= */

/** 라우트 기준 카테고리 */
export type Category = "wedding" | "studio" | "dress" | "makeup";

/** 공통 이미지 타입 */
export type CommonImage = {
  id: number;
  url: string;
  s3Key: string;
  displayOrder: number;
};

/** 공통 옵션 타입 */
export type CommonOption = {
  name: string;
  detail: string;
  price: number;
};

/** 스튜디오/드레스/메이크업 태그 타입 */
export type StudioTag = {
  id: number;
  tagName: string;
};

/* ========================= 상세 응답 타입 ========================= */

/** 웨딩홀 상세 타입 (백엔드 스펙 기준) */
export type WeddingHallDetail = {
  id: number;
  name: string;
  price: number;
  address: string;
  detail: string;
  availableTimes: string;
  starCount: number;
  averageRating: number;
  capacity: number;
  minGuest: number;
  maxGuest: number;
  parkingCapacity: number;
  cateringType: string;
  reservationPolicy: string;
  region: string;
  ownerName: string;
  images: CommonImage[];
  options: CommonOption[];
  tags: string[]; // 문자열 태그
};

/** 스튜디오 상세 타입 (백엔드 스펙 기준) */
export type StudioDetail = {
  id: number;
  name: string;
  address: string;
  detail: string;
  price: number;
  availableTimes: string;
  region: string;
  images: CommonImage[];
  options: CommonOption[];
  tags: StudioTag[];
};

/** 드레스 상세 타입 (스튜디오와 동일 구조, tags 포함) */
export type DressDetail = {
  id: number;
  name: string;
  address: string;
  detail: string;
  price: number;
  availableTimes: string;
  region: string;
  images: CommonImage[];
  options: CommonOption[];
  tags: StudioTag[];
};

/** 메이크업 상세 타입 (tags 없음 / 선택적) */
export type MakeupDetail = {
  id: number;
  name: string;
  address: string;
  detail: string;
  price: number;
  availableTimes: string;
  region: string;
  images: CommonImage[];
  options: CommonOption[];
  tags?: StudioTag[];
};

/* ========================= 정규화 타입 ========================= */

/**
 * 상세 페이지에서 공통으로 쓰는 정규화 타입
 * _category 로 현재 카테고리를 구분해서 사용
 */
export type NormalizedDetail =
  | (WeddingHallDetail & { _category: "wedding" })
  | (StudioDetail & { _category: "studio" })
  | (DressDetail & { _category: "dress" })
  | (MakeupDetail & { _category: "makeup" });
