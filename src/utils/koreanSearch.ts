// utils/koreanSearch.ts

/**
 * 한글 초성 매칭 유틸
 * - query에 초성만 입력해도(예: ㄷㄹㅅ) 타겟의 초성 시퀀스에 부분일치하면 매칭
 * - query가 완성형 한글(예: 드레)일 때도 각 글자의 초성으로 변환해 초성-초성 비교를 함께 시도
 * - 영문/숫자/기타는 소문자 포함 비교
 */

const CHO = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

const HANGUL_BASE = 0xac00; // '가'
const CHO_INTERVAL = 588; // 21 * 28

export function getChosungString(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const choIndex = Math.floor((code - HANGUL_BASE) / CHO_INTERVAL);
      out += CHO[choIndex];
    } else {
      // 한글이 아니면 그대로 유지(영문/숫자 등)
      out += ch.toLowerCase();
    }
  }
  return out;
}

/**
 * 쿼리를 초성화.
 * - 완성형 한글은 초성으로 변환
 * - 초성 문자는 그대로 유지
 * - 그 외(영문/숫자/기타)는 소문자 그대로
 */
export function toChosungQuery(query: string): string {
  let out = "";
  for (const ch of query) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const choIndex = Math.floor((code - HANGUL_BASE) / CHO_INTERVAL);
      out += CHO[choIndex];
    } else {
      // 이미 초성 문자이거나 영문/숫자 등
      out += ch.toLowerCase();
    }
  }
  return out;
}

/**
 * 한국어 친화적 매칭:
 * 1) 기본 포함(match): target.toLowerCase().includes(queryLower)
 * 2) 초성 포함(match): getChosungString(target).includes(toChosungQuery(query))
 */
export function koreanFuzzyMatch(query: string, target: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = (target || "").toLowerCase();

  // 1) 일반 포함
  if (t.includes(q)) return true;

  // 2) 초성 비교
  const tCho = getChosungString(target || "");
  const qCho = toChosungQuery(query);
  return tCho.includes(qCho);
}
