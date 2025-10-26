// src/pages/KakaoCallback/index.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithKakao } from "../../lib/auth/api";
import type { UserRole } from "../../lib/auth/types";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function KakaoCallback() {
  const q = useQuery();
  const navigate = useNavigate();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = q.get("code");
    const rawState = q.get("state");

    if (!code || !rawState) {
      setError("code/state가 없습니다.");
      return;
    }

    let role: UserRole = "CUSTOMER";
    try {
      const parsed = JSON.parse(decodeURIComponent(rawState));
      role = (String(parsed.role).toUpperCase() as UserRole) || "CUSTOMER";
    } catch {
      // 그대로 CUSTOMER
    }

    (async () => {
      try {
        const { accessToken } = await loginWithKakao({ code, role });
        // 저장 (원하는 저장소 사용)
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("userRole", role);

        navigate("/main", { replace: true });
      } catch (e: any) {
        console.error(e?.response?.data || e);
        setError(
          e?.response?.data?.message || "로그인 처리 중 오류가 발생했습니다."
        );
      }
    })();
  }, [navigate, q]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <h1 className="text-xl font-bold mb-2">오류</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>로그인 처리 중…</div>
    </div>
  );
}
