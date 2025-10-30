import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import { naverLoginUser } from "../../../store/thunkFunctions";
import { readRoleFromState } from "../../../lib/auth/state";

export default function NaverCallback() {
  const once = useRef(false);
  const nav = useNavigate();
  const dispatch = useAppDispatch();

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

      // state → role 변환
      const role = readRoleFromState(rawState);

      try {
        // ✅ Redux 비동기 thunk 호출
        await dispatch(
          naverLoginUser({ code, state: rawState, role })
        ).unwrap();

        // URL 정리 후 홈으로 이동
        window.history.replaceState({}, "", "/");
        nav("/");
      } catch (e) {
        console.error("네이버 로그인 중 오류:", e);
        nav("/log-in/client?error=naver");
      }
    })();
  }, [dispatch, nav]);

  return <div>로그인 처리 중…</div>;
}
