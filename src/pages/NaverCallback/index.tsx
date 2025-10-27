// src/pages/NaverCallback/index.tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api/axios";

type UserRole = "CUSTOMER" | "OWNER";

export default function NaverCallback() {
  const once = useRef(false);
  const nav = useNavigate();

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code) return;

      let role: UserRole = "CUSTOMER";
      try {
        if (state) {
          const parsed = JSON.parse(decodeURIComponent(state));
          if (parsed?.role === "OWNER" || parsed?.role === "CUSTOMER")
            role = parsed.role;
        }
      } catch {}

      try {
        await api.post("/api/v1/auth/login", {
          code,
          socialProvider: "NAVER",
          userRole: role,
          state,
        });

        window.history.replaceState({}, "", "/");
        nav("/");
      } catch (e) {
        console.error(e);
        nav("/login?error=naver");
      }
    })();
  }, [nav]);

  return <div>로그인 처리 중…</div>;
}
