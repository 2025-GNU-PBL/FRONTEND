export type Chip = "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

export type Item = {
  id: string;
  title: string;
  category: Chip | "기타";
  time: string;
  preview: string;
  unread: number;
  muted: boolean;
  avatar?: string;
};

export type Message = {
  id: string;
  author: "me" | "partner";
  text: string;
  time: string;
  read?: boolean;
};

export const chips: readonly Chip[] = [
  "전체",
  "웨딩홀",
  "스튜디오",
  "드레스",
  "메이크업",
];

const AVATARS = [
  "https://m.veils.co.kr/web/product/big/202212/73716dbe5a71b0860c7be0e89c5503de.jpg",
  "https://i.pinimg.com/564x/00/f1/e3/00f1e3391b1a8d6e3c544332f7a43e49.jpg",
  "https://i.pinimg.com/564x/07/35/d8/0735d808dcf776f3f00a5f9175ecf918.jpg",
  "https://i.pinimg.com/564x/3b/01/a0/3b01a0521c7d2c18f1ad47b7410886a8.jpg",
];

export function makeItems(count = 120): Item[] {
  const categories: Chip[] = ["웨딩홀", "스튜디오", "드레스", "메이크업"];
  return Array.from({ length: count }, (_, i) => {
    const idx = i + 1;
    const cat = categories[i % categories.length];
    const title = `${cat} 업체 #${idx.toString().padStart(2, "0")}`;
    const previewPool = [
      "상세 견적과 예약 가능 일정을 확인해주세요.",
      "패키지 구성/원본 제공 범위를 안내드립니다.",
      "피팅 체크리스트와 진행 플로우 공유드립니다.",
      "리허설 포함 시 추가 금액 관련 안내입니다.",
      "방문 상담 가능 시간대 회신 부탁드립니다.",
    ];
    const preview = previewPool[i % previewPool.length];
    const minsAgo = (i % 59) + 1;
    const time =
      i % 7 === 0 ? "어제" : i % 11 === 0 ? "1주 전" : `${minsAgo}분 전`;
    const unread = i % 5 === 0 ? (i % 3) + 1 : 0;
    const muted = i % 9 === 0;
    const avatar = AVATARS[i % AVATARS.length];
    return {
      id: String(idx),
      title,
      category: cat,
      time,
      preview,
      unread,
      muted,
      avatar,
    };
  });
}

export function makeLongThread(id: string, lines = 80): Message[] {
  const msgs: Message[] = [];
  for (let i = 0; i < lines; i++) {
    const mine = i % 2 === 1;
    msgs.push({
      id: `t${id}-${i}`,
      author: mine ? "me" : "partner",
      text: mine
        ? `네, 확인했습니다. (#${i + 1}) 다음 단계 진행 부탁드려요.`
        : `안녕하세요! (#${i + 1}) 문의 주신 내용에 대해 안내드립니다.`,
      time: `오늘 10:${(10 + (i % 50)).toString().padStart(2, "0")}`,
      read: mine ? i % 4 === 0 : undefined,
    });
  }
  return msgs;
}

export const demoThread: Record<string, Message[]> = {
  "1": makeLongThread("1", 88),
  "2": [
    {
      id: "m1",
      author: "partner",
      text: "스냅/본식 패키지 견적 전달드립니다.",
      time: "8월 1일 13:22",
    },
    {
      id: "m2",
      author: "me",
      text: "자세한 구성표도 공유 가능할까요?",
      time: "8월 1일 13:29",
      read: true,
    },
    {
      id: "m3",
      author: "partner",
      text: "네, PDF로 첨부드렸습니다.",
      time: "8월 1일 13:33",
    },
  ],
  "3": makeLongThread("3", 60),
};
