import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import { kakaoLoginUser } from "../../../store/thunkFunctions";
import { readRoleFromState } from "../../../lib/auth/state";

export default function KakaoCallback() {
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

      if (!code) {
        nav("/log-in/client?error=missing_code");
        return;
      }

      const role = readRoleFromState(rawState);

      try {
        await dispatch(
          kakaoLoginUser({ code, state: rawState, role })
        ).unwrap();
        window.history.replaceState({}, "", "/");
        nav("/");
      } catch (e) {
        console.error("카카오 로그인 중 오류:", e);
        nav("/log-in/client?error=auth");
      }
    })();
  }, [dispatch, nav]);

  return <div>로그인 처리 중…</div>;
}
