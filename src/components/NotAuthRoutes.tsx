import { Navigate, Outlet, useLocation } from "react-router-dom";

interface NotAuthRoutesProps {
  isAuth: boolean;
}

const NotAuthRoutes: React.FC<NotAuthRoutesProps> = ({ isAuth }) => {
  const location = useLocation();
  // 이미 로그인된 사용자가 /log-in 등 비인증 전용 페이지로 오면
  // 돌아갈 곳(from) 있으면 거기로, 없으면 홈으로.
  const fallback = (location.state as any)?.from?.pathname || "/";

  return !isAuth ? <Outlet /> : <Navigate to={fallback} replace />;
};

export default NotAuthRoutes;
