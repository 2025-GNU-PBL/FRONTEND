// src/hooks/useRefreshAuth.ts
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { authCustomer, authOwner } from "../store/thunkFunctions";

export const useRefreshAuth = () => {
  const dispatch = useAppDispatch();
  const { role, isAuth } = useAppSelector((state) => state.user);

  const refreshAuth = useCallback(() => {
    if (!isAuth) return;

    if (role === "CUSTOMER") {
      dispatch(authCustomer());
    } else if (role === "OWNER") {
      dispatch(authOwner());
    }
  }, [dispatch, role, isAuth]);

  return { refreshAuth };
};
