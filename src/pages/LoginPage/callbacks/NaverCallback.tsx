import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/api/axios";
import { readRoleFromState, type UserRole } from "../../../lib/auth/state";

export default function NaverCallback() {
  const once = useRef(false);
  const nav = useNavigate();

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const rawState = url.searchParams.get("state");

      // 인가 코드 없으면 로그인 페이지로
      if (!code) {
        nav("/log-in/client?error=missing_code");
        return;
      }

      // 안전 파서 사용
      const role: UserRole = readRoleFromState(rawState);

      try {
        await api.post("/api/v1/auth/login", {
          code,
          socialProvider: "NAVER",
          userRole: role,
          state: rawState,
        });

        // URL 정리 후 홈으로 이동
        window.history.replaceState({}, "", "/");
        nav("/");
      } catch (e) {
        console.error("네이버 로그인 중 오류:", e);
        nav("/log-in/client?error=naver");
      }
    })();
  }, [nav]);

  return <div>로그인 처리 중…</div>;
}
