import { Navigate, Outlet, useLocation } from "react-router-dom";

interface ProtectedRoutesProps {
  isAuth: boolean;
}

const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ isAuth }) => {
  const location = useLocation();

  // 로그인 안 되어 있으면: 로그인 페이지로 보내되
  //    - replace: 히스토리 덮어쓰기 → 뒤로가기 시 이전 정상 페이지로 복귀
  //    - state.from: 로그인 후 원래 가려던 곳으로 보내기 위함
  return isAuth ? (
    <Outlet />
  ) : (
    <Navigate to="/log-in" replace state={{ from: location }} />
  );
};

export default ProtectedRoutes;
