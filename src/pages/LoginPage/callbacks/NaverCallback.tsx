// src/pages/LoginPage/callbacks/NaverCallback.tsx

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import {
  naverLoginUser,
  authCustomer,
  authOwner,
} from "../../../store/thunkFunctions";
import { readRoleFromState } from "../../../lib/auth/state";
import type { UserRole } from "../../../store/userSlice";

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

      // state → role 변환 (CUSTOMER / OWNER)
      const role = readRoleFromState(rawState) as UserRole | null;

      if (!role) {
        // role 정보 없으면 그냥 클라이언트 로그인 페이지로 돌려보냄
        nav("/log-in/client?error=invalid_state");
        return;
      }

      try {
        // 1) 네이버 로그인 요청 → accessToken 저장 + 임시 role 세팅
        await dispatch(
          naverLoginUser({ code, state: rawState, role })
        ).unwrap();

        // 2) 토큰으로 실제 프로필 조회해서 "최초 로그인 여부" 판별
        if (role === "CUSTOMER") {
          try {
            await dispatch(authCustomer()).unwrap();
            // 고객 정보가 존재하면 기존 회원 → 메인 이동
            window.history.replaceState({}, "", "/");
            nav("/");
          } catch {
            // 고객 정보 없으면 최초 로그인 → 고객 회원가입 페이지
            window.history.replaceState({}, "", "/sign-up/client/step1");
            nav("/sign-up/client/step1");
          }
        } else if (role === "OWNER") {
          try {
            await dispatch(authOwner()).unwrap();
            // 사장 정보 존재 → 사장 메인(or 공통 메인)으로
            window.history.replaceState({}, "", "/");
            nav("/owner"); // 팀 규칙에 따라 "/" 로 바꿔도 됨
          } catch {
            // 사장 정보 없으면 최초 로그인 → 사장 회원가입 페이지
            window.history.replaceState({}, "", "/sign-up/owner/step1");
            nav("/sign-up/owner/step1");
          }
        } else {
          // safety fallback
          window.history.replaceState({}, "", "/");
          nav("/");
        }
      } catch (e) {
        console.error("네이버 로그인 중 오류:", e);
        nav("/log-in/client?error=naver");
      }
    })();
  }, [dispatch, nav]);

  return <div>로그인 처리 중…</div>;
}
