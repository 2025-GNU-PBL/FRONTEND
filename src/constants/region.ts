export type RegionKey = "전체" | "서울" | "경기" | "인천" | "부산";

export type RegionItem =
  | { key: "전체"; label: "전체"; image?: undefined }
  | { key: Exclude<RegionKey, "전체">; label: string; image: string };

export const regions: RegionItem[] = [
  { key: "전체", label: "전체" },
  { key: "서울", label: "서울", image: "/images/seoul.png" },
  { key: "경기", label: "경기", image: "/images/gyeonggi.png" },
  { key: "인천", label: "인천", image: "/images/incheon.png" },
  { key: "부산", label: "부산", image: "/images/busan.png" },
];

export const getRegionQueryValue = (region: RegionKey): string | undefined => {
  if (region === "전체") return undefined;
  if (region === "서울") return "SEOUL";
  if (region === "경기") return "GYEONGGI";
  if (region === "부산") return "BUSAN";
  if (region === "인천") return "ETC"; // 서버 규약 유지
  return undefined;
};
