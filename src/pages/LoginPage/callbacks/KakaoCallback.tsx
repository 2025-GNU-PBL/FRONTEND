// src/pages/LoginPage/callbacks/KakaoCallback.tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import {
  kakaoLoginUser,
  authCustomer,
  authOwner,
} from "../../../store/thunkFunctions";
import { readRoleFromState } from "../../../lib/auth/state";
import type {
  UserRole,
  CustomerData,
  OwnerData,
} from "../../../store/userSlice";

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
        nav("/log-in/client?error=missing_code", { replace: true });
        return;
      }

      const role = readRoleFromState(rawState) as UserRole | null;

      if (!role) {
        // 역할 정보 없으면 어디로 보내야 할지 모름 → 롤선택/로그인 페이지로 되돌림
        nav("/log-in/client?error=missing_role", { replace: true });
        return;
      }

      try {
        //  카카오 로그인: accessToken 저장 + userSlice.role(임시) 세팅
        await dispatch(
          kakaoLoginUser({ code, state: rawState, role })
        ).unwrap();

        //  역할에 따라 내 정보 조회(auth*) → 최초 로그인 여부 판단
        if (role === "CUSTOMER") {
          const customer = (await dispatch(
            authCustomer()
          ).unwrap()) as CustomerData;

          // 필수 필드가 비어 있으면 "회원가입 진행 필요"
          const needSignup = !customer.phoneNumber;

          if (needSignup) {
            nav("/sign-up/client/step1", { replace: true });
          } else {
            nav("/", { replace: true }); // 고객 메인
          }
        } else {
          const owner = (await dispatch(authOwner()).unwrap()) as OwnerData;

          // 사업자번호/정산계좌 없으면 최초 로그인으로 간주
          const needSignup = !owner.bzNumber;

          if (needSignup) {
            nav("/sign-up/owner/step1", { replace: true });
          } else {
            nav("/owner", { replace: true }); // 사장 메인(대시보드) 경로로 맞춰줘
          }
        }
      } catch (e) {
        console.error("카카오 로그인 중 오류:", e);
        nav("/log-in/client?error=auth", { replace: true });
      }
    })();
  }, [dispatch, nav]);

  return (
    <div className="w-full h-screen flex items-center justify-center text-sm text-gray-500">
      로그인 처리 중입니다...
    </div>
  );
}
