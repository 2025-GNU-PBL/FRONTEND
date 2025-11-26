import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import {
  naverLoginUser,
  authCustomer,
  authOwner,
} from "../../../store/thunkFunctions";
import { readRoleFromState } from "../../../lib/auth/state";
import type {
  UserRole,
  CustomerData,
  OwnerData,
} from "../../../store/userSlice";

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
        // 네이버 로그인 요청 → accessToken 저장 + 임시 role 세팅
        await dispatch(
          naverLoginUser({ code, state: rawState, role })
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
            nav("/", { replace: true });
          }
        } else {
          const owner = (await dispatch(authOwner()).unwrap()) as OwnerData;

          // 사업자번호/정산계좌 없으면 최초 로그인으로 간주
          const needSignup = !owner.bzNumber;

          if (needSignup) {
            nav("/sign-up/owner/step1", { replace: true });
          } else {
            nav("/", { replace: true });
          }
        }
      } catch (e) {
        console.error("네이버 로그인 중 오류:", e);
        nav("/log-in/client?error=auth", { replace: true });
      }
    })();
  }, [dispatch, nav]);

  return <div>로그인 처리 중…</div>;
}
