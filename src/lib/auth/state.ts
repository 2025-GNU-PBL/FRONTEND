export type UserRole = "CUSTOMER" | "OWNER";

export function readRoleFromState(state: string | null | undefined): UserRole {
  if (!state) return "CUSTOMER";

  try {
    const decoded = decodeURIComponent(state);

    // 평문 ("CUSTOMER" or "OWNER")
    if (decoded === "CUSTOMER" || decoded === "OWNER") {
      return decoded;
    }

    // JSON 형태 {"role":"CUSTOMER"}
    const parsed = JSON.parse(decoded);
    if (parsed?.role === "CUSTOMER" || parsed?.role === "OWNER") {
      return parsed.role;
    }
  } catch {
    // 무시하고 기본값 반환
  }

  return "CUSTOMER";
}
